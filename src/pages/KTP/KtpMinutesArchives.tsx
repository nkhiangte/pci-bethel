import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  FolderOpen, FileText, Plus, Trash2, Loader, Archive, 
  FileUp, FileDown, Eye, Download, X 
} from 'lucide-react';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { MinutesYear, MinutesPdf } from '../../types';

const MinutesArchives: React.FC = () => {
  const { isAdmin } = useAuth();
  const [years, setYears] = useState<MinutesYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<MinutesYear | null>(null);
  const [addingYear, setAddingYear] = useState(false);
  const [newYearInput, setNewYearInput] = useState('');
  const [yearError, setYearError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingPdf, setViewingPdf] = useState<MinutesPdf | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchYears = useCallback(async () => {
    setLoading(true);
    if (!db?.collection) { setLoading(false); return; }
    try {
      const snapshot = await db.collection('ktpMinutesArchives').get();
      const yrs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MinutesYear));
      yrs.sort((a, b) => parseInt(b.year) - parseInt(a.year));
      setYears(yrs);
      if (selectedYear) {
        const updated = yrs.find(y => y.id === selectedYear.id);
        if (updated) setSelectedYear(updated);
      }
    } catch (e) { console.error("Error fetching years:", e); }
    setLoading(false);
  }, [selectedYear]);

  useEffect(() => { fetchYears(); }, []);

  const handleAddYear = async () => {
    if (!newYearInput || !/^\d{4}$/.test(newYearInput)) { setYearError('Enter a valid 4-digit year.'); return; }
    if (years.some(y => y.year === newYearInput)) { setYearError('Year already exists.'); return; }
    
    try {
      await db.collection('ktpMinutesArchives').doc(newYearInput).set({
        year: newYearInput,
        pdfs: [],
        createdAt: new Date().toISOString()
      });
      setNewYearInput('');
      setAddingYear(false);
      await fetchYears();
    } catch (e) { alert('Failed to add year.'); }
  };

  const handleDeleteYear = async (yearDoc: MinutesYear) => {
    if (!window.confirm(`Delete ALL minutes for ${yearDoc.year}?`)) return;
    try {
      const storage = (await import('../../services/firebase')).storage;
      if (storage && yearDoc.pdfs) {
        for (const pdf of yearDoc.pdfs) {
          try { await storage.ref(pdf.storagePath).delete(); } catch (_) { /* ignore missing files */ }
        }
      }
      await db.collection('ktpMinutesArchives').doc(yearDoc.id).delete();
      if (selectedYear?.id === yearDoc.id) setSelectedYear(null);
      await fetchYears();
    } catch (e) { alert('Failed to delete year.'); }
  };

  const handleUploadPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedYear || !e.target.files?.length) return;
    const file = e.target.files[0];
    if (file.type !== 'application/pdf') { alert('Only PDF files are allowed.'); return; }

    setUploading(true);
    setUploadProgress('Uploading…');

    try {
      const storage = (await import('../../services/firebase')).storage;
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

  const handleDeletePdf = async (pdf: MinutesPdf) => {
    if (!selectedYear || !window.confirm(`Delete "${pdf.name}"?`)) return;
    setDeletingId(pdf.id);
    try {
      const storage = (await import('../../services/firebase')).storage;
      if (storage) {
        try { await storage.ref(pdf.storagePath).delete(); } catch (_) {}
      }
      const docRef = db.collection('ktpMinutesArchives').doc(selectedYear.year);
      const snap = await docRef.get();
      const existing: MinutesPdf[] = (snap.data() as MinutesYear)?.pdfs ?? [];
      await docRef.update({ pdfs: existing.filter(p => p.id !== pdf.id) });
      await fetchYears();
    } catch (e) { alert('Failed to delete PDF.'); }
    setDeletingId(null);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

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

  return (
    <div className="animate-in fade-in duration-300">
      {viewingPdf && <PdfViewerModal pdf={viewingPdf} onClose={() => setViewingPdf(null)} />}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* ── Left Panel: Year List ─────────────────────── */}
        <div className="w-full lg:w-64 shrink-0 space-y-2">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2">
              {years.map(yr => (
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
              ))}
            </div>
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

              {!selectedYear.pdfs || selectedYear.pdfs.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
                  <FileText size={32} className="mb-2 opacity-40" />
                  <p className="font-medium">No documents yet</p>
                  {isAdmin && <p className="text-sm mt-1">Click "Upload PDF" to add minutes</p>}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedYear.pdfs.map((pdf, idx) => (
                    <div
                      key={pdf.id}
                      className="flex items-center gap-4 bg-white border border-slate-100 rounded-xl px-4 py-3 hover:shadow-sm transition-shadow group"
                    >
                      <div className="w-7 h-7 rounded-full bg-church-50 text-church-700 flex items-center justify-center text-xs font-bold shrink-0">
                        {idx + 1}
                      </div>
                      <div className="p-2 bg-red-50 rounded-lg shrink-0">
                        <FileText size={18} className="text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 truncate text-sm">{pdf.name}</p>
                        <p className="text-slate-400 text-xs">Uploaded {formatDate(pdf.uploadedAt)}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setViewingPdf(pdf)}
                          className="p-2 text-church-600 hover:bg-church-50 rounded-lg transition"
                          title="View PDF"
                        >
                          <Eye size={16} />
                        </button>
                        <a
                          href={pdf.url}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition"
                          title="Download"
                        >
                          <Download size={16} />
                        </a>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeletePdf(pdf)}
                            disabled={deletingId === pdf.id}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingId === pdf.id ? <Loader className="animate-spin" size={16} /> : <Trash2 size={16} />}
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

export default MinutesArchives;
