import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { 
  Committee, 
  CommitteeMember, 
  CommitteeReport, 
  CommitteeImage,
  GalleryFolder,
  GalleryItem,
  PropertyRecord
} from '../types';
import { db, storage, handleFirestoreError, OperationType } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Users, 
  Calendar, 
  FileText, 
  Image as ImageIcon, 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash, 
  Save, 
  Loader, 
  X, 
  Camera,
  Download,
  ExternalLink,
  PlusCircle,
  FileDown,
  Upload,
  Phone,
  MessageCircle,
  BookOpen
} from 'lucide-react';
import ProtectedContact from '../components/ProtectedContact';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface ImagesPanelProps {
  committee: Committee & { images?: CommitteeImage[] };
  isAdmin: boolean;
  isOfflineMode: boolean;
  galleryFolders: GalleryFolder[];
  galleryItems: GalleryItem[];
  onAdd: (committeeId: string) => void;
  onEdit: (committeeId: string, image: CommitteeImage) => void;
  onDelete: (committeeId: string, imageId: string) => void;
  onImageClick: (url: string) => void;
}

const ImagesPanel: React.FC<ImagesPanelProps> = ({ 
  committee, 
  isAdmin, 
  isOfflineMode, 
  galleryFolders, 
  galleryItems,
  onAdd, 
  onEdit,
  onDelete,
  onImageClick
}) => {
  const directImages: CommitteeImage[] = committee.images || [];
  
  // Find linked gallery folder
  const linkedFolder = galleryFolders.find(f => f.name.toLowerCase() === committee.name.toLowerCase());
  const linkedImages = linkedFolder 
    ? galleryItems.filter(item => item.folderId === linkedFolder.id)
    : [];

  return (
    <div className="space-y-8">
      {/* Gallery Synced Images */}
      {linkedImages.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-church-600 uppercase tracking-wider">Synced from Gallery</h4>
              <span className="text-[10px] bg-church-100 text-church-700 px-2 py-0.5 rounded-full font-bold">Auto-Sync</span>
            </div>
            <Link 
              to={`/gallery/committees/${linkedFolder?.id}`}
              className="text-xs text-slate-500 hover:text-church-600 underline"
            >
              Manage in Gallery
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {linkedImages.map(img => (
              <div key={img.id} className="group relative aspect-square rounded-xl overflow-hidden bg-slate-200 shadow-sm border border-slate-100">
                <img 
                  src={img.imageUrl} 
                  alt={img.title || 'Gallery Image'} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-x-0 bottom-0 bg-black/60 p-3 translate-y-full group-hover:translate-y-0 transition-transform">
                  <p className="text-xs text-white line-clamp-2 leading-tight font-medium">{img.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Direct Uploads */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            {linkedImages.length > 0 ? 'Direct Committee Uploads' : 'Committee Images'}
          </h4>
          {isAdmin && !isOfflineMode && (
            <button 
              onClick={() => onAdd(committee.id)}
              className="text-xs font-semibold text-church-600 bg-church-100 px-3 py-1.5 rounded-lg hover:bg-church-200 flex items-center gap-1"
            >
              <Plus size={14} /> Add Image
            </button>
          )}
        </div>

        {directImages.length === 0 && linkedImages.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <ImageIcon size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">No images found for this committee.</p>
            {isAdmin && (
              <p className="text-xs text-church-600 mt-2">
                Upload directly here or create a folder named "{committee.name}" in the Gallery.
              </p>
            )}
          </div>
        ) : directImages.length === 0 && linkedImages.length > 0 ? (
          <p className="text-sm text-slate-400 italic text-center py-8 bg-white rounded-xl border border-slate-100">No direct uploads. All images are synced from Gallery.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {directImages.map(img => (
              <div key={img.id} className="group relative aspect-square rounded-xl overflow-hidden bg-slate-200 shadow-sm border border-slate-100 cursor-pointer" onClick={() => onImageClick(img.url)}>
                <img 
                  src={img.url} 
                  alt={img.caption || 'Committee Image'} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                {img.caption && (
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 p-3 translate-y-full group-hover:translate-y-0 transition-transform">
                    <p className="text-xs text-white line-clamp-2 leading-tight font-medium">{img.caption}</p>
                  </div>
                )}
                {isAdmin && !isOfflineMode && (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onEdit(committee.id, img); }}
                      className="p-2 bg-church-600 text-white rounded-full hover:bg-church-700 shadow-lg"
                      title="Edit Caption"
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(committee.id, img.id); }}
                      className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                      title="Delete"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface ReportsPanelProps {
  committee: Committee & { reports?: CommitteeReport[] };
  isAdmin: boolean;
  isOfflineMode: boolean;
  onAdd: (committeeId: string) => void;
  onEdit: (committeeId: string, report: CommitteeReport) => void;
  onDelete: (committeeId: string, reportId: string) => void;
}

const ReportsPanel: React.FC<ReportsPanelProps> = ({ committee, isAdmin, isOfflineMode, onAdd, onEdit, onDelete }) => {
  const reports: CommitteeReport[] = committee.reports || [];
  const [reportView, setReportView] = useState<'yearly' | 'monthly'>('yearly');
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());

  const yearlyReports = reports
    .filter(r => r.type === 'yearly')
    .sort((a, b) => b.year - a.year);

  const monthlyReports = reports
    .filter(r => r.type === 'monthly' && r.year === filterYear)
    .sort((a, b) => (b.month || 0) - (a.month || 0));

  const allYears = Array.from(
    new Set([
      new Date().getFullYear(),
      ...reports.filter(r => r.type === 'monthly').map(r => r.year)
    ])
  ).sort((a, b) => b - a);

  const MONTH_NAMES = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
          {(['yearly', 'monthly'] as const).map(v => (
            <button
              key={v}
              onClick={() => setReportView(v)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                reportView === v
                  ? 'bg-white text-church-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {v === 'yearly' ? '📅 Yearly' : '📆 Monthly'}
            </button>
          ))}
        </div>
        {isAdmin && !isOfflineMode && (
          <button 
            onClick={() => onAdd(committee.id)}
            className="text-xs font-semibold text-church-600 bg-church-100 px-3 py-1.5 rounded-lg hover:bg-church-200 flex items-center gap-1"
          >
            <Plus size={14} /> Add Report
          </button>
        )}
      </div>

      {reportView === 'monthly' && (
        <div className="flex items-center gap-2 mb-6">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filter Year:</label>
          <select
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white"
            value={filterYear}
            onChange={e => setFilterYear(Number(e.target.value))}
          >
            {allYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      )}

      {(reportView === 'yearly' ? yearlyReports : monthlyReports).length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
          <FileText size={48} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm text-slate-500">No {reportView} reports found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {(reportView === 'yearly' ? yearlyReports : monthlyReports).map(report => (
            <div key={report.id} className="group flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-church-50 text-church-600 rounded-lg">
                  {report.fileType === 'pdf' ? <FileText size={24} /> : <FileDown size={24} />}
                </div>
                <div>
                  <h5 className="font-bold text-slate-800">{report.name}</h5>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar size={12} /> {report.type === 'monthly' ? `${MONTH_NAMES[report.month! - 1]} ` : ''}{report.year}
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                      {report.fileType}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a 
                  href={report.fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 text-church-600 hover:bg-church-50 rounded-lg transition-colors"
                  title="View/Download"
                >
                  <Download size={18} />
                </a>
                {isAdmin && !isOfflineMode && (
                  <>
                    <button 
                      onClick={() => onEdit(committee.id, report)}
                      className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => onDelete(committee.id, report.id)}
                      className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface PropertyPanelProps {
  committeeId: string;
  propertyRecords: PropertyRecord[];
  isAdmin: boolean;
  isOfflineMode: boolean;
  onAdd: () => void;
  onEdit: (record: PropertyRecord) => void;
  onDelete: (id: string) => void;
  onImport: () => void;
  committeeName: string;
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({ 
  committeeId, 
  propertyRecords, 
  isAdmin, 
  isOfflineMode, 
  onAdd, 
  onEdit, 
  onDelete,
  onImport,
  committeeName
}) => {
  const { t } = useLanguage();

  const handleExportExcel = () => {
    const data = propertyRecords.map((r, i) => ({
      'S/NO': i + 1,
      'PARTICULARS': r.particulars,
      'PRICE': r.price,
      'DATE OF PURCHASE': r.dateOfPurchase,
      'REMARKS': r.remarks
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Property Records");
    XLSX.writeFile(workbook, `${committeeName}_Property_Records.xlsx`);
  };

  const handleExportPdf = () => {
    const doc = new jsPDF();
    doc.text(`${committeeName} Property Records`, 14, 15);
    
    const tableData = propertyRecords.map((r, i) => [
      i + 1,
      r.particulars,
      r.price,
      r.dateOfPurchase,
      r.remarks
    ]);

    doc.autoTable({
      head: [['S/NO', 'PARTICULARS', 'PRICE', 'DATE OF PURCHASE', 'REMARKS']],
      body: tableData,
      startY: 20,
    });

    doc.save(`${committeeName}_Property_Records.pdf`);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
            <BookOpen size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">{t.committeeDetail.sections.propertyRecord}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-all border border-emerald-100 font-bold text-xs"
          >
            <FileDown size={16} /> Excel
          </button>
          <button 
            onClick={handleExportPdf}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-all border border-red-100 font-bold text-xs"
          >
            <Download size={16} /> PDF
          </button>
          {isAdmin && !isOfflineMode && (
            <>
              <button 
                onClick={onImport}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all font-bold text-xs"
              >
                <Upload size={16} /> {t.committeeDetail.admin.import}
              </button>
              <button 
                onClick={onAdd}
                className="flex items-center gap-2 px-4 py-2 bg-church-600 text-white rounded-xl hover:bg-church-700 transition-all shadow-lg shadow-church-100 font-bold text-sm"
              >
                <PlusCircle size={18} /> {t.committeeDetail.property.addRecord}
              </button>
            </>
          )}
        </div>
      </div>

      {propertyRecords.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
          <BookOpen size={48} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm text-slate-500">{t.committeeDetail.property.noRecords}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="p-4">{t.committeeDetail.property.sNo}</th>
                <th className="p-4">{t.committeeDetail.property.particulars}</th>
                <th className="p-4">{t.committeeDetail.property.price}</th>
                <th className="p-4">{t.committeeDetail.property.dateOfPurchase}</th>
                <th className="p-4">{t.committeeDetail.property.remarks}</th>
                {isAdmin && !isOfflineMode && <th className="p-4 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {propertyRecords.map((record, index) => (
                <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-slate-500 font-medium">{index + 1}</td>
                  <td className="p-4 text-slate-800 font-bold">{record.particulars}</td>
                  <td className="p-4 text-slate-600">{record.price}</td>
                  <td className="p-4 text-slate-600">{record.dateOfPurchase}</td>
                  <td className="p-4 text-slate-600 italic max-w-xs truncate">{record.remarks}</td>
                  {isAdmin && !isOfflineMode && (
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => onEdit(record)}
                          className="p-1.5 text-church-600 hover:bg-church-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => onDelete(record.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Modals ──────────────────────────────────────────────────────────────────

interface ReportModalProps {
  committeeId: string;
  editingReport: CommitteeReport | null;
  onSave: (committeeId: string, report: CommitteeReport) => Promise<void>;
  onClose: () => void;
  loading: boolean;
}

const ReportModal: React.FC<ReportModalProps> = ({ committeeId, editingReport, onSave, onClose, loading }) => {
  const [name, setName] = useState(editingReport?.name || '');
  const [year, setYear] = useState(editingReport?.year || new Date().getFullYear());
  const [month, setMonth] = useState(editingReport?.month || new Date().getMonth() + 1);
  const [type, setType] = useState<'yearly' | 'monthly'>(editingReport?.type || 'monthly');
  const [fileUrl, setFileUrl] = useState(editingReport?.fileUrl || '');
  const [fileType, setFileType] = useState<'pdf' | 'excel'>(editingReport?.fileType || 'pdf');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || (!fileUrl && !file)) {
      alert('Please provide a name and either a file or a URL.');
      return;
    }

    setUploading(true);
    try {
      let finalUrl = fileUrl;
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const storagePath = `committees/${committeeId}/reports/${fileName}`;
        const storageRef = storage.ref().child(storagePath);
        await storageRef.put(file);
        finalUrl = await storageRef.getDownloadURL();
      }

      const report: CommitteeReport = {
        id: editingReport?.id || Date.now().toString(),
        name,
        year,
        month: type === 'monthly' ? month : undefined,
        type,
        fileUrl: finalUrl,
        fileType,
        uploadedAt: editingReport?.uploadedAt || new Date().toISOString(),
      };

      await onSave(committeeId, report);
    } catch (error) {
      console.error("Error saving report:", error);
      alert("Failed to save report.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">{editingReport ? 'Edit Report' : 'Add New Report'}</h3>
              <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Report Name</label>
                <input 
                  required 
                  className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-church-500 outline-none" 
                  placeholder="e.g., Finance Report - Oct 2026"
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Report Type</label>
                  <select 
                    className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-church-500 outline-none"
                    value={type}
                    onChange={e => setType(e.target.value as 'yearly' | 'monthly')}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Year</label>
                  <input 
                    type="number" 
                    required 
                    className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-church-500 outline-none" 
                    value={year} 
                    onChange={e => setYear(Number(e.target.value))} 
                  />
                </div>
              </div>
              {type === 'monthly' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Month</label>
                  <select 
                    className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-church-500 outline-none"
                    value={month}
                    onChange={e => setMonth(Number(e.target.value))}
                  >
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                      <option key={m} value={m}>{new Date(0, m-1).toLocaleString('default', { month: 'long' })}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">File Type</label>
                <select 
                  className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-church-500 outline-none"
                  value={fileType}
                  onChange={e => setFileType(e.target.value as 'pdf' | 'excel')}
                >
                  <option value="pdf">PDF Document</option>
                  <option value="excel">Excel Spreadsheet</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">File Upload</label>
                <input 
                  type="file" 
                  accept={fileType === 'pdf' ? '.pdf' : '.xlsx,.xls,.csv'}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm" 
                  onChange={e => setFile(e.target.files?.[0] || null)} 
                />
              </div>
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-4 text-xs text-slate-400 font-bold uppercase">OR</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">External URL</label>
                <input 
                  className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-church-500 outline-none" 
                  placeholder="https://..."
                  value={fileUrl} 
                  onChange={e => setFileUrl(e.target.value)} 
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 flex justify-end gap-3 px-6">
            <button type="button" onClick={onClose} className="px-6 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
            <button 
              type="submit" 
              disabled={loading || uploading}
              className="px-8 py-2.5 bg-church-600 text-white font-bold rounded-xl hover:bg-church-700 flex items-center gap-2 shadow-lg shadow-church-200 disabled:opacity-50 transition-all"
            >
              {loading || uploading ? <Loader className="animate-spin w-4 h-4" /> : <Save size={18} />}
              Save Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface PropertyRecordModalProps {
  committeeId: string;
  editingRecord: PropertyRecord | null;
  onSave: (record: PropertyRecord) => Promise<void>;
  onClose: () => void;
  loading: boolean;
}

const PropertyRecordModal: React.FC<PropertyRecordModalProps> = ({ editingRecord, onSave, onClose, loading }) => {
  const { t } = useLanguage();
  const [particulars, setParticulars] = useState(editingRecord?.particulars || '');
  const [price, setPrice] = useState(editingRecord?.price || '');
  const [dateOfPurchase, setDateOfPurchase] = useState(editingRecord?.dateOfPurchase || '');
  const [remarks, setRemarks] = useState(editingRecord?.remarks || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: editingRecord?.id || '',
      particulars,
      price,
      dateOfPurchase,
      remarks
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">{editingRecord?.id ? t.committeeDetail.property.editRecord : t.committeeDetail.property.addRecord}</h3>
              <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">{t.committeeDetail.property.particulars}</label>
                <input required className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-church-500 outline-none" value={particulars} onChange={e => setParticulars(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">{t.committeeDetail.property.price}</label>
                <input required className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-church-500 outline-none" value={price} onChange={e => setPrice(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">{t.committeeDetail.property.dateOfPurchase}</label>
                <input required className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-church-500 outline-none" value={dateOfPurchase} onChange={e => setDateOfPurchase(e.target.value)} placeholder="DD/MM/YYYY" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">{t.committeeDetail.property.remarks}</label>
                <textarea className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-church-500 outline-none" rows={3} value={remarks} onChange={e => setRemarks(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 flex justify-end gap-3 px-6">
            <button type="button" onClick={onClose} className="px-6 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">{t.committeeDetail.modals.cancel}</button>
            <button type="submit" disabled={loading} className="px-8 py-2.5 bg-church-600 text-white font-bold rounded-xl hover:bg-church-700 flex items-center gap-2 shadow-lg shadow-church-200 disabled:opacity-50 transition-all">
              {loading ? <Loader className="animate-spin w-4 h-4" /> : <Save size={18} />} {t.committeeDetail.modals.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ImportPropertyModalProps {
  onImport: (records: PropertyRecord[]) => Promise<void>;
  onClose: () => void;
  loading: boolean;
}

const ImportPropertyModal: React.FC<ImportPropertyModalProps> = ({ onImport, onClose, loading }) => {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PropertyRecord[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];
        
        const excelDateToJSDate = (serial: number) => {
          const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        };

        const records: PropertyRecord[] = data.map(row => {
          const rawDate = row['Date of Purchase'] || row['DATE OF PURCHASE'] || row.date_of_purchase || row.dateOfPurchase || '';
          const formattedDate = typeof rawDate === 'number' ? excelDateToJSDate(rawDate) : String(rawDate);

          return {
            id: '',
            particulars: row.Particulars || row.PARTICULARS || row.particulars || '',
            price: (row.Price || row.PRICE || row.price || '').toString(),
            dateOfPurchase: formattedDate,
            remarks: row.Remarks || row.REMARKS || row.remarks || '',
          };
        }).filter(r => r.particulars);
        
        setPreview(records);
      } catch (error) {
        console.error("Error parsing file:", error);
        alert("Failed to parse file. Please ensure it's a valid Excel or CSV file.");
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleDownloadTemplate = () => {
    const template = [
      { Particulars: 'Office Table', Price: '5000', 'Date of Purchase': '10/05/2026', Remarks: 'Good condition' },
      { Particulars: 'HP Laptop', Price: '45000', 'Date of Purchase': '12/04/2026', Remarks: 'New' }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Property Template");
    XLSX.writeFile(wb, "property_records_template.xlsx");
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-800">{t.committeeDetail.admin.import} Property Records</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-church-50 p-4 rounded-xl border border-church-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-church-800">{t.committeeDetail.property.template}</p>
                <p className="text-xs text-church-600">Use this template to format your property list correctly.</p>
              </div>
              <button 
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 px-4 py-2 bg-white text-church-600 rounded-lg border border-church-200 hover:bg-church-100 transition-all font-bold text-sm"
              >
                <FileDown size={16} /> Template
              </button>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Select File (Excel or CSV)</label>
              <input 
                type="file" 
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-church-500 outline-none"
              />
            </div>

            {preview.length > 0 && (
              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 sticky top-0 font-bold text-slate-700 uppercase">
                    <tr>
                      <th className="p-3">Particulars</th>
                      <th className="p-3">Price</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {preview.map((r, i) => (
                      <tr key={i}>
                        <td className="p-3">{r.particulars}</td>
                        <td className="p-3">{r.price}</td>
                        <td className="p-3">{r.dateOfPurchase}</td>
                        <td className="p-3 truncate max-w-[150px]">{r.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-slate-50 flex justify-end gap-3 px-6">
          <button onClick={onClose} className="px-6 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">{t.committeeDetail.modals.cancel}</button>
          <button 
            onClick={() => onImport(preview)}
            disabled={loading || preview.length === 0}
            className="px-8 py-2.5 bg-church-600 text-white font-bold rounded-xl hover:bg-church-700 flex items-center gap-2 shadow-lg shadow-church-200 disabled:opacity-50 transition-all"
          >
            {loading ? <Loader className="animate-spin w-4 h-4" /> : <Upload size={18} />}
            Import {preview.length} Records
          </button>
        </div>
      </div>
    </div>
  );
};

interface ImportMembersModalProps {
  onImport: (members: CommitteeMember[]) => Promise<void>;
  onClose: () => void;
  loading: boolean;
}

const ImportMembersModal: React.FC<ImportMembersModalProps> = ({ onImport, onClose, loading }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CommitteeMember[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];
        
        const members: CommitteeMember[] = data.map(row => ({
          name: row.Name || row.name || '',
          role: row.Designation || row.Role || row.role || row.designation || '',
          phone: row.Contact || row.Phone || row.phone || row.contact || '',
        })).filter(m => m.name);
        
        setPreview(members);
      } catch (error) {
        console.error("Error parsing file:", error);
        alert("Failed to parse file. Please ensure it's a valid Excel or CSV file.");
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleDownloadTemplate = () => {
    const template = [
      { Name: 'John Doe', Designation: 'Chairman', Contact: '9876543210' },
      { Name: 'Jane Smith', Designation: 'Secretary', Contact: '9876543211' }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "committee_members_template.xlsx");
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-800">Import Members</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-church-50 p-4 rounded-xl border border-church-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-church-800">Download Template</p>
                <p className="text-xs text-church-600">Use this template to format your member list correctly.</p>
              </div>
              <button 
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 px-4 py-2 bg-white text-church-600 rounded-lg border border-church-200 hover:bg-church-100 transition-all font-bold text-sm"
              >
                <FileDown size={16} /> Template
              </button>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Select File (Excel or CSV)</label>
              <input 
                type="file" 
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-church-500 outline-none"
              />
            </div>

            {preview.length > 0 && (
              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="p-3 font-bold text-slate-700">Name</th>
                      <th className="p-3 font-bold text-slate-700">Designation</th>
                      <th className="p-3 font-bold text-slate-700">Contact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {preview.map((m, i) => (
                      <tr key={i}>
                        <td className="p-3 text-slate-600">{m.name}</td>
                        <td className="p-3 text-slate-600">{m.role}</td>
                        <td className="p-3 text-slate-600">{m.phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-slate-50 flex justify-end gap-3 px-6">
          <button onClick={onClose} className="px-6 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
          <button 
            onClick={() => onImport(preview)}
            disabled={loading || preview.length === 0}
            className="px-8 py-2.5 bg-church-600 text-white font-bold rounded-xl hover:bg-church-700 flex items-center gap-2 shadow-lg shadow-church-200 disabled:opacity-50 transition-all"
          >
            {loading ? <Loader className="animate-spin w-4 h-4" /> : <Upload size={18} />}
            Import {preview.length} Members
          </button>
        </div>
      </div>
    </div>
  );
};

interface ImageModalProps {
  committeeId: string;
  editingImage: CommitteeImage | null;
  onSave: (committeeId: string, image: CommitteeImage) => Promise<void>;
  onClose: () => void;
  loading: boolean;
}

const ImageModal: React.FC<ImageModalProps> = ({ committeeId, editingImage, onSave, onClose, loading }) => {
  const [caption, setCaption] = useState(editingImage?.caption || '');
  const [imageUrl, setImageUrl] = useState(editingImage?.url || '');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(editingImage?.url || null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    setFile(selectedFile);
    setImageUrl(''); // Clear URL if file is selected
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalUrl = imageUrl.trim();

    if (!finalUrl && !file) {
      alert('Please select an image or enter an image URL.');
      return;
    }

    setUploading(true);
    try {
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const storagePath = `committees/${committeeId}/images/${fileName}`;
        const storageRef = storage.ref().child(storagePath);
        
        const uploadTask = storageRef.put(file);
        
        finalUrl = await new Promise<string>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            null,
            (error) => reject(error),
            async () => {
              const url = await storageRef.getDownloadURL();
              resolve(url);
            }
          );
        });
      }

      const image: CommitteeImage = {
        id: editingImage?.id || Date.now().toString(),
        url: finalUrl,
        caption: caption.trim(),
        uploadedAt: editingImage?.uploadedAt || new Date().toISOString(),
      };

      await onSave(committeeId, image);
    } catch (error) {
      console.error("Error saving image:", error);
      alert("Failed to save image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">{editingImage ? 'Edit Image' : 'Add Image'}</h3>
              <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {!editingImage && (
                <>
                  {/* URL Input */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Image URL</label>
                    <div className="flex gap-2">
                      <input 
                        className="flex-1 border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-church-500 outline-none" 
                        placeholder="Paste image URL here..." 
                        value={imageUrl}
                        onChange={e => {
                          setImageUrl(e.target.value);
                          if (e.target.value) {
                            setFile(null);
                            setPreview(e.target.value);
                          }
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">Paste a URL from the Gallery or any web image.</p>
                  </div>

                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink mx-4 text-xs text-slate-400 font-bold uppercase">OR</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>

                  {/* File Upload */}
                  <div 
                    onClick={() => fileRef.current?.click()}
                    className="aspect-video border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-church-400 hover:bg-church-50 transition-all overflow-hidden relative"
                  >
                    {preview ? (
                      <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera size={32} className="text-slate-400 mb-2" />
                        <p className="text-sm text-slate-500 font-medium">Click to upload image</p>
                      </>
                    )}
                    {uploading && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                        <Loader className="animate-spin text-church-600" size={24} />
                      </div>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
                </>
              )}

              {editingImage && preview && (
                <div className="aspect-video rounded-xl overflow-hidden border border-slate-200">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Caption (Optional)</label>
                <input 
                  className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-church-500 outline-none" 
                  placeholder="Enter a brief caption..." 
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 flex justify-end gap-3 px-6">
            <button type="button" onClick={onClose} className="px-6 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
            <button 
              type="submit" 
              disabled={loading || uploading || (!file && !imageUrl.trim())}
              className="px-8 py-2.5 bg-church-600 text-white font-bold rounded-xl hover:bg-church-700 flex items-center gap-2 shadow-lg shadow-church-200 disabled:opacity-50 transition-all"
            >
              {loading || uploading ? <Loader className="animate-spin w-4 h-4" /> : <Save size={18} />}
              {imageUrl.trim() && !file ? 'Link Image' : 'Upload & Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Page Component ──────────────────────────────────────────────────────

const scrollToSection = (id: string) => {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

const CommitteeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { t } = useLanguage();
  
  const [committee, setCommittee] = useState<Committee | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Gallery Sync Data
  const [galleryFolders, setGalleryFolders] = useState<GalleryFolder[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);

  // Modals
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<CommitteeMember | null>(null);
  const [memberImageFile, setMemberImageFile] = useState<File | null>(null);
  
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<any>(null);
  const [activityImageFile, setActivityImageFile] = useState<File | null>(null);
  const [activityImageUrl, setActivityImageUrl] = useState('');
  const [uploadingActivityImage, setUploadingActivityImage] = useState(false);
  
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<CommitteeReport | null>(null);
  
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<CommitteeImage | null>(null);

  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<PropertyRecord | null>(null);
  const [isImportPropertyModalOpen, setIsImportPropertyModalOpen] = useState(false);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [selectedMemberBio, setSelectedMemberBio] = useState<CommitteeMember | null>(null);

  const fetchData = useCallback(async () => {
    if (!id || !db) return;
    setLoading(true);
    try {
      // Fetch Gallery data for syncing
      const gFoldersPath = 'gallery_folders';
      const gFoldersSnap = await db.collection(gFoldersPath).where('category', '==', 'Committees').get()
        .catch((err: any) => handleFirestoreError(err, OperationType.LIST, gFoldersPath));
      setGalleryFolders(gFoldersSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })));

      const gItemsPath = 'gallery';
      const gItemsSnap = await db.collection(gItemsPath).where('category', '==', 'Committees').get()
        .catch((err: any) => handleFirestoreError(err, OperationType.LIST, gItemsPath));
      setGalleryItems(gItemsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })));

      // Fetch Committee
      const committeePath = `committees/${id}`;
      const doc = await db.collection('committees').doc(id).get()
        .catch((err: any) => handleFirestoreError(err, OperationType.GET, committeePath));
      
      if (doc.exists || id === 'static-kohhran') {
        let committeeData: Committee;
        
        if (id === 'static-kohhran') {
          committeeData = {
            id: 'static-kohhran',
            name: 'Kohhran Committee',
            icon: 'Users',
            description: 'Kohhran hruaitu ber leh thutlukna siamtu lian ber an ni.',
            members: []
          };
        } else {
          committeeData = { id: doc.id, ...doc.data() } as Committee;
        }
        
        // Fetch subcollections
        const reportsPath = `committees/${id}/committeeReports`;
        const reportsSnap = await db.collection('committees').doc(id).collection('committeeReports').get()
          .catch((err: any) => handleFirestoreError(err, OperationType.LIST, reportsPath));
        const reports = reportsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as CommitteeReport[];
        
        const imagesPath = `committees/${id}/committeeImages`;
        const imagesSnap = await db.collection('committees').doc(id).collection('committeeImages').get()
          .catch((err: any) => handleFirestoreError(err, OperationType.LIST, imagesPath));
        const images = imagesSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as CommitteeImage[];

        const propertyPath = `committees/${id}/propertyRecords`;
        const propertySnap = await db.collection('committees').doc(id).collection('propertyRecords').get()
          .catch((err: any) => handleFirestoreError(err, OperationType.LIST, propertyPath));
        const propertyRecords = propertySnap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as PropertyRecord[];
        
        setCommittee({ ...committeeData, reports, images, propertyRecords });
      } else {
        navigate('/committees');
      }
    } catch (error) {
      console.error("Error fetching committee:", error);
      setIsOfflineMode(true);
    }
    setLoading(false);
  }, [id, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !id || !editingMember) return;
    setLoading(true);
    try {
      let imageUrl = editingMember.imageUrl || '';
      if (memberImageFile) {
        const storageRef = storage.ref(`committee_members/${id}_${Date.now()}`);
        await storageRef.put(memberImageFile);
        imageUrl = await storageRef.getDownloadURL();
      }

      const committeeRef = db.collection('committees').doc(id);
      const doc = await committeeRef.get();
      let members = (doc.data() as any).members || [];
      
      const memberData = { ...editingMember, imageUrl };

      if (editingMember.id) {
        members = members.map((m: any) => m.id === editingMember.id ? memberData : m);
      } else {
        members.push({ ...memberData, id: Date.now().toString() });
      }
      
      await committeeRef.update({ members });
      setCommittee(prev => prev ? { ...prev, members } : null);
      setIsMemberModalOpen(false);
      setMemberImageFile(null);
    } catch (error) { console.error("Error saving member:", error); }
    setLoading(false);
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!db || !id || !window.confirm(t.committeeDetail.members.deleteConfirm)) return;
    try {
      const committeeRef = db.collection('committees').doc(id);
      const doc = await committeeRef.get();
      const members = ((doc.data() as any).members || []).filter((m: any) => m.id !== memberId);
      await committeeRef.update({ members });
      setCommittee(prev => prev ? { ...prev, members } : null);
    } catch (error) { console.error("Error deleting member:", error); }
  };

  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !id || !editingActivity || !committee) return;
    setLoading(true);
    try {
      let imageUrl = editingActivity.imageUrl || '';
      
      // Handle Image Upload for Activity
      if (activityImageFile) {
        setUploadingActivityImage(true);
        const storageRef = storage.ref(`committee_activities/${id}_${Date.now()}`);
        await storageRef.put(activityImageFile);
        imageUrl = await storageRef.getDownloadURL();
      } else if (activityImageUrl) {
        imageUrl = activityImageUrl;
      }

      const committeeRef = db.collection('committees').doc(id);
      const doc = await committeeRef.get();
      let activities = (doc.data() as any).activities || [];
      
      const activityData = { ...editingActivity, imageUrl, id: editingActivity.id || Date.now().toString() };

      if (editingActivity.id) {
        activities = activities.map((a: any) => a.id === editingActivity.id ? activityData : a);
      } else {
        activities.push(activityData);
      }
      
      await committeeRef.update({ activities });
      
      // Sync to Announcements (Hriattirna)
      try {
        const announcementData = {
          title: `[${committee.name}] ${activityData.title}`,
          content: activityData.description,
          date: activityData.date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          category: committee.name,
          images: imageUrl ? [imageUrl] : [],
          createdAt: new Date().toISOString(),
          author: committee.name
        };
        
        // Check if we should update an existing announcement or create a new one
        // For simplicity, we create a new announcement for each activity update/creation
        // to ensure it appears at the top of Hriattirna.
        await db.collection('announcements').add(announcementData);
      } catch (annError) {
        console.error("Error syncing to announcements:", annError);
      }

      setCommittee(prev => prev ? { ...prev, activities } : null);
      setIsActivityModalOpen(false);
      setActivityImageFile(null);
      setActivityImageUrl('');
    } catch (error) { console.error("Error saving activity:", error); }
    setLoading(false);
    setUploadingActivityImage(false);
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!db || !id || !window.confirm(t.committeeDetail.activities.deleteConfirm)) return;
    try {
      const committeeRef = db.collection('committees').doc(id);
      const doc = await committeeRef.get();
      const activities = ((doc.data() as any).activities || []).filter((a: any) => a.id !== activityId);
      await committeeRef.update({ activities });
      setCommittee(prev => prev ? { ...prev, activities } : null);
    } catch (error) { console.error("Error deleting activity:", error); }
  };

  const handleDownloadExcel = () => {
    if (!committee || !committee.members) return;
    
    const excelData = [
      ['Name', 'Role', 'Phone Number'],
      ...committee.members.map(m => [m.name, m.role, m.phone || ''])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Members List");
    XLSX.writeFile(workbook, `${committee.name}_Members_List.xlsx`);
  };

  const handleImportMembers = async (newMembers: CommitteeMember[]) => {
    if (!db || !id) return;
    setLoading(true);
    try {
      const committeeRef = db.collection('committees').doc(id);
      const doc = await committeeRef.get();
      const existingMembers = (doc.data() as any).members || [];
      
      const membersToSave = [
        ...existingMembers,
        ...newMembers.map(m => ({ ...m, id: Date.now().toString() + Math.random().toString(36).substring(7) }))
      ];
      
      await committeeRef.update({ members: membersToSave });
      setCommittee(prev => prev ? { ...prev, members: membersToSave } : null);
      setIsImportModalOpen(false);
    } catch (error) {
      console.error("Error importing members:", error);
      alert("Failed to import members.");
    }
    setLoading(false);
  };

  const handleSaveReport = async (committeeId: string, report: CommitteeReport) => {
    if (!db) return;
    setLoading(true);
    try {
      const reportsRef = db.collection('committees').doc(committeeId).collection('committeeReports');
      
      if (report.id) {
        await reportsRef.doc(report.id).set(report);
      } else {
        const newDoc = reportsRef.doc();
        await newDoc.set({ ...report, id: newDoc.id });
      }
      
      // Refresh data
      await fetchData();
      setIsReportModalOpen(false);
    } catch (error) { console.error("Error saving report:", error); }
    setLoading(false);
  };

  const handleDeleteReport = async (committeeId: string, reportId: string) => {
    if (!db || !id) return;
    // Using a simpler confirmation for now, or I should implement a custom modal
    if (!window.confirm("Delete this report?")) return;
    try {
      await db.collection('committees').doc(committeeId).collection('committeeReports').doc(reportId).delete();
      await fetchData();
    } catch (error) { console.error("Error deleting report:", error); }
  };

  const handleSaveImage = async (committeeId: string, image: CommitteeImage) => {
    if (!db) return;
    setLoading(true);
    try {
      const imagesRef = db.collection('committees').doc(committeeId).collection('committeeImages');
      
      if (image.id && image.id.length > 15) { // If it has a long ID, it's likely an existing or generated one
         await imagesRef.doc(image.id).set(image);
      } else {
         const newDoc = imagesRef.doc();
         await newDoc.set({ ...image, id: newDoc.id });
      }
      
      await fetchData();
      setIsImageModalOpen(false);
      setEditingImage(null);
    } catch (error) { console.error("Error saving image:", error); }
    setLoading(false);
  };

  const handleDeleteImage = async (committeeId: string, imageId: string) => {
    if (!db || !id) return;
    if (!window.confirm("Delete this image?")) return;
    try {
      await db.collection('committees').doc(committeeId).collection('committeeImages').doc(imageId).delete();
      await fetchData();
    } catch (error) { console.error("Error deleting image:", error); }
  };

  const handleSaveProperty = async (record: PropertyRecord) => {
    if (!db || !id) return;
    setLoading(true);
    try {
      const propertyRef = db.collection('committees').doc(id).collection('propertyRecords');
      if (record.id) {
        await propertyRef.doc(record.id).set(record);
      } else {
        const newDoc = propertyRef.doc();
        await newDoc.set({ ...record, id: newDoc.id });
      }
      setIsPropertyModalOpen(false);
      setEditingProperty(null);
      await fetchData();
    } catch (error) {
      console.error("Error saving property:", error);
      alert("Failed to save property record.");
    }
    setLoading(false);
  };

  const handleDeleteProperty = async (recordId: string) => {
    if (!db || !id || !window.confirm(t.committeeDetail.property.deleteConfirm)) return;
    try {
      await db.collection('committees').doc(id).collection('propertyRecords').doc(recordId).delete();
      await fetchData();
    } catch (error) {
      console.error("Error deleting property:", error);
    }
  };

  const handleImportProperty = async (newRecords: PropertyRecord[]) => {
    if (!db || !id) return;
    setLoading(true);
    try {
      const propertyRef = db.collection('committees').doc(id).collection('propertyRecords');
      const batch = db.batch();
      
      newRecords.forEach(record => {
        const doc = propertyRef.doc();
        batch.set(doc, { ...record, id: doc.id });
      });
      
      await batch.commit();
      setIsImportPropertyModalOpen(false);
      await fetchData();
    } catch (error) {
      console.error("Error importing property:", error);
      alert("Failed to import property records.");
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader className="animate-spin text-church-600 w-12 h-12" />
      </div>
    );
  }

  if (!committee) return null;

  return (
    <div className="min-h-screen bg-slate-50 scroll-smooth">
      {/* Header Banner */}
      <div className="bg-church-900 text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link to="/committees" className="inline-flex items-center text-church-200 hover:text-white mb-6 transition-colors">
            <ArrowLeft size={20} className="mr-2" /> {t.committeeDetail.back}
          </Link>
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl overflow-hidden">
              {committee.logoUrl ? (
                <img src={committee.logoUrl} alt={committee.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <Users size={40} className="text-church-200" />
              )}
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight">{committee.name}</h1>
              <p className="text-church-200 mt-2 max-w-2xl text-lg">{committee.description || t.committeeDetail.defaultDesc}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 pb-20">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Tabs Navigation (Jump Links) */}
          <div className="flex border-b border-slate-100 px-8 pt-4 gap-8 overflow-x-auto scrollbar-hide sticky top-0 bg-white z-20">
            {(
              [
                { key: 'images', label: t.committeeDetail.tabs.gallery, icon: ImageIcon, id: 'images' },
                { key: 'members', label: t.committeeDetail.tabs.members, icon: Users, id: 'members' },
                { key: 'activities', label: t.committeeDetail.tabs.activities, icon: Calendar, id: 'activities' },
                { key: 'reports', label: t.committeeDetail.tabs.reports, icon: FileText, id: 'reports' },
                { key: 'property', label: t.committeeDetail.tabs.propertyRecord, icon: BookOpen, id: 'property' },
              ] as const
            ).map(({ key, label, icon: Icon, id }) => (
              <button
                key={key}
                onClick={() => scrollToSection(id)}
                className="whitespace-nowrap pb-4 text-sm font-bold flex items-center gap-2 border-b-4 border-transparent text-slate-400 hover:text-church-600 transition-all hover:border-church-200"
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>

          <div className="p-8 md:p-12 space-y-16">
            {/* Images Section */}
            <section id="images" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                    <ImageIcon size={24} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800">{t.committeeDetail.sections.gallery}</h3>
                </div>
              </div>
              <ImagesPanel 
                committee={committee}
                isAdmin={isAdmin}
                isOfflineMode={isOfflineMode}
                galleryFolders={galleryFolders}
                galleryItems={galleryItems}
                onAdd={() => { setEditingImage(null); setIsImageModalOpen(true); }}
                onEdit={(cid, img) => { setEditingImage(img); setIsImageModalOpen(true); }}
                onDelete={handleDeleteImage}
                onImageClick={setEnlargedImage}
              />
            </section>

            {/* Members Section */}
            <section id="members" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-slate-100 pb-4 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-church-100 text-church-600 rounded-lg">
                    <Users size={24} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800">{t.committeeDetail.sections.members}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={handleDownloadExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-all border border-emerald-100 font-bold text-sm"
                    title="Download Excel List"
                  >
                    <FileDown size={18} /> Excel
                  </button>
                  {isAdmin && (
                    <>
                      <button 
                        onClick={() => setIsImportModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-bold text-sm"
                      >
                        <Upload size={18} /> {t.committeeDetail.admin.import}
                      </button>
                      <button 
                        onClick={() => { setEditingMember({ name: '', role: '', phone: '' }); setIsMemberModalOpen(true); setMemberImageFile(null); }}
                        className="flex items-center gap-2 px-4 py-2 bg-church-600 text-white rounded-xl hover:bg-church-700 transition-all shadow-lg shadow-church-100 font-bold text-sm"
                      >
                        <PlusCircle size={18} /> {t.committeeDetail.admin.addMember}
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {!committee.members || committee.members.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <Users size={48} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500">{t.committeeDetail.members.noMembers}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {committee.members.map((member) => (
                    <div key={member.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-start gap-4 relative group">
                      <div className="w-16 h-16 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                        {member.imageUrl ? (
                          <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          <Users className="w-full h-full p-4 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-grow">
                        <h4 className="font-bold text-slate-800 text-lg">{member.name}</h4>
                        <p className="text-church-600 font-medium text-sm mb-2">{member.role}</p>
                        
                        {member.phone && (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-600 text-sm font-medium">{member.phone}</span>
                            <ProtectedContact 
                              phone={member.phone} 
                              name={member.name} 
                              variant="icon-only" 
                            />
                          </div>
                        )}

                        {member.biography && (
                          <button 
                            onClick={() => setSelectedMemberBio(member)}
                            className="mt-2 text-xs font-bold text-church-600 hover:underline flex items-center gap-1"
                          >
                            <BookOpen size={12} /> View Bio
                          </button>
                        )}
                      </div>
                      
                      {isAdmin && (
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingMember(member); setIsMemberModalOpen(true); setMemberImageFile(null); }} className="p-1.5 bg-white text-church-600 shadow-sm border border-slate-200 hover:bg-church-50 rounded-lg"><Edit size={14} /></button>
                          <button onClick={() => handleDeleteMember(member.id!)} className="p-1.5 bg-white text-red-500 shadow-sm border border-slate-200 hover:bg-red-50 rounded-lg"><Trash size={14} /></button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Activities Section */}
            <section id="activities" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                    <Calendar size={24} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800">{t.committeeDetail.sections.activities}</h3>
                </div>
                {isAdmin && (
                  <button 
                    onClick={() => { setEditingActivity({ title: '', description: '', date: '' }); setIsActivityModalOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-church-600 text-white rounded-xl hover:bg-church-700 transition-all shadow-lg shadow-church-100"
                  >
                    <PlusCircle size={18} /> {t.committeeDetail.admin.addActivity}
                  </button>
                )}
              </div>

              {!committee.activities || committee.activities.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <Calendar size={48} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500">{t.committeeDetail.activities.noActivities}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {committee.activities.map((activity) => (
                    <div key={activity.id} className="group p-8 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center gap-6">
                      <div className="flex-shrink-0 w-16 h-16 bg-church-50 text-church-600 rounded-2xl flex flex-col items-center justify-center">
                        <span className="text-xs font-bold uppercase">{activity.date ? activity.date.split(' ')[0] : t.committeeDetail.activities.tba}</span>
                        <span className="text-xl font-black">{activity.date ? activity.date.split(' ')[1] : ''}</span>
                      </div>
                        <div className="flex-grow">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xl font-bold text-slate-800">{activity.title}</h4>
                            <span className="text-sm text-slate-400 font-medium">{activity.date}</span>
                          </div>
                          
                          {activity.imageUrl && (
                            <div className="mt-4 mb-4 rounded-xl overflow-hidden border border-slate-100 max-w-md">
                              <img 
                                src={activity.imageUrl} 
                                alt={activity.title} 
                                className="w-full h-auto object-cover cursor-pointer hover:scale-105 transition-transform duration-500" 
                                onClick={() => setEnlargedImage(activity.imageUrl)}
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}

                          <div 
                            className="text-slate-600 mt-2 leading-relaxed prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: activity.description }}
                          />
                        </div>
                      {isAdmin && (
                        <div className="flex md:flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingActivity(activity); setIsActivityModalOpen(true); }} className="p-2 text-church-600 hover:bg-church-50 rounded-lg"><Edit size={18} /></button>
                          <button onClick={() => handleDeleteActivity(activity.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash size={18} /></button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Reports Section */}
            <section id="reports" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <FileText size={24} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800">{t.committeeDetail.sections.reports}</h3>
                </div>
              </div>
              <ReportsPanel
                committee={committee}
                isAdmin={isAdmin}
                isOfflineMode={isOfflineMode}
                onAdd={() => { setEditingReport(null); setIsReportModalOpen(true); }}
                onEdit={(cid, report) => { setEditingReport(report); setIsReportModalOpen(true); }}
                onDelete={handleDeleteReport}
              />
            </section>

            {/* Property Section */}
            <section id="property" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <PropertyPanel 
                committeeId={id!}
                propertyRecords={committee.propertyRecords || []}
                isAdmin={isAdmin}
                isOfflineMode={isOfflineMode}
                onAdd={() => { setEditingProperty(null); setIsPropertyModalOpen(true); }}
                onEdit={(record) => { setEditingProperty(record); setIsPropertyModalOpen(true); }}
                onDelete={handleDeleteProperty}
                onImport={() => setIsImportPropertyModalOpen(true)}
                committeeName={committee.name}
              />
            </section>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <form onSubmit={handleSaveMember}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-800">{editingMember?.id ? t.committeeDetail.admin.editMember : t.committeeDetail.admin.addMember}</h3>
                  <button type="button" onClick={() => setIsMemberModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-col items-center mb-4">
                    <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative group cursor-pointer">
                      {memberImageFile ? (
                        <img src={URL.createObjectURL(memberImageFile)} alt="Preview" className="w-full h-full object-cover" />
                      ) : editingMember?.imageUrl ? (
                        <img src={editingMember.imageUrl} alt="Current" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="text-slate-400" size={32} />
                      )}
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload className="text-white" size={24} />
                      </div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setMemberImageFile(e.target.files[0]);
                          }
                        }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 mt-2">Upload Profile Picture</span>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">{t.committeeDetail.modals.fullName}</label>
                    <input required className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-church-500 outline-none" value={editingMember?.name || ''} onChange={e => setEditingMember({...editingMember!, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">{t.committeeDetail.modals.role}</label>
                    <input required className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-church-500 outline-none" value={editingMember?.role || ''} onChange={e => setEditingMember({...editingMember!, role: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">{t.committeeDetail.modals.phone}</label>
                    <input className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-church-500 outline-none" value={editingMember?.phone || ''} onChange={e => setEditingMember({...editingMember!, phone: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Image URL</label>
                    <input className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-church-500 outline-none text-xs text-slate-500" placeholder="https://..." value={editingMember?.imageUrl || ''} onChange={e => setEditingMember({...editingMember!, imageUrl: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Biography (Rich Text)</label>
                    <div className="bg-white rounded-xl overflow-hidden border border-slate-300">
                      <ReactQuill 
                        theme="snow" 
                        value={editingMember?.biography || ''} 
                        onChange={(content) => setEditingMember({...editingMember!, biography: content})}
                        className="h-32"
                        modules={{
                          toolbar: [
                            ['bold', 'italic', 'underline'],
                            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                            ['link', 'clean']
                          ]
                        }}
                      />
                    </div>
                    <div className="h-10"></div>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-slate-50 flex justify-end gap-3 px-6">
                <button type="button" onClick={() => setIsMemberModalOpen(false)} className="px-6 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">{t.committeeDetail.modals.cancel}</button>
                <button type="submit" disabled={loading} className="px-8 py-2.5 bg-church-600 text-white font-bold rounded-xl hover:bg-church-700 flex items-center gap-2 shadow-lg shadow-church-200 disabled:opacity-50 transition-all">
                  {loading ? <Loader className="animate-spin w-4 h-4" /> : <Save size={18} />} {t.committeeDetail.modals.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isActivityModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <form onSubmit={handleSaveActivity}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-800">{editingActivity?.id ? t.committeeDetail.admin.editActivity : t.committeeDetail.admin.addActivity}</h3>
                  <button type="button" onClick={() => setIsActivityModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">{t.committeeDetail.activities.title}</label>
                    <input required className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-church-500 outline-none" value={editingActivity?.title || ''} onChange={e => setEditingActivity({...editingActivity!, title: e.target.value})} placeholder={t.committeeDetail.activities.placeholderTitle} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">{t.committeeDetail.activities.date}</label>
                    <input type="text" className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-church-500 outline-none" value={editingActivity?.date || ''} onChange={e => setEditingActivity({...editingActivity!, date: e.target.value})} placeholder={t.committeeDetail.activities.placeholderDate} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">{t.committeeDetail.activities.description}</label>
                    <div className="bg-white rounded-xl overflow-hidden border border-slate-300">
                      <ReactQuill 
                        theme="snow" 
                        value={editingActivity?.description || ''} 
                        onChange={(content) => setEditingActivity({...editingActivity!, description: content})}
                        placeholder={t.committeeDetail.activities.placeholderStory}
                        className="h-48"
                      />
                    </div>
                    <div className="h-12"></div> {/* Spacer for Quill toolbar/overflow */}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Activity Image</label>
                    <div className="space-y-3">
                      <div className="flex flex-col items-center">
                        <div className="w-full aspect-video rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative group cursor-pointer">
                          {activityImageFile ? (
                            <img src={URL.createObjectURL(activityImageFile)} alt="Preview" className="w-full h-full object-cover" />
                          ) : editingActivity?.imageUrl ? (
                            <img src={editingActivity.imageUrl} alt="Current" className="w-full h-full object-cover" />
                          ) : activityImageUrl ? (
                            <img src={activityImageUrl} alt="URL Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-center">
                              <Camera className="text-slate-400 mx-auto mb-2" size={32} />
                              <p className="text-xs text-slate-500">Upload or paste URL below</p>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Upload className="text-white" size={24} />
                          </div>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setActivityImageFile(e.target.files[0]);
                                setActivityImageUrl('');
                              }
                            }}
                          />
                        </div>
                      </div>
                      <input 
                        className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-church-500 outline-none text-xs" 
                        placeholder="Or paste image URL here..." 
                        value={activityImageUrl} 
                        onChange={e => {
                          setActivityImageUrl(e.target.value);
                          setActivityImageFile(null);
                        }} 
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-slate-50 flex justify-end gap-3 px-6">
                <button type="button" onClick={() => setIsActivityModalOpen(false)} className="px-6 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">{t.committeeDetail.modals.cancel}</button>
                <button type="submit" disabled={loading || uploadingActivityImage} className="px-8 py-2.5 bg-church-600 text-white font-bold rounded-xl hover:bg-church-700 flex items-center gap-2 shadow-lg shadow-church-200 disabled:opacity-50 transition-all">
                  {loading || uploadingActivityImage ? <Loader className="animate-spin w-4 h-4" /> : <Save size={18} />} {t.committeeDetail.modals.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isReportModalOpen && (
        <ReportModal
          committeeId={id!}
          editingReport={editingReport}
          onSave={handleSaveReport}
          onClose={() => setIsReportModalOpen(false)}
          loading={loading}
        />
      )}

      {isImageModalOpen && (
        <ImageModal 
          committeeId={id!}
          editingImage={editingImage}
          onSave={handleSaveImage}
          onClose={() => { setIsImageModalOpen(false); setEditingImage(null); }}
          loading={loading}
        />
      )}

      {isImportModalOpen && (
        <ImportMembersModal 
          onImport={handleImportMembers}
          onClose={() => setIsImportModalOpen(false)}
          loading={loading}
        />
      )}

      {isPropertyModalOpen && (
        <PropertyRecordModal 
          committeeId={id!}
          editingRecord={editingProperty}
          onSave={handleSaveProperty}
          onClose={() => { setIsPropertyModalOpen(false); setEditingProperty(null); }}
          loading={loading}
        />
      )}

      {isImportPropertyModalOpen && (
        <ImportPropertyModal 
          onImport={handleImportProperty}
          onClose={() => setIsImportPropertyModalOpen(false)}
          loading={loading}
        />
      )}

      {/* Enlarged Image Modal */}
      {enlargedImage && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4" onClick={() => setEnlargedImage(null)}>
          <img src={enlargedImage} alt="Enlarged" className="max-w-full max-h-full object-contain" />
          <button onClick={() => setEnlargedImage(null)} className="absolute top-4 right-4 text-white hover:text-slate-300 transition-colors">
            <X size={32} />
          </button>
        </div>
      )}

      {/* Member Biography Modal */}
      {selectedMemberBio && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedMemberBio(null)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100">
                  {selectedMemberBio.imageUrl ? (
                    <img src={selectedMemberBio.imageUrl} alt={selectedMemberBio.name} className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-full h-full p-2 text-slate-300" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{selectedMemberBio.name}</h3>
                  <p className="text-church-600 text-sm font-medium">{selectedMemberBio.role}</p>
                </div>
              </div>
              <button onClick={() => setSelectedMemberBio(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-8 overflow-y-auto">
              <article 
                className="prose prose-slate max-w-none ql-editor"
                dangerouslySetInnerHTML={{ __html: selectedMemberBio.biography || '' }}
              />
            </div>
            <div className="p-4 bg-slate-50 border-t flex justify-end">
              <button onClick={() => setSelectedMemberBio(null)} className="px-6 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommitteeDetail;
