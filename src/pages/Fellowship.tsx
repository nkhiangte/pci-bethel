import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { Ministry, KTPHruaitute, KTPBudget, KTPMember, KTPGroup, KTPSubCommittee, BudgetItem } from '../types';
import { getConstants } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Clock, Users, Calendar, Loader, Home, Book, List, History, Camera, Video, UserSquare, 
  Edit, Save, X, Trash2, Plus, DollarSign, Table as TableIcon,
  Download, FileUp, FileDown, TrendingUp, Phone, MessageCircle, AlertTriangle,
  FileText, ChevronRight, FolderOpen, Eye, Archive
} from 'lucide-react';
import * as XLSX from 'xlsx';

// ─────────────────────────────────────────────────────────────
// MINUTES ARCHIVES COMPONENT
// ─────────────────────────────────────────────────────────────

interface MinutesPdf {
  id: string;
  name: string;
  url: string;
  uploadedAt: string; // ISO string
  storagePath: string;
}

interface MinutesYear {
  id: string;       // doc id = the year string e.g. "2024"
  year: string;
  pdfs: MinutesPdf[];
}

const MinutesArchives: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
  const [years, setYears] = useState<MinutesYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<MinutesYear | null>(null);
  const [addingYear, setAddingYear] = useState(false);
  const [newYearInput, setNewYearInput] = useState('');
  const [yearError, setYearError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingPdf, setViewingPdf] = useState<MinutesPdf | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch all year documents ──────────────────────────────
  const fetchYears = useCallback(async () => {
    setLoading(true);
    if (!db?.collection) { setLoading(false); return; }
    try {
      const snap = await db.collection('ktpMinutesArchives').orderBy('year', 'desc').get();
      const docs: MinutesYear[] = snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<MinutesYear, 'id'>),
      }));
      setYears(docs);
      // Keep selected year in sync
      if (selectedYear) {
        const updated = docs.find(d => d.id === selectedYear.id);
        setSelectedYear(updated ?? null);
      }
    } catch (e) {
      console.error('Failed to fetch minutes archives:', e);
    }
    setLoading(false);
  }, [selectedYear?.id]);

  useEffect(() => { fetchYears(); }, []);

  // ── Add Year ──────────────────────────────────────────────
  const handleAddYear = async () => {
    const yr = newYearInput.trim();
    if (!yr || !/^\d{4}$/.test(yr)) { setYearError('Please enter a valid 4-digit year.'); return; }
    if (years.some(y => y.year === yr)) { setYearError('This year already exists.'); return; }
    setYearError('');
    try {
      const newDoc: Omit<MinutesYear, 'id'> = { year: yr, pdfs: [] };
      await db.collection('ktpMinutesArchives').doc(yr).set(newDoc);
      setNewYearInput('');
      setAddingYear(false);
      await fetchYears();
    } catch (e) {
      alert('Failed to add year.');
    }
  };

  // ── Delete Year ───────────────────────────────────────────
  const handleDeleteYear = async (yearDoc: MinutesYear) => {
    if (!window.confirm(`Delete the entire year ${yearDoc.year} and all its PDFs? This cannot be undone.`)) return;
    try {
      // Delete files from storage
      const storage = (await import('../services/firebase')).storage;
      if (storage && yearDoc.pdfs?.length) {
        for (const pdf of yearDoc.pdfs) {
          try {
            await storage.ref(pdf.storagePath).delete();
          } catch (_) { /* ignore missing files */ }
        }
      }
      await db.collection('ktpMinutesArchives').doc(yearDoc.id).delete();
      if (selectedYear?.id === yearDoc.id) setSelectedYear(null);
      await fetchYears();
    } catch (e) {
      alert('Failed to delete year.');
    }
  };

  // ── Upload PDF ────────────────────────────────────────────
  const handleUploadPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedYear || !e.target.files?.length) return;
    const file = e.target.files[0];
    if (file.type !== 'application/pdf') { alert('Only PDF files are allowed.'); return; }

    setUploading(true);
    setUploadProgress('Uploading…');

    try {
      const storage = (await import('../services/firebase')).storage;
      if (!storage) throw new Error('Storage not available');

      const storagePath = `ktpMinutes/${selectedYear.year}/${Date.now()}_${file.name}`;
      const ref = storage.ref(storagePath);
      await ref.put(file);
      const url = await ref.getDownloadURL();

      const newPdf: MinutesPdf = {
        id: `pdf_${Date.now()}`,
        name: file.name,
        url,
        storagePath,
        uploadedAt: new Date().toISOString(),
      };

      const docRef = db.collection('ktpMinutesArchives').doc(selectedYear.year);
      const snap = await docRef.get();
      const existing: MinutesPdf[] = (snap.data() as MinutesYear)?.pdfs ?? [];
      await docRef.update({ pdfs: [...existing, newPdf] });

      setUploadProgress('');
      await fetchYears();
    } catch (err) {
      console.error(err);
      alert('Upload failed. Make sure Firebase Storage is configured.');
      setUploadProgress('');
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Delete PDF ────────────────────────────────────────────
  const handleDeletePdf = async (pdf: MinutesPdf) => {
    if (!selectedYear || !window.confirm(`Delete "${pdf.name}"?`)) return;
    setDeletingId(pdf.id);
    try {
      const storage = (await import('../services/firebase')).storage;
      if (storage) {
        try { await storage.ref(pdf.storagePath).delete(); } catch (_) {}
      }
      const docRef = db.collection('ktpMinutesArchives').doc(selectedYear.year);
      const snap = await docRef.get();
      const existing: MinutesPdf[] = (snap.data() as MinutesYear)?.pdfs ?? [];
      await docRef.update({ pdfs: existing.filter(p => p.id !== pdf.id) });
      await fetchYears();
    } catch (e) {
      alert('Failed to delete PDF.');
    }
    setDeletingId(null);
  };

  // ── Format date ───────────────────────────────────────────
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  // ── PDF Viewer Modal ──────────────────────────────────────
  const PdfViewerModal: React.FC<{ pdf: MinutesPdf; onClose: () => void }> = ({ pdf, onClose }) => (
    <div className="fixed inset-0 z-50 bg-black/70 flex flex-col backdrop-blur-sm">
      <div className="bg-church-900 text-white px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <FileText size={18} className="text-yellow-400 shrink-0" />
          <span className="font-semibold truncate">{pdf.name}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <a
            href={pdf.url}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400 text-church-900 rounded-lg text-sm font-bold hover:bg-yellow-300"
          >
            <Download size={14} /> Download
          </a>
          <button onClick={onClose} className="p-1.5 hover:bg-church-700 rounded-lg">
            <X size={20} />
          </button>
        </div>
      </div>
      <iframe
        src={`${pdf.url}#toolbar=1`}
        className="flex-1 w-full border-none"
        title={pdf.name}
      />
    </div>
  );

  // ─────────────────────────── RENDER ──────────────────────
  return (
    <div className="animate-in fade-in duration-300">
      {/* PDF Viewer Modal */}
      {viewingPdf && <PdfViewerModal pdf={viewingPdf} onClose={() => setViewingPdf(null)} />}

      <div className="flex gap-6">
        {/* ── Left Panel: Year List ─────────────────────── */}
        <div className="w-52 shrink-0 space-y-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Years</h3>
            {isAdmin && (
              <button
                onClick={() => setAddingYear(true)}
                className="p-1 rounded-lg bg-church-600 text-white hover:bg-church-700"
                title="Add Year"
              >
                <Plus size={14} />
              </button>
            )}
          </div>

          {/* Add year inline input */}
          {addingYear && isAdmin && (
            <div className="mb-2">
              <input
                autoFocus
                type="number"
                placeholder="e.g. 2024"
                value={newYearInput}
                onChange={e => { setNewYearInput(e.target.value); setYearError(''); }}
                onKeyDown={e => { if (e.key === 'Enter') handleAddYear(); if (e.key === 'Escape') setAddingYear(false); }}
                className="w-full border border-church-400 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-church-500 outline-none"
              />
              {yearError && <p className="text-red-500 text-xs mt-1">{yearError}</p>}
              <div className="flex gap-1 mt-1.5">
                <button
                  onClick={handleAddYear}
                  className="flex-1 py-1 bg-church-600 text-white text-xs font-bold rounded-lg hover:bg-church-700"
                >
                  Add
                </button>
                <button
                  onClick={() => { setAddingYear(false); setYearError(''); setNewYearInput(''); }}
                  className="flex-1 py-1 border text-xs rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-8"><Loader className="animate-spin text-church-500" size={20} /></div>
          ) : years.length === 0 ? (
            <p className="text-slate-400 text-sm italic text-center py-6">No years yet.</p>
          ) : (
            years.map(yr => (
              <div
                key={yr.id}
                className={`group flex items-center justify-between rounded-xl px-3 py-2.5 cursor-pointer transition-all ${
                  selectedYear?.id === yr.id
                    ? 'bg-church-600 text-white shadow'
                    : 'hover:bg-slate-100 text-slate-700'
                }`}
                onClick={() => setSelectedYear(yr)}
              >
                <div className="flex items-center gap-2">
                  <FolderOpen size={15} className={selectedYear?.id === yr.id ? 'text-yellow-300' : 'text-church-400'} />
                  <span className="font-bold text-sm">{yr.year}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                    selectedYear?.id === yr.id ? 'bg-church-500 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {yr.pdfs?.length ?? 0}
                  </span>
                </div>
                {isAdmin && (
                  <button
                    onClick={e => { e.stopPropagation(); handleDeleteYear(yr); }}
                    className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity ${
                      selectedYear?.id === yr.id ? 'text-red-300 hover:text-red-100' : 'text-red-400 hover:text-red-600'
                    }`}
                    title="Delete year"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* ── Right Panel: PDF List ─────────────────────── */}
        <div className="flex-1 min-w-0">
          {!selectedYear ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <Archive size={40} className="mb-3 opacity-40" />
              <p className="font-semibold">Select a year to view minutes</p>
              {isAdmin && <p className="text-sm mt-1">Or add a new year using the + button</p>}
            </div>
          ) : (
            <div>
              {/* Year header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="bg-church-600 text-white rounded-xl p-2">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{selectedYear.year} Minutes</h3>
                    <p className="text-slate-400 text-sm">{selectedYear.pdfs?.length ?? 0} document{(selectedYear.pdfs?.length ?? 0) !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                {isAdmin && (
                  <div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-2 px-4 py-2 bg-church-600 text-white rounded-xl font-bold text-sm hover:bg-church-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {uploading ? (
                        <><Loader className="animate-spin" size={15} /> {uploadProgress}</>
                      ) : (
                        <><FileUp size={15} /> Upload PDF</>
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={handleUploadPdf}
                    />
                  </div>
                )}
              </div>

              {/* PDF list */}
              {!selectedYear.pdfs || selectedYear.pdfs.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
                  <FileText size={32} className="mb-2 opacity-40" />
                  <p className="font-medium">No documents yet</p>
                  {isAdmin && <p className="text-sm mt-1">Click "Upload PDF" to add minutes</p>}
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedYear.pdfs.map((pdf, idx) => (
                    <div
                      key={pdf.id}
                      className="flex items-center gap-4 bg-white border border-slate-100 rounded-xl px-4 py-3 hover:shadow-sm transition-shadow group"
                    >
                      {/* Index */}
                      <div className="w-7 h-7 rounded-full bg-church-50 text-church-700 flex items-center justify-center text-xs font-bold shrink-0">
                        {idx + 1}
                      </div>
                      {/* File icon */}
                      <div className="p-2 bg-red-50 rounded-lg shrink-0">
                        <FileText size={18} className="text-red-500" />
                      </div>
                      {/* Name + date */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 truncate text-sm">{pdf.name}</p>
                        <p className="text-slate-400 text-xs">Uploaded {formatDate(pdf.uploadedAt)}</p>
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setViewingPdf(pdf)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-church-50 text-church-700 rounded-lg text-xs font-bold hover:bg-church-100 transition"
                          title="View PDF"
                        >
                          <Eye size={13} /> View
                        </button>
                        <a
                          href={pdf.url}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 transition"
                          title="Download"
                        >
                          <Download size={13} /> Download
                        </a>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeletePdf(pdf)}
                            disabled={deletingId === pdf.id}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingId === pdf.id ? <Loader className="animate-spin" size={14} /> : <Trash2 size={14} />}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// YEARLY REPORTS COMPONENT
// ─────────────────────────────────────────────────────────────

interface YearlyReportModalProps {
  report: Partial<KTPYearlyReport> | null;
  onSave: (reportData: KTPYearlyReport) => void;
  onClose: () => void;
  isLoading: boolean;
}

const YearlyReportModal: React.FC<YearlyReportModalProps> = ({ report, onSave, onClose, isLoading }) => {
  const [reportData, setReportData] = useState<Partial<KTPYearlyReport>>({
    year: new Date().getFullYear(),
    officeBearers: [],
    statistics: { totalMembers: 0, male: 0, female: 0 },
    ministries: []
  });

  useEffect(() => {
    if (report) {
      setReportData({
        ...report,
        officeBearers: report.officeBearers ? [...report.officeBearers] : [],
        statistics: report.statistics ? { ...report.statistics } : { totalMembers: 0, male: 0, female: 0 },
        ministries: report.ministries ? [...report.ministries] : []
      });
    }
  }, [report]);

  const handleAddOB = () => {
    const newOB: KTPMember = { id: `ob_${Date.now()}`, name: '', role: '' };
    setReportData({ ...reportData, officeBearers: [...(reportData.officeBearers || []), newOB] });
  };

  const handleAddMinistry = () => {
    const newMin = { id: `min_${Date.now()}`, name: '', description: '', achievements: '' };
    setReportData({ ...reportData, ministries: [...(reportData.ministries || []), newMin] });
  };

  const handleSave = () => {
    onSave(reportData as KTPYearlyReport);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h3 className="text-xl font-bold">{reportData.id ? 'Edit Yearly Report' : 'Add Yearly Report'}</h3>
          <button onClick={onClose}><X size={20}/></button>
        </div>
        <div className="p-6 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Year</label>
              <input 
                type="number"
                className="w-full border p-2 rounded-lg" 
                value={reportData.year || ''}
                onChange={e => setReportData({ ...reportData, year: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Total Members</label>
              <input 
                type="number"
                className="w-full border p-2 rounded-lg" 
                value={reportData.statistics?.totalMembers || 0}
                onChange={e => setReportData({ ...reportData, statistics: { ...reportData.statistics!, totalMembers: parseInt(e.target.value) } })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Male</label>
              <input 
                type="number"
                className="w-full border p-2 rounded-lg" 
                value={reportData.statistics?.male || 0}
                onChange={e => setReportData({ ...reportData, statistics: { ...reportData.statistics!, male: parseInt(e.target.value) } })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Female</label>
              <input 
                type="number"
                className="w-full border p-2 rounded-lg" 
                value={reportData.statistics?.female || 0}
                onChange={e => setReportData({ ...reportData, statistics: { ...reportData.statistics!, female: parseInt(e.target.value) } })}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-bold text-slate-800">Office Bearers</h4>
              <button onClick={handleAddOB} className="text-xs font-bold text-church-600 flex items-center gap-1 hover:underline">
                <Plus size={14}/> Add OB
              </button>
            </div>
            <div className="space-y-2">
              {reportData.officeBearers?.map((ob, idx) => (
                <div key={ob.id} className="flex gap-2">
                  <input 
                    placeholder="Name" 
                    className="flex-1 border p-2 rounded-lg text-sm" 
                    value={ob.name} 
                    onChange={e => {
                      const obs = [...reportData.officeBearers!];
                      obs[idx].name = e.target.value;
                      setReportData({ ...reportData, officeBearers: obs });
                    }}
                  />
                  <input 
                    placeholder="Role" 
                    className="flex-1 border p-2 rounded-lg text-sm" 
                    value={ob.role} 
                    onChange={e => {
                      const obs = [...reportData.officeBearers!];
                      obs[idx].role = e.target.value;
                      setReportData({ ...reportData, officeBearers: obs });
                    }}
                  />
                  <button 
                    onClick={() => setReportData({ ...reportData, officeBearers: reportData.officeBearers!.filter((_, i) => i !== idx) })}
                    className="p-2 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-bold text-slate-800">Ministries & Achievements</h4>
              <button onClick={handleAddMinistry} className="text-xs font-bold text-church-600 flex items-center gap-1 hover:underline">
                <Plus size={14}/> Add Ministry
              </button>
            </div>
            <div className="space-y-4">
              {reportData.ministries?.map((min, idx) => (
                <div key={min.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex gap-2">
                    <input 
                      placeholder="Ministry Name" 
                      className="flex-1 border p-2 rounded-lg text-sm font-bold" 
                      value={min.name} 
                      onChange={e => {
                        const mins = [...reportData.ministries!];
                        mins[idx].name = e.target.value;
                        setReportData({ ...reportData, ministries: mins });
                      }}
                    />
                    <button 
                      onClick={() => setReportData({ ...reportData, ministries: reportData.ministries!.filter((_, i) => i !== idx) })}
                      className="p-2 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <textarea 
                    placeholder="Description" 
                    className="w-full border p-2 rounded-lg text-sm h-20" 
                    value={min.description}
                    onChange={e => {
                      const mins = [...reportData.ministries!];
                      mins[idx].description = e.target.value;
                      setReportData({ ...reportData, ministries: mins });
                    }}
                  />
                  <textarea 
                    placeholder="Achievements" 
                    className="w-full border p-2 rounded-lg text-sm h-20" 
                    value={min.achievements}
                    onChange={e => {
                      const mins = [...reportData.ministries!];
                      mins[idx].achievements = e.target.value;
                      setReportData({ ...reportData, ministries: mins });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 bg-slate-100 flex justify-end gap-3 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
          <button onClick={handleSave} className="px-6 py-2 bg-church-600 text-white rounded-lg flex items-center font-bold">
            {isLoading ? <Loader className="animate-spin mr-2" size={16}/> : <Save size={16} className="mr-2"/>} Save Report
          </button>
        </div>
      </div>
    </div>
  );
};

const YearlyReports: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
  const [reports, setReports] = useState<KTPYearlyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<KTPYearlyReport | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<KTPYearlyReport | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    if (!db?.collection) { setLoading(false); return; }
    try {
      const snap = await db.collection('ktpYearlyReports').orderBy('year', 'desc').get();
      const docs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as KTPYearlyReport));
      setReports(docs);
      if (docs.length > 0 && !selectedReport) setSelectedReport(docs[0]);
      else if (selectedReport) {
        const updated = docs.find((d: any) => d.id === selectedReport.id);
        setSelectedReport(updated || (docs.length > 0 ? docs[0] : null));
      }
    } catch (e) {
      console.error('Error fetching yearly reports:', e);
      handleFirestoreError(e, OperationType.GET, 'ktpYearlyReports');
    }
    setLoading(false);
  }, [selectedReport]);

  useEffect(() => { fetchReports(); }, []);

  const handleSaveReport = async (reportData: KTPYearlyReport) => {
    if (!db) return;
    setIsSaving(true);
    try {
      const { id, ...data } = reportData;
      if (id) {
        await db.collection('ktpYearlyReports').doc(id).set({ ...data, createdAt: data.createdAt || new Date().toISOString() }, { merge: true });
      } else {
        await db.collection('ktpYearlyReports').add({ ...data, createdAt: new Date().toISOString() });
      }
      setIsModalOpen(false);
      fetchReports();
    } catch (e) {
      console.error(e);
      alert("Failed to save report.");
    }
    setIsSaving(false);
  };

  const handleDeleteReport = async (id: string) => {
    if (!db || !window.confirm("Delete this report?")) return;
    try {
      await db.collection('ktpYearlyReports').doc(id).delete();
      if (selectedReport?.id === id) setSelectedReport(null);
      fetchReports();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Year Selector */}
        <div className="w-full md:w-48 shrink-0 space-y-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Years</h3>
            {isAdmin && (
              <button 
                onClick={() => { setEditingReport(null); setIsModalOpen(true); }}
                className="p-1 rounded-lg bg-church-600 text-white hover:bg-church-700"
              >
                <Plus size={14} />
              </button>
            )}
          </div>
          <div className="flex md:flex-col gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
            {loading ? (
              <div className="flex justify-center py-4 w-full"><Loader className="animate-spin text-church-500" size={20} /></div>
            ) : reports.length === 0 ? (
              <p className="text-slate-400 text-xs italic text-center py-4 w-full">No reports.</p>
            ) : (
              reports.map(report => (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className={`flex items-center justify-between rounded-xl px-4 py-2.5 transition-all whitespace-nowrap ${
                    selectedReport?.id === report.id
                      ? 'bg-church-600 text-white shadow-md'
                      : 'bg-white border border-slate-100 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-bold">{report.year}</span>
                  {isAdmin && selectedReport?.id === report.id && (
                    <div className="flex gap-1 ml-2">
                      <button onClick={(e) => { e.stopPropagation(); setEditingReport(report); setIsModalOpen(true); }} className="p-1 hover:bg-church-500 rounded text-white"><Edit size={12}/></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteReport(report.id); }} className="p-1 hover:bg-church-500 rounded text-white"><Trash2 size={12}/></button>
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Report Content */}
        <div className="flex-1 min-w-0">
          {!selectedReport ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-white rounded-2xl border border-slate-100">
              <FileText size={40} className="mb-3 opacity-20" />
              <p className="font-semibold">Select a year to view the report</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Card */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Yearly Report {selectedReport.year}</h2>
                  <div className="bg-church-50 text-church-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    Annual Summary
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Members</p>
                    <p className="text-2xl font-black text-church-700">{selectedReport.statistics.totalMembers}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-xl text-center">
                    <p className="text-xs font-bold text-blue-400 uppercase mb-1">Male</p>
                    <p className="text-2xl font-black text-blue-700">{selectedReport.statistics.male}</p>
                  </div>
                  <div className="bg-pink-50 p-4 rounded-xl text-center">
                    <p className="text-xs font-bold text-pink-400 uppercase mb-1">Female</p>
                    <p className="text-2xl font-black text-pink-700">{selectedReport.statistics.female}</p>
                  </div>
                </div>
              </div>

              {/* Office Bearers */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <UserSquare size={20} className="text-church-600" />
                  Office Bearers
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedReport.officeBearers.map((ob, i) => (
                    <div key={i} className="flex flex-col p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-xs font-bold text-slate-400 uppercase">{ob.role}</span>
                      <span className="font-bold text-slate-800">{ob.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ministries & Achievements */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 px-2">
                  <TrendingUp size={20} className="text-church-600" />
                  Ministries & Achievements
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {selectedReport.ministries.map((min, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                      <h4 className="text-lg font-bold text-church-700 mb-2">{min.name}</h4>
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Description</p>
                          <p className="text-slate-600 text-sm leading-relaxed">{min.description}</p>
                        </div>
                        {min.achievements && (
                          <div className="bg-yellow-50/50 p-4 rounded-xl border border-yellow-100">
                            <p className="text-xs font-bold text-yellow-700 uppercase mb-1">Key Achievements</p>
                            <p className="text-slate-700 text-sm italic leading-relaxed">{min.achievements}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <YearlyReportModal 
          report={editingReport}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveReport}
          isLoading={isSaving}
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// KTP HISTORY COMPONENT (wraps sub-pages)
// ─────────────────────────────────────────────────────────────

const KtpHistory: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
  const historySubPages = [
    { id: 'overview', label: 'Overview', icon: History },
    { id: 'minutes', label: 'Minutes Archives', icon: Archive },
    { id: 'yearly-reports', label: 'Yearly Reports', icon: FileText },
  ];
  const [activeSub, setActiveSub] = useState('overview');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Sub-page navigation */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex border-b border-slate-100 overflow-x-auto no-scrollbar">
          {historySubPages.map(page => (
            <button
              key={page.id}
              onClick={() => setActiveSub(page.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-colors whitespace-nowrap ${
                activeSub === page.id
                  ? 'border-b-2 border-church-600 text-church-700 bg-church-50/50'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <page.icon size={16} />
              {page.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeSub === 'overview' && (
            <div className="text-slate-500 italic text-center py-12">
              History overview content goes here…
            </div>
          )}
          {activeSub === 'minutes' && (
            <MinutesArchives isAdmin={isAdmin} />
          )}
          {activeSub === 'yearly-reports' && (
            <YearlyReports isAdmin={isAdmin} />
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// KTP SPECIFIC COMPONENTS (unchanged)
// ─────────────────────────────────────────────────────────────

const GroupEditModal: React.FC<{
  group: Partial<KTPGroup> | null;
  onSave: (groupData: KTPGroup) => void;
  onClose: () => void;
  isLoading: boolean;
}> = ({ group, onSave, onClose, isLoading }) => {
  const [groupData, setGroupData] = useState<Partial<KTPGroup>>({ id: '', groupName: '', members: [] });

  useEffect(() => {
    if (group) {
      setGroupData({ ...group, members: group.members ? [...group.members] : [] });
    }
  }, [group]);

  const handleMemberChange = (index: number, field: keyof KTPMember, value: string) => {
    const updatedMembers = [...(groupData.members || [])];
    updatedMembers[index] = { ...updatedMembers[index], [field]: value };
    setGroupData({ ...groupData, members: updatedMembers });
  };

  const addMember = () => {
    const newMember: KTPMember = { id: `mem_${Date.now()}`, name: '', role: '', phone: '' };
    setGroupData({ ...groupData, members: [...(groupData.members || []), newMember] });
  };
  
  const removeMember = (index: number) => {
    const updatedMembers = (groupData.members || []).filter((_, i) => i !== index);
    setGroupData({ ...groupData, members: updatedMembers });
  };

  const handleSave = () => {
    onSave(groupData as KTPGroup);
  };
  
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h3 className="text-xl font-bold">{groupData.id ? 'Edit Group' : 'Add New Group'}</h3>
          <button onClick={onClose}><X size={20}/></button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Group Name</label>
            <input 
              className="w-full border p-2 rounded-lg" 
              value={groupData.groupName || ''}
              onChange={e => setGroupData({ ...groupData, groupName: e.target.value })}
              placeholder="e.g., Matea Group"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Members</label>
            <div className="space-y-3">
              {(groupData.members || []).map((member, index) => (
                <div key={member.id || index} className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 bg-slate-50 rounded-lg border">
                  <input className="border p-2 rounded-md text-sm" placeholder="Name" value={member.name} onChange={e => handleMemberChange(index, 'name', e.target.value)} />
                  <input className="border p-2 rounded-md text-sm" placeholder="Role" value={member.role} onChange={e => handleMemberChange(index, 'role', e.target.value)} />
                  <div className="flex gap-2">
                    <input className="flex-1 border p-2 rounded-md text-sm" placeholder="Phone" value={member.phone} onChange={e => handleMemberChange(index, 'phone', e.target.value)} />
                    <button onClick={() => removeMember(index)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={addMember} className="mt-3 text-sm font-bold text-church-600 flex items-center gap-1 hover:underline">
              <Plus size={14}/> Add Member
            </button>
          </div>
        </div>
        <div className="p-4 bg-slate-100 flex justify-end gap-3 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
          <button onClick={handleSave} className="px-6 py-2 bg-church-600 text-white rounded-lg flex items-center">
            {isLoading ? <Loader className="animate-spin mr-2" size={16}/> : <Save size={16} className="mr-2"/>} Save
          </button>
        </div>
      </div>
    </div>
  );
};

const KtpLeaders: React.FC<{ data: KTPHruaitute | null | undefined, isAdmin: boolean, onUpdate: () => void }> = ({ data, isAdmin, onUpdate }) => {
  if (!data) return <div className="p-8 bg-white rounded-xl shadow-sm text-center"><Loader className="animate-spin mx-auto"/></div>;

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Partial<KTPGroup> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleAddNewGroup = () => {
    setEditingGroup({ id: '', groupName: '', members: [] });
    setIsGroupModalOpen(true);
  };

  const handleEditGroup = (group: KTPGroup) => {
    setEditingGroup(group);
    setIsGroupModalOpen(true);
  };

  const handleSaveGroup = async (groupData: KTPGroup) => {
    if (!db) return;
    setIsSaving(true);
    try {
        const docRef = db.collection('ktpLeaders').doc(String(data.year));
        const doc = await docRef.get();
        const currentData = doc.data() as KTPHruaitute;
        let updatedGroups = [...(currentData.groupLeaders || [])];

        if (groupData.id) {
            const index = updatedGroups.findIndex(g => g.id === groupData.id);
            if (index > -1) updatedGroups[index] = groupData;
        } else {
            updatedGroups.push({ ...groupData, id: `group_${Date.now()}` });
        }
        
        await docRef.update({ groupLeaders: updatedGroups });
        setIsGroupModalOpen(false);
        onUpdate();
    } catch (e) {
        console.error(e);
        alert("Failed to save group.");
    }
    setIsSaving(false);
  };
  
  const handleDeleteGroup = async (groupId: string) => {
    if (!db || !window.confirm("Are you sure you want to delete this group?")) return;
    setIsSaving(true);
    try {
        const docRef = db.collection('ktpLeaders').doc(String(data.year));
        const doc = await docRef.get();
        const currentData = doc.data() as KTPHruaitute;
        const updatedGroups = (currentData.groupLeaders || []).filter(g => g.id !== groupId);
        await docRef.update({ groupLeaders: updatedGroups });
        onUpdate();
    } catch(e) {
        console.error(e);
        alert("Failed to delete group.");
    }
    setIsSaving(false);
  };

  const MemberList: React.FC<{ title: string; members: KTPMember[] }> = ({ title, members }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">{title}</h3>
      <ul className="space-y-1">
        {members.map((member, index) => (
          <li key={index} className="flex flex-col sm:flex-row justify-between sm:items-center text-sm gap-2 py-3 border-b border-slate-100 last:border-b-0">
            <div>
              <p className="font-semibold text-slate-800">{member.name}</p>
              <p className="text-slate-500">{member.role}</p>
            </div>
            {member.phone && (
              <div className="flex items-center gap-2 shrink-0 self-start sm:self-center mt-2 sm:mt-0">
                <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded">{member.phone}</span>
                <a href={`tel:${member.phone.replace(/\s+/g, '')}`} className="p-2 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition" title={`Call ${member.name}`}>
                  <Phone size={16} />
                </a>
                <a href={`https://wa.me/91${member.phone.replace(/\s+/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-teal-50 text-teal-600 rounded-full hover:bg-teal-100 transition" title={`WhatsApp ${member.name}`}>
                  <MessageCircle size={16} />
                </a>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
  
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {data.leaders && <MemberList title="Office Bearers" members={data.leaders} />}
      {data.committeeMembers && <MemberList title="Committee Members" members={data.committeeMembers} />}
      {data.exOfficioMembers && <MemberList title="Ex-Officio Members" members={data.exOfficioMembers} />}
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="text-lg font-bold text-slate-800">Group Office Bearers</h3>
            {isAdmin && (
                <button onClick={handleAddNewGroup} className="flex items-center px-3 py-1.5 bg-church-600 text-white text-xs font-bold rounded-lg hover:bg-church-700">
                    <Plus size={14} className="mr-1"/> Add Group
                </button>
            )}
        </div>
        {(!data.groupLeaders || data.groupLeaders.length === 0) ? (
            <p className="text-center text-slate-500 italic py-8">No group data available.</p>
        ) : (
            <div className="grid md:grid-cols-2 gap-6">
                {(data.groupLeaders || []).map((group) => (
                    <div key={group.id} className="bg-slate-50/70 p-4 rounded-lg border border-slate-200 group relative">
                        {isAdmin && (
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEditGroup(group)} className="p-1.5 bg-white text-blue-600 rounded-full shadow"><Edit size={12}/></button>
                                <button onClick={() => handleDeleteGroup(group.id)} className="p-1.5 bg-white text-red-600 rounded-full shadow"><Trash2 size={12}/></button>
                            </div>
                        )}
                        <h4 className="font-bold text-church-800 mb-3">{group.groupName}</h4>
                        <ul className="space-y-3">
                            {group.members.map((member, index) => (
                                <li key={index} className="flex justify-between items-center text-sm">
                                    <div>
                                        <p className="font-semibold text-slate-700">{member.name}</p>
                                        <p className="text-slate-500 text-xs">{member.role}</p>
                                    </div>
                                    {member.phone && (
                                        <div className="flex items-center gap-1 shrink-0">
                                            <a href={`tel:${member.phone.replace(/\s+/g, '')}`} className="p-1.5 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition" title={`Call ${member.name}`}>
                                            <Phone size={12} />
                                            </a>
                                            <a href={`https://wa.me/91${member.phone.replace(/\s+/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-teal-50 text-teal-600 rounded-full hover:bg-teal-100 transition" title={`WhatsApp ${member.name}`}>
                                            <MessageCircle size={12} />
                                            </a>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        )}
      </div>
      
      {isGroupModalOpen && (
        <GroupEditModal 
            group={editingGroup}
            onClose={() => setIsGroupModalOpen(false)}
            onSave={handleSaveGroup}
            isLoading={isSaving}
        />
      )}
    </div>
  );
};

const KtpSubCommittees: React.FC<{ data: KTPSubCommittee[] | undefined }> = ({ data }) => {
  if (!data || data.length === 0) return <div className="p-8 bg-white rounded-xl shadow-sm text-center">No sub-committee data available.</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {data.map((committee) => (
        <div key={committee.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-xl font-bold text-slate-900 mb-4">{committee.name}</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
            {committee.members.map((member, index) => (
              <li key={index} className="flex justify-between items-center text-sm border-b border-slate-100 py-3 gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-700 truncate">{member.name}</p>
                  <p className="text-slate-500 text-xs truncate">{member.role}</p>
                </div>
                {member.phone && (
                  <div className="flex items-center gap-1 shrink-0">
                    <a href={`tel:${member.phone.replace(/\s+/g, '')}`} className="p-1.5 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition" title={`Call ${member.name}`}>
                      <Phone size={12} />
                    </a>
                    <a href={`https://wa.me/91${member.phone.replace(/\s+/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-teal-50 text-teal-600 rounded-full hover:bg-teal-100 transition" title={`WhatsApp ${member.name}`}>
                      <MessageCircle size={12} />
                    </a>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

const KtpBudgetComponent: React.FC<{ data: KTPBudget | null | undefined }> = ({ data }) => {
    if (!data) return <div className="p-8 bg-white rounded-xl shadow-sm text-center"><Loader className="animate-spin mx-auto"/></div>;
  
    const calculateTotal = (items: BudgetItem[]) => items.reduce((sum, item) => sum + parseFloat(item.amount.replace(/,/g, '')), 0);
  
    const totalIncome = calculateTotal(data.income);
    const totalExpenditure = calculateTotal(data.expenditure);
    const balance = totalIncome - totalExpenditure;
  
    const formatCurrency = (amount: number) => `₹ ${amount.toLocaleString('en-IN')}`;
  
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 animate-in fade-in duration-300">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Project & Budget {data.year}</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-bold text-green-700 mb-4 flex items-center gap-2"><TrendingUp size={20}/> Estimated Income</h3>
            <div className="space-y-2 text-sm">
              {data.income.map((item) => (
                <div key={item.id} className="flex justify-between p-2 rounded hover:bg-green-50">
                  <span className="text-slate-700">{item.item}</span>
                  <span className="font-mono font-semibold text-slate-800">{formatCurrency(parseFloat(item.amount.replace(/,/g, '')))}</span>
                </div>
              ))}
              <div className="flex justify-between p-2 mt-4 border-t-2 border-green-200 font-bold">
                <span className="text-green-800">Total Income</span>
                <span className="font-mono text-green-800">{formatCurrency(totalIncome)}</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-red-700 mb-4 flex items-center gap-2"><FileDown size={20}/> Estimated Expenditure</h3>
            <div className="space-y-2 text-sm">
              {data.expenditure.map((item) => (
                <div key={item.id} className="flex justify-between p-2 rounded hover:bg-red-50">
                  <span className="text-slate-700">{item.item}</span>
                  <span className="font-mono font-semibold text-slate-800">{formatCurrency(parseFloat(item.amount.replace(/,/g, '')))}</span>
                </div>
              ))}
              <div className="flex justify-between p-2 mt-4 border-t-2 border-red-200 font-bold">
                <span className="text-red-800">Total Expenditure</span>
                <span className="font-mono text-red-800">{formatCurrency(totalExpenditure)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
             <div className={`p-4 rounded-lg flex items-center justify-between w-full md:w-1/2 ${balance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <span className={`text-lg font-bold ${balance >= 0 ? 'text-green-800' : 'text-red-800'}`}>Balance</span>
                <span className={`text-2xl font-mono font-black ${balance >= 0 ? 'text-green-800' : 'text-red-800'}`}>{formatCurrency(balance)}</span>
             </div>
        </div>
      </div>
    );
};

// ─────────────────────────────────────────────────────────────
// GENERIC STATS TABLE
// ─────────────────────────────────────────────────────────────

interface StatsTableProps {
  title: string;
  collectionName: string;
  columns: { key: string; label: string; type?: 'number' | 'text' }[];
  isAdmin: boolean;
}

const StatsTable: React.FC<StatsTableProps> = ({ title, collectionName, columns, isAdmin }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>({});
  const [isImporting, setIsImporting] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    if (!db || !db.collection) { setLoading(false); return; }
    try {
      const snapshot = await db.collection(collectionName).get();
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      items.sort((a: any, b: any) => parseInt(b.year) - parseInt(a.year));
      setData(items);
    } catch (e) {
      console.error(`Error fetching ${collectionName}:`, e);
    }
    setLoading(false);
  }, [collectionName]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    if (!db || !db.collection) return;
    try {
      const { id, ...saveData } = editingItem;
      if (id) {
        await db.collection(collectionName).doc(id).set(saveData, { merge: true });
      } else {
        await db.collection(collectionName).add(saveData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (e) {
      alert("Failed to save record.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!db || !window.confirm("Are you sure?")) return;
    try {
      await db.collection(collectionName).doc(id).delete();
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(data.map(item => {
        const row: any = {};
        columns.forEach(col => row[col.label] = item[col.key]);
        return row;
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `${title.replace(/\s+/g, '_')}_Export.xlsx`);
  };

  const handleTemplate = () => {
    const row: any = {};
    columns.forEach(col => row[col.label] = "");
    const ws = XLSX.utils.json_to_sheet([row]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `${title.replace(/\s+/g, '_')}_Template.xlsx`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
      const batch = db.batch();
      const ref = db.collection(collectionName);
      jsonData.forEach((row: any) => {
        const docData: any = {};
        columns.forEach(col => { docData[col.key] = row[col.label] !== undefined ? String(row[col.label]) : ""; });
        if (docData.year) {
            if (collectionName === 'kpvmBuhfaitham' && docData.donors && docData.totalFamilies) {
                const pct = (parseFloat(docData.donors) / parseFloat(docData.totalFamilies)) * 100;
                docData.percentage = pct.toFixed(2);
            } else if (collectionName === 'kpvmNitinInkhawm' && docData.performers && docData.totalHouses) {
                const pct = (parseFloat(docData.performers) / parseFloat(docData.totalHouses)) * 100;
                docData.percentage = pct.toFixed(2);
            }
            const newDoc = ref.doc();
            batch.set(newDoc, docData);
        }
      });
      await batch.commit();
      alert("Import successful!");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Import failed. Check file format.");
    } finally {
      setIsImporting(false);
      if (importFileRef.current) importFileRef.current.value = '';
    }
  };

  const updatePercentage = (newItem: any) => {
      let p = newItem;
      if (collectionName === 'kpvmBuhfaitham' && p.donors && p.totalFamilies) {
          const pct = (parseFloat(p.donors) / parseFloat(p.totalFamilies)) * 100;
          p.percentage = pct.toFixed(2);
      } else if (collectionName === 'kpvmNitinInkhawm' && p.performers && p.totalHouses) {
          const pct = (parseFloat(p.performers) / parseFloat(p.totalHouses)) * 100;
          p.percentage = pct.toFixed(2);
      }
      setEditingItem({...p});
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <h3 className="text-xl font-bold text-slate-800">{title}</h3>
            <div className="flex gap-2">
                <button onClick={handleExport} className="p-2 text-green-600 hover:bg-green-50 rounded-lg border border-green-200" title="Export Excel">
                    <FileDown size={18} />
                </button>
                {isAdmin && (
                    <>
                        <button onClick={handleTemplate} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200" title="Download Template">
                            <Download size={18} />
                        </button>
                        <button onClick={() => importFileRef.current?.click()} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg border border-orange-200" title="Import Excel">
                            {isImporting ? <Loader className="animate-spin" size={18}/> : <FileUp size={18} />}
                        </button>
                        <input type="file" ref={importFileRef} onChange={handleImport} className="hidden" accept=".xlsx, .xls" />
                        <button onClick={() => { setEditingItem({}); setIsModalOpen(true); }} className="flex items-center px-4 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 font-bold">
                            <Plus size={18} className="mr-2"/> Add Record
                        </button>
                    </>
                )}
            </div>
        </div>

        {loading ? (
            <div className="p-12 text-center"><Loader className="animate-spin mx-auto text-church-500" /></div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                        <tr>
                            {columns.map(col => <th key={col.key} className="px-6 py-4">{col.label}</th>)}
                            {isAdmin && <th className="px-6 py-4 text-right">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {data.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50">
                                {columns.map(col => (
                                    <td key={col.key} className="px-6 py-4 text-slate-700 font-medium">
                                        {col.key === 'percentage' ? (
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${parseFloat(item[col.key]) >= 80 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {item[col.key]}%
                                            </span>
                                        ) : item[col.key]}
                                    </td>
                                ))}
                                {isAdmin && (
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16}/></button>
                                        <button onClick={() => handleDelete(item.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {data.length === 0 && (
                            <tr><td colSpan={columns.length + 1} className="p-8 text-center text-slate-400 italic">No records found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        )}

        {isModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold">{editingItem.id ? 'Edit' : 'Add'} Record</h3>
                        <button onClick={() => setIsModalOpen(false)}><X size={20}/></button>
                    </div>
                    <div className="space-y-4">
                        {columns.map(col => (
                            <div key={col.key}>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{col.label}</label>
                                <input 
                                    type={col.key === 'year' || col.type === 'number' ? 'number' : 'text'}
                                    className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-church-500 outline-none"
                                    value={editingItem[col.key] || ''}
                                    onChange={e => {
                                        const val = e.target.value;
                                        const newItem = { ...editingItem, [col.key]: val };
                                        if (['donors', 'totalFamilies', 'performers', 'totalHouses'].includes(col.key)) {
                                            updatePercentage(newItem);
                                        } else {
                                            setEditingItem(newItem);
                                        }
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-slate-50">Cancel</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 font-bold">Save</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// MAIN FELLOWSHIP COMPONENT
// ─────────────────────────────────────────────────────────────

const Fellowship: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const { isAdmin } = useAuth();
  const [fellowship, setFellowship] = useState<Ministry | null | undefined>(undefined);

  const isKTP = id === 'ktp';
  const isKPVM = id === 'kpvm';
  const [ktpActiveTab, setKtpActiveTab] = useState('circular'); 
  const [kpvmActiveTab, setKpvmActiveTab] = useState('home');
  
  const [ktpHruaitute, setKtpHruaitute] = useState<KTPHruaitute | null | undefined>(undefined);
  const [ktpBudget, setKtpBudget] = useState<KTPBudget | null | undefined>(undefined);
  
  const ktpNavLinks = [
    { id: 'circular', label: '2026 Hruaitute', icon: Book },
    { id: 'sub-committees', label: 'Sub-Committees', icon: Users }, 
    { id: 'project-budget', label: 'Project & Budget', icon: DollarSign },
    { id: 'members', label: 'Member List', icon: List },
    { id: 'history', label: 'Our History', icon: History },
    { id: 'gallery', label: 'Picture Gallery', icon: Camera },
    { id: 'productions', label: 'Productions', icon: Video },
    { id: 'whoswho', label: "Who's Who", icon: UserSquare },
  ];

  const kpvmNavLinks = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'buhfaitham', label: 'Buhfaitham', icon: TrendingUp },
    { id: 'nitin-inkhawm', label: 'Kristian Chhungkua', icon: Users },
  ];

  const fetchKtpData = useCallback(async () => {
      if (!db?.collection) return;
      try {
        const leadersDoc = await db.collection('ktpLeaders').doc('2026').get();
        if (leadersDoc.exists) setKtpHruaitute(leadersDoc.data() as KTPHruaitute);
        const budgetDoc = await db.collection('ktpBudget').doc('2026').get();
        if (budgetDoc.exists) setKtpBudget(budgetDoc.data() as KTPBudget);
      } catch (e) { console.error("Error fetching KTP data:", e); }
  }, []);

  useEffect(() => {
    if (!id) return;
    const fetchFellowship = async () => {
        if (!db?.doc) {
            const staticFellowship = getConstants(language).ministries.find(m => m.id === id);
            setFellowship(staticFellowship || null);
            return;
        }
        try {
            const docRef = db.collection('ministries').doc(id);
            const docSnap = await docRef.get();
            if (docSnap.exists) {
                setFellowship({ ...docSnap.data(), id: docSnap.id } as Ministry);
            } else {
                const staticFellowship = getConstants(language).ministries.find(m => m.id === id);
                setFellowship(staticFellowship || null);
            }
        } catch (error) {
            const staticFellowship = getConstants(language).ministries.find(m => m.id === id);
            setFellowship(staticFellowship || null);
        }
    };
    fetchFellowship();
  }, [id, language]);
  
  useEffect(() => {
    if (isKTP) fetchKtpData();
  }, [isKTP, fetchKtpData]);

  if (fellowship === undefined) return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin text-church-500" /></div>;
  if (fellowship === null) return <Navigate to="/" />;

  // ── KPVM Render ───────────────────────────────────────────
  if (isKPVM) {
      return (
          <div className="bg-slate-50 min-h-screen pb-12">
              <div className="bg-white border-b border-slate-200">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                      <div className="flex items-center gap-6">
                          <div className="w-24 h-24 bg-slate-200 rounded-2xl overflow-hidden shadow-md shrink-0">
                              <img src={fellowship.image} alt={fellowship.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                              <h1 className="text-3xl font-serif font-bold text-slate-900">{fellowship.name}</h1>
                              <p className="text-slate-600 mt-2 max-w-2xl">{fellowship.description}</p>
                          </div>
                      </div>
                  </div>
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                      <div className="flex space-x-1 overflow-x-auto no-scrollbar">
                          {kpvmNavLinks.map(link => (
                              <button
                                  key={link.id}
                                  onClick={() => setKpvmActiveTab(link.id)}
                                  className={`flex items-center px-5 py-4 border-b-2 text-sm font-bold whitespace-nowrap transition-colors ${
                                      kpvmActiveTab === link.id
                                          ? 'border-church-600 text-church-700 bg-church-50/50'
                                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                  }`}
                              >
                                  <link.icon size={18} className="mr-2" />
                                  {link.label}
                              </button>
                          ))}
                      </div>
                  </div>
              </div>

              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  {kpvmActiveTab === 'home' && (
                      <div className="space-y-8 animate-in fade-in zoom-in duration-300">
                          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
                              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center"><Users size={20} className="mr-2 text-church-600"/> Leadership & Schedule</h3>
                              <div className="grid md:grid-cols-2 gap-6 text-sm text-slate-700">
                                  <div className="bg-slate-50 p-4 rounded-lg">
                                      <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Leader</span>
                                      <span className="text-lg font-bold">{fellowship.leader || 'N/A'}</span>
                                  </div>
                                  <div className="bg-slate-50 p-4 rounded-lg">
                                      <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Weekly Service</span>
                                      <span className="text-lg font-bold">{fellowship.schedule || 'N/A'}</span>
                                  </div>
                              </div>
                          </div>
                      </div>
                  )}
                  {kpvmActiveTab === 'buhfaitham' && (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                          <StatsTable 
                              title="Buhfaitham Record"
                              collectionName="kpvmBuhfaitham"
                              isAdmin={isAdmin}
                              columns={[
                                  { key: 'year', label: 'Year', type: 'number' },
                                  { key: 'totalFamilies', label: 'Total Families', type: 'number' },
                                  { key: 'donors', label: 'Donors', type: 'number' },
                                  { key: 'percentage', label: '%', type: 'text' },
                                  { key: 'weight', label: 'Weight (kg)', type: 'text' },
                                  { key: 'amount', label: 'Amount (₹)', type: 'text' }
                              ]}
                          />
                      </div>
                  )}
                  {kpvmActiveTab === 'nitin-inkhawm' && (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                          <StatsTable 
                              title="Kristian Chhungkua (Nitin Inkhawm)"
                              collectionName="kpvmNitinInkhawm"
                              isAdmin={isAdmin}
                              columns={[
                                  { key: 'year', label: 'Year', type: 'number' },
                                  { key: 'totalHouses', label: 'Total Households', type: 'number' },
                                  { key: 'performers', label: 'Attendees', type: 'number' },
                                  { key: 'percentage', label: '%', type: 'text' }
                              ]}
                          />
                      </div>
                  )}
              </div>
          </div>
      );
  }
  
  // ── KTP Render ────────────────────────────────────────────
  if (isKTP) {
     return (
        <div className="bg-slate-50 min-h-screen pb-12">
              <div className="bg-church-900 text-white border-b border-church-800">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                      <div className="flex items-center gap-6">
                          <div className="w-24 h-24 bg-white p-2 rounded-full shadow-xl shrink-0">
                             <img src={fellowship.image} alt={fellowship.name} className="w-full h-full object-contain rounded-full" />
                          </div>
                          <div>
                              <h1 className="text-3xl font-serif font-bold text-white">{fellowship.name}</h1>
                              <p className="text-church-200 mt-2 max-w-2xl">{fellowship.description}</p>
                          </div>
                      </div>
                  </div>
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                      <div className="flex space-x-1 overflow-x-auto no-scrollbar">
                          {ktpNavLinks.map(link => (
                              <button
                                  key={link.id}
                                  onClick={() => setKtpActiveTab(link.id)}
                                  className={`flex items-center px-4 py-3 border-b-2 text-sm font-bold whitespace-nowrap transition-colors ${
                                      ktpActiveTab === link.id
                                          ? 'border-yellow-400 text-yellow-300'
                                          : 'border-transparent text-church-300 hover:text-white hover:border-church-700'
                                  }`}
                              >
                                  <link.icon size={16} className="mr-2" />
                                  {link.label}
                              </button>
                          ))}
                      </div>
                  </div>
              </div>

              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                 {ktpActiveTab === 'circular' && <KtpLeaders data={ktpHruaitute} isAdmin={isAdmin} onUpdate={fetchKtpData} />}
                 {ktpActiveTab === 'sub-committees' && <KtpSubCommittees data={ktpHruaitute?.subCommittees} />}
                 {ktpActiveTab === 'project-budget' && <KtpBudgetComponent data={ktpBudget} />}
                 {ktpActiveTab === 'members' && <div className="p-8 bg-white rounded-xl shadow-sm">Member List content goes here...</div>}
                 {/* ↓ History tab now renders KtpHistory with sub-pages */}
                 {ktpActiveTab === 'history' && <KtpHistory isAdmin={isAdmin} />}
                 {ktpActiveTab === 'gallery' && <div className="p-8 bg-white rounded-xl shadow-sm">Gallery content goes here...</div>}
                 {ktpActiveTab === 'productions' && <div className="p-8 bg-white rounded-xl shadow-sm">Productions content goes here...</div>}
                 {ktpActiveTab === 'whoswho' && <div className="p-8 bg-white rounded-xl shadow-sm">Who's Who content goes here...</div>}
              </div>
        </div>
     );
  }

  // ── Generic Fallback Render ───────────────────────────────
  return (
    <div className="bg-slate-50 min-h-screen">
        <div className="bg-church-900 text-white py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="w-32 h-32 bg-white p-2 rounded-full shadow-xl shrink-0">
                        <img src={fellowship.image} alt="Logo" className="w-full h-full object-cover rounded-full" />
                    </div>
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl font-serif font-bold mb-2">{fellowship.name}</h1>
                        <p className="text-church-200 text-lg max-w-2xl">{fellowship.description}</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
             <div className="bg-white p-8 rounded-xl shadow-sm">
                 <h2 className="text-2xl font-bold text-slate-800 mb-4">About {fellowship.acronym || fellowship.name}</h2>
                 <p className="text-slate-600 leading-relaxed mb-6">{fellowship.description}</p>
                 <div className="grid md:grid-cols-2 gap-6">
                     <div className="p-4 border rounded-lg">
                         <h3 className="font-bold text-slate-700">Leader</h3>
                         <p>{fellowship.leader}</p>
                     </div>
                     <div className="p-4 border rounded-lg">
                         <h3 className="font-bold text-slate-700">Schedule</h3>
                         <p>{fellowship.schedule}</p>
                     </div>
                 </div>
             </div>
        </div>
    </div>
  );
};

export default Fellowship;
