import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  BookOpen, DollarSign, Globe, Home, Users, Coffee, Heart, Music, 
  Smile, Library, Book, Box, Newspaper, FileText, UserPlus, Clock, 
  ClipboardCheck, Handshake, ChevronDown, ChevronUp, Search, Loader, 
  AlertTriangle, Phone, Plus, Edit, Trash, Save, X, Database, ArrowUp, ArrowDown,
  Upload, Download, File, FileSpreadsheet, Trash2, BarChart2, Image as ImageIcon,
  Camera
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { db, storage, handleFirestoreError, OperationType } from '../services/firebase';
import { Committee, CommitteeMember, CommitteeImage } from '../types';
import { useAuth } from '../contexts/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CommitteeReport {
  id: string;
  name: string;           // e.g. "Annual Report 2024"
  type: 'yearly' | 'monthly';
  year: number;           // e.g. 2024
  month?: number;         // 1–12, only for monthly
  fileUrl: string;        // download / embed URL
  fileType: 'pdf' | 'excel';
  uploadedAt: string;     // ISO date string
  uploadedBy?: string;
}

// ─── Icon maps (unchanged) ───────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  'BookOpen': BookOpen, 'DollarSign': DollarSign, 'Globe': Globe,
  'Home': Home, 'Users': Users, 'Coffee': Coffee, 'Heart': Heart,
  'Music': Music, 'Smile': Smile, 'Library': Library, 'Book': Book,
  'Box': Box, 'Newspaper': Newspaper, 'FileText': FileText,
  'UserPlus': UserPlus, 'Clock': Clock, 'ClipboardCheck': ClipboardCheck,
  'Handshake': Handshake
};

const ICON_COLORS: Record<string, string> = {
  'BookOpen': 'from-blue-600 to-blue-800 text-white border-blue-400',
  'DollarSign': 'from-emerald-600 to-emerald-800 text-white border-emerald-400',
  'Globe': 'from-indigo-600 to-indigo-800 text-white border-indigo-400',
  'Home': 'from-orange-600 to-orange-800 text-white border-orange-400',
  'Users': 'from-violet-600 to-violet-800 text-white border-violet-400',
  'Coffee': 'from-amber-600 to-amber-800 text-white border-amber-400',
  'Heart': 'from-rose-600 to-rose-800 text-white border-rose-400',
  'Music': 'from-pink-600 to-pink-800 text-white border-pink-400',
  'Smile': 'from-yellow-500 to-yellow-700 text-white border-yellow-300',
  'Library': 'from-cyan-600 to-cyan-800 text-white border-cyan-400',
  'Book': 'from-blue-600 to-blue-800 text-white border-blue-400',
  'Box': 'from-slate-600 to-slate-800 text-white border-slate-400',
  'Newspaper': 'from-gray-600 to-gray-800 text-white border-gray-400',
  'FileText': 'from-teal-600 to-teal-800 text-white border-teal-400',
  'UserPlus': 'from-green-600 to-green-800 text-white border-green-400',
  'Clock': 'from-fuchsia-600 to-fuchsia-800 text-white border-fuchsia-400',
  'ClipboardCheck': 'from-lime-600 to-lime-800 text-white border-lime-400',
  'Handshake': 'from-sky-600 to-sky-800 text-white border-sky-400'
};

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

// ─── Initial committee data (unchanged) ─────────────────────────────────────

const INITIAL_COMMITTEES: Omit<Committee, 'id'>[] = [
   {
    name: 'Sunday School',
    icon: 'BookOpen',
    description: 'The Sunday School Committee oversees the spiritual education of children and youth, organizing classes, curriculum, and special events.',
    members: [
        { id: 'ss-c', name: 'Upa David Lalchhanhima', role: 'Chairman' },
        { id: 'ss-vc', name: 'Upa Lalremruata', role: 'Vice Chairman' },
        { id: 'ss-s', name: 'Pu C. Rohmingliana', role: 'Secretary' },
        { id: 'ss-as', name: 'Pu Manliankhupa', role: 'Asst. Secretary' },
        { id: 'ss-m-kc', name: 'Kohhran Committee te', role: 'Member' },
        { id: 'ss-m-dl1', name: 'Pu Zoramenga', role: 'Leader, Senior Dept.' },
        { id: 'ss-m-dl2', name: 'T.Upa Hmingthansanga', role: 'Leader, Sacrament Dept.' },
        { id: 'ss-m-dl3', name: 'Pu V.Lalbiakdika', role: 'Leader, Intermediate Dept.' },
        { id: 'ss-m-dl4', name: 'Tv.H.Lalfakawma', role: 'Leader, Junior Dept.' },
        { id: 'ss-m-dl5', name: 'Pu Mungngaihsanga', role: 'Leader, Primary Dept.' },
        { id: 'ss-m-dl6', name: 'Pi K.Lalbiakthangi', role: 'Leader, Beginners Dept.' },
        { id: 'ss-m-dl7', name: 'Pi K.Lalrokhumi', role: 'Leader, Pre-Beginners Dept.' },
        { id: 'ss-m-lib', name: 'Upa Daikhawzama', role: 'Librarian' }
    ]
  },
  {
    name: 'Finance Committee',
    icon: 'DollarSign',
    description: 'Responsible for managing the church\'s financial resources, including budgeting, fundraising, and transparent reporting.',
    members: [
        { id: 'fin-c', name: 'Upa C.Lalthantluanga', role: 'Chairman' },
        { id: 'fin-vc', name: 'Upa Daikhawzama', role: 'Vice Chairman' },
        { id: 'fin-s', name: 'Pu Lalmuanpuia Ralte', role: 'Secretary' },
        { id: 'fin-as1', name: 'Pu C.Lalmuansanga', role: 'Asst. Secretary' },
        { id: 'fin-as2', name: 'Pu R.Lalmalsawma', role: 'Asst. Secretary' },
        { id: 'fin-m1', name: 'Pu Dawngsuanpauva', role: 'Member' },
        { id: 'fin-m2', name: 'Pu C.Rohmingliana', role: 'Member' },
        { id: 'fin-m3', name: 'Pu Lalsanglura Zote', role: 'Member' },
        { id: 'fin-m4', name: 'Pu Lalramthara', role: 'Member' },
        { id: 'fin-m5', name: 'Pu T.Sangtluanga', role: 'Member' },
        { id: 'fin-m6', name: 'Pu Thangdeihchina', role: 'Member' },
        { id: 'fin-m7', name: 'Pu JC Laldinthara', role: 'Member' },
        { id: 'fin-m8', name: 'Pu MS Dawngliana', role: 'Member' },
        { id: 'fin-m9', name: 'Pu K.Lalengthanga', role: 'Member' },
        { id: 'fin-m10', name: 'Pu C.Lalrawngbawla', role: 'Member' },
        { id: 'fin-m11', name: 'Pu Lalhmingmawia', role: 'Member' },
        { id: 'fin-m12', name: 'Pu Thanglianmanga', role: 'Member' },
        { id: 'fin-m13', name: 'Pu Kenneth Lalthanzauva', role: 'Member' },
        { id: 'fin-m14', name: 'Pu Nelson Khiangte', role: 'Member' },
        { id: 'fin-m15', name: 'Pu Kapthuama', role: 'Member' },
        { id: 'fin-m16', name: 'Pu Khawlrosiama', role: 'Member' },
        { id: 'fin-m17', name: 'Pu Thangkunga Hualngo', role: 'Member' },
        { id: 'fin-m18', name: 'Pu Mungngaihsanga', role: 'Member' },
        { id: 'fin-m19', name: 'Pu C.Malsawmdawngliana', role: 'Member' },
        { id: 'fin-m20', name: 'Pu B.Zelkhangova', role: 'Member' },
        { id: 'fin-m21', name: 'Pu PC Zoramthanga', role: 'Member' },
        { id: 'fin-m22', name: 'Pu K.Lalengkima', role: 'Member' },
        { id: 'fin-m23', name: 'Pu Lalthanghulha', role: 'Member' },
        { id: 'fin-m24', name: 'Pu C.Lalengmawia', role: 'Member' },
        { id: 'fin-m25', name: 'Pu Lalmuanpuia', role: 'Member' },
        { id: 'fin-m26', name: 'Pu Lalramnghakhlela', role: 'Member' },
        { id: 'fin-m27', name: 'Pu F.Lalhriatpuia', role: 'Member' },
        { id: 'fin-m28', name: 'Pu H.Lalzuitluanga', role: 'Member' },
    ]
  },
  {
    name: 'Ramthar Committee',
    icon: 'Globe',
    description: 'Dedicated to supporting missionary work and outreach programs, spreading the Gospel beyond our local community.',
    members: [
      { id: 'ramthar-c', name: 'Upa H.Zairemmawia', role: 'Chairman' },
      { id: 'ramthar-vc', name: 'Pu H.Vanlalthanga', role: 'Vice Chairman' },
      { id: 'ramthar-s', name: 'Pu K.Lalengthanga', role: 'Secretary' },
      { id: 'ramthar-as', name: 'Pu Thangkunga Hualngo', role: 'Asst. Secretary' },
      { id: 'ramthar-t', name: 'Pu T.Sangtluanga', role: 'Treasurer' },
      { id: 'ramthar-fs', name: 'Pu C.Lalrawngbawla', role: 'Fin. Secretary' },
      { id: 'ramthar-m1', name: 'Pu R.Lalremmawia', role: 'Member' },
    ]
  },
  {
    name: 'Building Committee',
    icon: 'Home',
    description: 'Manages the construction, maintenance, and renovation of all church properties and facilities.',
    members: [
        { id: 'bld-c', name: 'Upa David Lalchhanhima', role: 'Chairman' },
        { id: 'bld-vc', name: 'Upa R.Lalramhluna', role: 'Vice Chairman' },
    ]
  },
  {
    name: 'Social Front Committee',
    icon: 'Handshake',
    description: 'Organizes community service projects, social welfare initiatives, and outreach to those in need within and outside the church.',
    members: []
  },
  {
    name: 'Refreshment Committee',
    icon: 'Coffee',
    description: 'Coordinates hospitality and refreshments for church events, ensuring comfort and fellowship for all attendees.',
    members: []
  },
  {
    name: 'Kristian Chhungkua Committee',
    icon: 'Heart',
    description: 'Promotes Christian family values and provides support for families within the church through various programs and counseling.',
    members: []
  },
  {
    name: 'Worship Committee',
    icon: 'Music',
    description: 'Plans and organizes all worship services, including music, liturgy, and special programs to enhance the worship experience.',
    members: []
  },
  {
    name: 'Masihi Sangati Committee',
    icon: 'Users',
    description: 'Fosters fellowship and spiritual growth among non-Mizo speaking members, organizing services and activities in Hindi.',
    members: []
  },
  {
    name: 'Reception, Ushering & Decoration Committee',
    icon: 'Smile',
    description: 'Ensures a warm welcome for all visitors and members, manages ushering duties, and beautifies the church premises.',
    members: []
  },
  {
    name: 'Archive & Library Committee',
    icon: 'Library',
    description: 'Preserves the church\'s historical records, documents, and maintains the church library for members to access spiritual resources.',
    members: []
  },
  {
    name: 'Bible Society of India (BSI)',
    icon: 'BookOpen',
    description: 'Supports the mission of the Bible Society of India in making Bibles available and accessible to everyone in local languages.',
    members: []
  },
  {
    name: 'Bungraw Enkawltu Committee',
    icon: 'Box',
    description: 'Manages and maintains all church assets and supplies, ensuring resources are available and in good condition.',
    members: []
  },
];

// ─── Report Upload Modal ──────────────────────────────────────────────────────

interface ReportModalProps {
  committeeId: string;
  editingReport?: CommitteeReport | null;
  onSave: (committeeId: string, report: CommitteeReport) => Promise<void>;
  onClose: () => void;
  loading: boolean;
}

const ReportModal: React.FC<ReportModalProps> = ({ committeeId, editingReport, onSave, onClose, loading }) => {
  const currentYear = new Date().getFullYear();
  const [form, setForm] = useState<Partial<CommitteeReport>>(
    editingReport ?? {
      type: 'monthly',
      year: currentYear,
      month: new Date().getMonth() + 1,
      fileType: 'pdf',
      name: '',
      fileUrl: '',
    }
  );
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf';
    const isExcel = file.type.includes('spreadsheetml') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (!isPdf && !isExcel) {
      alert('Please select a PDF or Excel (.xlsx / .xls) file.');
      return;
    }

    // Check file size — Firestore doc limit is 1MB, base64 inflates ~33%
    // So max safe raw file size is ~750KB
    if (file.size > 750 * 1024) {
      alert(`File is ${(file.size / 1024).toFixed(0)}KB. Please keep files under 750KB so they fit in the database. Try compressing the PDF first.`);
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setForm(prev => ({
        ...prev,
        fileUrl: reader.result as string,
        fileType: isPdf ? 'pdf' : 'excel',
        name: prev.name || file.name.replace(/\.[^/.]+$/, ''),
      }));
      setUploading(false);
    };
    reader.onerror = () => {
      alert('Failed to read file. Please try again.');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.fileUrl || !form.year) {
      alert('Please fill in all required fields and upload a file.');
      return;
    }

    const report: CommitteeReport = {
      id: editingReport?.id || Date.now().toString(),
      name: form.name!,
      type: form.type as 'yearly' | 'monthly',
      year: Number(form.year),
      month: form.type === 'monthly' ? Number(form.month) : undefined,
      fileUrl: form.fileUrl!,
      fileType: form.fileType as 'pdf' | 'excel',
      uploadedAt: editingReport?.uploadedAt || new Date().toISOString(),
    };

    await onSave(committeeId, report);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                {editingReport ? 'Edit Report' : 'Upload Report'}
              </h3>
              <button type="button" onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Report Type */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Report Type</label>
                <div className="flex gap-3">
                  {(['monthly', 'yearly'] as const).map(t => (
                    <label key={t} className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg border-2 cursor-pointer transition-colors ${form.type === t ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-semibold' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                      <input type="radio" name="type" value={t} checked={form.type === t} onChange={() => setForm(prev => ({ ...prev, type: t }))} className="sr-only" />
                      {t === 'monthly' ? 'Monthly' : 'Yearly'}
                    </label>
                  ))}
                </div>
              </div>

              {/* Year */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Year</label>
                <select
                  className="w-full border border-slate-300 rounded-lg p-2.5"
                  value={form.year}
                  onChange={e => setForm(prev => ({ ...prev, year: Number(e.target.value) }))}
                >
                  {Array.from({ length: 10 }, (_, i) => currentYear - i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              {/* Month (only for monthly) */}
              {form.type === 'monthly' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Month</label>
                  <select
                    className="w-full border border-slate-300 rounded-lg p-2.5"
                    value={form.month}
                    onChange={e => setForm(prev => ({ ...prev, month: Number(e.target.value) }))}
                  >
                    {MONTH_NAMES.map((m, i) => (
                      <option key={i + 1} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Report Name */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Report Title</label>
                <input
                  required
                  className="w-full border border-slate-300 rounded-lg p-2.5"
                  placeholder={form.type === 'yearly' ? `Annual Report ${form.year}` : `${MONTH_NAMES[(form.month || 1) - 1]} ${form.year} Report`}
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Upload File <span className="font-normal text-slate-500">(PDF or Excel)</span>
                </label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-colors"
                >
                  {uploading ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-600">
                      <Loader className="animate-spin w-5 h-5" /> Reading file...
                    </div>
                  ) : form.fileUrl ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-700">
                      {form.fileType === 'pdf'
                        ? <File size={22} className="text-red-500" />
                        : <FileSpreadsheet size={22} className="text-green-600" />}
                      <span className="text-sm font-medium">{form.name || 'File loaded'}</span>
                      <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">{form.fileType?.toUpperCase()}</span>
                    </div>
                  ) : (
                    <div className="text-slate-500">
                      <Upload size={28} className="mx-auto mb-2 text-slate-400" />
                      <p className="text-sm">Click to choose PDF or Excel file</p>
                      <p className="text-xs mt-1 text-slate-400">.pdf, .xlsx, .xls</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.xlsx,.xls,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  className="sr-only"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 flex justify-end gap-2 rounded-b-xl">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100">Cancel</button>
            <button
              type="submit"
              disabled={loading || uploading || !form.fileUrl}
              className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader className="animate-spin w-4 h-4" /> : <Save size={16} />}
              {editingReport ? 'Update' : 'Upload'} Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Reports Tab Panel ────────────────────────────────────────────────────────

interface ReportsPanelProps {
  committee: Committee & { reports?: CommitteeReport[] };
  isAdmin: boolean;
  isOfflineMode: boolean;
  onAdd: (committeeId: string) => void;
  onEdit: (committeeId: string, report: CommitteeReport) => void;
  onDelete: (committeeId: string, reportId: string) => void;
}

const ReportsPanel: React.FC<ReportsPanelProps> = ({
  committee, isAdmin, isOfflineMode, onAdd, onEdit, onDelete
}) => {
  const [reportView, setReportView] = useState<'yearly' | 'monthly'>('yearly');
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());

  const reports: CommitteeReport[] = (committee as any).reports || [];

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

  const FileIcon: React.FC<{ type: 'pdf' | 'excel' }> = ({ type }) =>
    type === 'pdf'
      ? <File size={18} className="text-red-500 flex-shrink-0" />
      : <FileSpreadsheet size={18} className="text-green-600 flex-shrink-0" />;

  const handleDownload = (report: CommitteeReport) => {
    const link = document.createElement('a');
    link.href = report.fileUrl;
    const ext = report.fileType === 'pdf' ? 'pdf' : 'xlsx';
    link.download = `${report.name}.${ext}`;
    link.click();
  };

  return (
    <div>
      {/* Sub-tab toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
          {(['yearly', 'monthly'] as const).map(v => (
            <button
              key={v}
              onClick={() => setReportView(v)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                reportView === v
                  ? 'bg-white text-emerald-700 shadow-sm'
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
            className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg hover:bg-emerald-200 flex items-center gap-1"
          >
            <Upload size={13} /> Upload Report
          </button>
        )}
      </div>

      {/* ── Yearly View ── */}
      {reportView === 'yearly' && (
        <div>
          {yearlyReports.length === 0 ? (
            <p className="text-sm text-slate-400 italic py-4 text-center">No yearly reports uploaded yet.</p>
          ) : (
            <ul className="space-y-2">
              {yearlyReports.map(r => (
                <li
                  key={r.id}
                  className="group flex items-center justify-between bg-white rounded-lg border border-slate-100 px-4 py-3 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileIcon type={r.fileType} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{r.name}</p>
                      <p className="text-xs text-slate-400">{r.year} · {r.fileType.toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                    <button
                      onClick={() => handleDownload(r)}
                      title="Download"
                      className="p-1.5 text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100"
                    >
                      <Download size={15} />
                    </button>
                    {isAdmin && !isOfflineMode && (
                      <>
                        <button
                          onClick={() => onEdit(committee.id, r)}
                          className="p-1.5 text-church-600 bg-church-50 rounded-lg hover:bg-church-100 opacity-0 group-hover:opacity-100 transition"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => onDelete(committee.id, r.id)}
                          className="p-1.5 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 opacity-0 group-hover:opacity-100 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── Monthly View ── */}
      {reportView === 'monthly' && (
        <div>
          {/* Year selector */}
          <div className="flex items-center gap-2 mb-3">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Year:</label>
            <select
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white"
              value={filterYear}
              onChange={e => setFilterYear(Number(e.target.value))}
            >
              {allYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {monthlyReports.length === 0 ? (
            <p className="text-sm text-slate-400 italic py-4 text-center">
              No monthly reports for {filterYear}.
            </p>
          ) : (
            <ul className="space-y-2">
              {monthlyReports.map(r => (
                <li
                  key={r.id}
                  className="group flex items-center justify-between bg-white rounded-lg border border-slate-100 px-4 py-3 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileIcon type={r.fileType} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{r.name}</p>
                      <p className="text-xs text-slate-400">
                        {r.month ? MONTH_NAMES[r.month - 1] : ''} {r.year} · {r.fileType.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                    <button
                      onClick={() => handleDownload(r)}
                      title="Download"
                      className="p-1.5 text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100"
                    >
                      <Download size={15} />
                    </button>
                    {isAdmin && !isOfflineMode && (
                      <>
                        <button
                          onClick={() => onEdit(committee.id, r)}
                          className="p-1.5 text-church-600 bg-church-50 rounded-lg hover:bg-church-100 opacity-0 group-hover:opacity-100 transition"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => onDelete(committee.id, r.id)}
                          className="p-1.5 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 opacity-0 group-hover:opacity-100 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Image Upload Modal ───────────────────────────────────────────────────────

interface ImageModalProps {
  committeeId: string;
  onSave: (committeeId: string, image: CommitteeImage) => Promise<void>;
  onClose: () => void;
  loading: boolean;
}

const ImageModal: React.FC<ImageModalProps> = ({ committeeId, onSave, onClose, loading }) => {
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
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
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert('Please select an image.');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const storagePath = `committees/${committeeId}/images/${fileName}`;
      const storageRef = storage.ref().child(storagePath);
      
      const uploadTask = storageRef.put(file);
      
      const downloadUrl = await new Promise<string>((resolve, reject) => {
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

      const image: CommitteeImage = {
        id: Date.now().toString(),
        url: downloadUrl,
        caption: caption.trim(),
        uploadedAt: new Date().toISOString(),
      };

      await onSave(committeeId, image);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Add Image</h3>
              <button type="button" onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div 
                onClick={() => fileRef.current?.click()}
                className="aspect-video border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-church-400 hover:bg-church-50 transition-all overflow-hidden relative"
              >
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera size={32} className="text-slate-400 mb-2" />
                    <p className="text-sm text-slate-500 font-medium">Click to select image</p>
                  </>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <Loader className="animate-spin text-church-600" size={24} />
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Caption (Optional)</label>
                <input 
                  className="w-full border border-slate-300 rounded-lg p-2.5" 
                  placeholder="Enter a brief caption..." 
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 flex justify-end gap-2 rounded-b-xl">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100">Cancel</button>
            <button 
              type="submit" 
              disabled={loading || uploading || !file}
              className="px-5 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 flex items-center gap-2 disabled:opacity-50"
            >
              {loading || uploading ? <Loader className="animate-spin w-4 h-4" /> : <Save size={16} />}
              Upload Image
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Images Tab Panel ─────────────────────────────────────────────────────────

interface ImagesPanelProps {
  committee: Committee & { images?: CommitteeImage[] };
  isAdmin: boolean;
  isOfflineMode: boolean;
  galleryFolders: GalleryFolder[];
  galleryItems: GalleryItem[];
  onAdd: (committeeId: string) => void;
  onDelete: (committeeId: string, imageId: string) => void;
}

const ImagesPanel: React.FC<ImagesPanelProps> = ({ 
  committee, 
  isAdmin, 
  isOfflineMode, 
  galleryFolders,
  galleryItems,
  onAdd, 
  onDelete 
}) => {
  const directImages: CommitteeImage[] = (committee as any).images || [];
  
  // Find linked gallery folder
  const linkedFolder = galleryFolders.find(f => f.name.toLowerCase() === committee.name.toLowerCase());
  const linkedImages = linkedFolder 
    ? galleryItems.filter(item => item.folderId === linkedFolder.id)
    : [];

  return (
    <div>
      {/* Gallery Synced Images */}
      {linkedImages.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-church-600 uppercase tracking-wider">Synced from Gallery</h4>
              <span className="text-[10px] bg-church-100 text-church-700 px-2 py-0.5 rounded-full font-bold">Auto-Sync</span>
            </div>
            <Link 
              to={`/gallery/committees/${linkedFolder?.id}`}
              className="text-[10px] text-slate-500 hover:text-church-600 underline"
            >
              Manage in Gallery
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {linkedImages.map(img => (
              <div key={img.id} className="group relative aspect-square rounded-lg overflow-hidden bg-slate-200 shadow-sm border border-slate-100">
                <img 
                  src={img.imageUrl} 
                  alt={img.title || 'Gallery Image'} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 translate-y-full group-hover:translate-y-0 transition-transform">
                  <p className="text-[10px] text-white line-clamp-2 leading-tight">{img.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Direct Uploads */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          {linkedImages.length > 0 ? 'Direct Committee Uploads' : 'Images'}
        </h4>
        {isAdmin && !isOfflineMode && (
          <button 
            onClick={() => onAdd(committee.id)}
            className="text-xs font-semibold text-church-600 bg-church-100 px-3 py-1.5 rounded-lg hover:bg-church-200 flex items-center gap-1"
          >
            <Plus size={13} /> Add Image
          </button>
        )}
      </div>

      {directImages.length === 0 && linkedImages.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-slate-200">
          <ImageIcon size={48} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm text-slate-500">No images found for this committee.</p>
          {isAdmin && (
            <p className="text-xs text-church-600 mt-2">
              Upload directly here or create a folder named "{committee.name}" in the Gallery.
            </p>
          )}
        </div>
      ) : directImages.length === 0 && linkedImages.length > 0 ? (
        <p className="text-xs text-slate-400 italic text-center py-4">No direct uploads. All images are synced from Gallery.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {directImages.map(img => (
            <div key={img.id} className="group relative aspect-square rounded-lg overflow-hidden bg-slate-200 shadow-sm border border-slate-100">
              <img 
                src={img.url} 
                alt={img.caption || 'Committee Image'} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              {img.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 translate-y-full group-hover:translate-y-0 transition-transform">
                  <p className="text-[10px] text-white line-clamp-2 leading-tight">{img.caption}</p>
                </div>
              )}
              {isAdmin && !isOfflineMode && (
                <button 
                  onClick={() => onDelete(committee.id, img.id)}
                  className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Departments component ───────────────────────────────────────────────

const Departments: React.FC = () => {
  const { t } = useLanguage();
  const { isAdmin } = useAuth();
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCommitteeId, setExpandedCommitteeId] = useState<string | null>(null);

  // Active inner tab per committee: 'members' | 'activities' | 'images' | 'reports'
  const [activeTab, setActiveTab] = useState<Record<string, 'members' | 'activities' | 'images' | 'reports'>>({});

  // Committee modal
  const [isCommitteeModalOpen, setIsCommitteeModalOpen] = useState(false);
  const [editingCommittee, setEditingCommittee] = useState<Partial<Committee> | null>(null);

  // Member modal
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMemberInfo, setEditingMemberInfo] = useState<{ committeeId: string; member?: CommitteeMember } | null>(null);

  // Activity modal
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivityInfo, setEditingActivityInfo] = useState<{ committeeId: string; activity?: any } | null>(null);

  // Report modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [editingReportInfo, setEditingReportInfo] = useState<{ committeeId: string; report?: CommitteeReport | null }>({ committeeId: '' });

  // Image modal
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedCommitteeForImage, setSelectedCommitteeForImage] = useState<string | null>(null);

  // Gallery Sync Data
  const [galleryFolders, setGalleryFolders] = useState<GalleryFolder[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);

  // Reordering
  const [hasOrderChanged, setHasOrderChanged] = useState(false);
  const initialOrderRef = useRef<string[]>([]);

  const fetchCommittees = useCallback(async () => {
    setLoading(true);
    if (!db || !db.collection) {
       setCommittees(INITIAL_COMMITTEES.map((c, i) => ({ ...c, id: `static-${i}`, order: i } as Committee)));
       setIsOfflineMode(true);
       setLoading(false);
       return;
    }

    try {
        // Fetch Gallery data for syncing
        const gFoldersSnap = await db.collection('gallery_folders').where('category', '==', 'Committees').get();
        const gFolders = gFoldersSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
        setGalleryFolders(gFolders);

        const gItemsSnap = await db.collection('gallery').where('category', '==', 'Committees').get();
        const gItems = gItemsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
        setGalleryItems(gItems);

        const snapshot = await db.collection('committees').get();
        if (!snapshot.empty) {
            const fetchedData = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data()
            })) as Committee[];
            fetchedData.sort((a, b) => {
                if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
                return a.name.localeCompare(b.name);
            });

            // Fetch reports subcollection for each committee
            const fetchedWithSubcollections = await Promise.all(
              fetchedData.map(async (committee) => {
                try {
                  const reportsSnap = await db.collection('committees').doc(committee.id).collection('committeeReports').get();
                  const reports: CommitteeReport[] = reportsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
                  
                  const imagesSnap = await db.collection('committees').doc(committee.id).collection('committeeImages').get();
                  const images: CommitteeImage[] = imagesSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
                  
                  return { ...committee, reports, images };
                } catch {
                  return { ...committee, reports: [], images: [] };
                }
              })
            );

            setCommittees(fetchedWithSubcollections as any);
            initialOrderRef.current = fetchedWithSubcollections.map(c => c.id);
            setIsOfflineMode(false);
        } else {
            setCommittees(INITIAL_COMMITTEES.map((c, i) => ({ ...c, id: `static-${i}`, order: i } as Committee)));
        }
    } catch (error: any) {
        setCommittees(INITIAL_COMMITTEES.map((c, i) => ({ ...c, id: `static-${i}`, order: i } as Committee)));
        setIsOfflineMode(true);
    }
    setLoading(false);
    setHasOrderChanged(false);
  }, []);

  useEffect(() => { fetchCommittees(); }, [fetchCommittees]);

  // ── Save committee ──────────────────────────────────────────────────────────

  const handleSaveCommittee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !editingCommittee) return;
    setLoading(true);
    try {
        const { id, ...dataToSave } = editingCommittee;
        if (id && !id.startsWith('static-')) {
            await db.collection('committees').doc(id).set(dataToSave, { merge: true });
        } else {
            const newOrder = committees.length > 0 ? Math.max(...committees.map(c => c.order || 0)) + 1 : 0;
            await db.collection('committees').add({ name: dataToSave.name || 'Untitled', icon: dataToSave.icon || 'Users', description: dataToSave.description || '', members: dataToSave.members || [], order: newOrder });
        }
        setIsCommitteeModalOpen(false);
        setEditingCommittee(null);
        fetchCommittees();
    } catch (error) { console.error("Error saving committee:", error); }
    setLoading(false);
  };

  const handleDeleteCommittee = async (committeeId: string) => {
    if (!db || !window.confirm("Are you sure you want to delete this entire committee?")) return;
    try { await db.collection('committees').doc(committeeId).delete(); fetchCommittees(); }
    catch (error) { console.error("Error deleting committee:", error); }
  };

  // ── Save member ─────────────────────────────────────────────────────────────

  const handleSaveMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !editingMemberInfo?.committeeId || !editingMemberInfo.member) return;
    setLoading(true);
    const { committeeId, member } = editingMemberInfo;
    try {
        const committeeRef = db.collection('committees').doc(committeeId);
        const doc = await committeeRef.get();
        if (!doc.exists) throw new Error("Committee not found");
        const committeeData = doc.data() as Committee;
        let members = committeeData.members || [];
        if (member.id) { members = members.map(m => m.id === member.id ? member : m); }
        else { members.push({ ...member, id: Date.now().toString() }); }
        await committeeRef.update({ members });
        setCommittees(prev => prev.map(c => c.id === committeeId ? { ...c, members } : c));
        setIsMemberModalOpen(false);
    } catch (error) { console.error("Error saving member:", error); }
    setLoading(false);
  };

  const handleDeleteMember = async (committeeId: string, memberId: string) => {
    if (!db || !window.confirm("Delete this member?")) return;
    try {
        const committeeRef = db.collection('committees').doc(committeeId);
        const doc = await committeeRef.get();
        if (!doc.exists) throw new Error("Committee not found");
        const members = ((doc.data() as Committee).members || []).filter(m => m.id !== memberId);
        await committeeRef.update({ members });
        setCommittees(prev => prev.map(c => c.id === committeeId ? { ...c, members } : c));
    } catch (error) { console.error("Error deleting member:", error); }
  };

  // ── Save activity ───────────────────────────────────────────────────────────

  const handleSaveActivity = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !editingActivityInfo?.committeeId || !editingActivityInfo.activity) return;
    setLoading(true);
    const { committeeId, activity } = editingActivityInfo;
    try {
        const committeeRef = db.collection('committees').doc(committeeId);
        const doc = await committeeRef.get();
        if (!doc.exists) throw new Error("Committee not found");
        const committeeData = doc.data() as Committee;
        let activities = committeeData.activities || [];
        if (activity.id) { activities = activities.map(a => a.id === activity.id ? activity : a); }
        else { activities.push({ ...activity, id: Date.now().toString() }); }
        await committeeRef.update({ activities });
        setCommittees(prev => prev.map(c => c.id === committeeId ? { ...c, activities } : c));
        setIsActivityModalOpen(false);
    } catch (error) { console.error("Error saving activity:", error); }
    setLoading(false);
  };

  const handleDeleteActivity = async (committeeId: string, activityId: string) => {
    if (!db || !window.confirm("Delete this activity?")) return;
    try {
        const committeeRef = db.collection('committees').doc(committeeId);
        const doc = await committeeRef.get();
        if (!doc.exists) throw new Error("Committee not found");
        const activities = ((doc.data() as any).activities || []).filter((a: any) => a.id !== activityId);
        await committeeRef.update({ activities });
        setCommittees(prev => prev.map(c => c.id === committeeId ? { ...c, activities } : c));
    } catch (error) { console.error("Error deleting activity:", error); }
  };

  // ── Save report ─────────────────────────────────────────────────────────────

  // ── Save report — stored in subcollection to avoid 1MB committee doc limit ──

  const handleSaveReport = async (committeeId: string, report: CommitteeReport) => {
    if (!db) return;
    setLoading(true);
    try {
      const reportsRef = db.collection('committees').doc(committeeId).collection('committeeReports');

      if (editingReportInfo.report?.id) {
        // Update existing
        await reportsRef.doc(report.id).set(report);
      } else {
        // Add new — use report.id as doc ID
        await reportsRef.doc(report.id).set(report);
      }

      // Refresh reports for this committee in local state
      const snap = await reportsRef.get();
      const reports: CommitteeReport[] = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      setCommittees(prev => prev.map(c => c.id === committeeId ? { ...c, reports } as any : c));

      setIsReportModalOpen(false);
      setEditingReportInfo({ committeeId: '' });
    } catch (error) {
      console.error("Error saving report:", error);
      alert("Failed to save report. Please try again.");
    }
    setLoading(false);
  };

  const handleDeleteReport = async (committeeId: string, reportId: string) => {
    if (!db || !window.confirm("Delete this report?")) return;
    try {
      await db.collection('committees').doc(committeeId).collection('committeeReports').doc(reportId).delete();
      setCommittees(prev => prev.map(c => {
        if (c.id !== committeeId) return c;
        const reports = ((c as any).reports || []).filter((r: CommitteeReport) => r.id !== reportId);
        return { ...c, reports } as any;
      }));
    } catch (error) { console.error("Error deleting report:", error); }
  };

  // ── Save image — stored in subcollection ────────────────────────────────────

  const handleSaveImage = async (committeeId: string, image: CommitteeImage) => {
    if (!db) return;
    setLoading(true);
    try {
      const imagesRef = db.collection('committees').doc(committeeId).collection('committeeImages');
      await imagesRef.doc(image.id).set(image);

      // Refresh images for this committee
      const snap = await imagesRef.get();
      const images: CommitteeImage[] = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      setCommittees(prev => prev.map(c => c.id === committeeId ? { ...c, images } as any : c));

      setIsImageModalOpen(false);
      setSelectedCommitteeForImage(null);
    } catch (error) {
      console.error("Error saving image:", error);
      alert("Failed to save image metadata.");
    }
    setLoading(false);
  };

  const handleDeleteImage = async (committeeId: string, imageId: string) => {
    if (!db || !window.confirm("Delete this image?")) return;
    try {
      await db.collection('committees').doc(committeeId).collection('committeeImages').doc(imageId).delete();
      setCommittees(prev => prev.map(c => {
        if (c.id !== committeeId) return c;
        const images = ((c as any).images || []).filter((img: CommitteeImage) => img.id !== imageId);
        return { ...c, images } as any;
      }));
    } catch (error) { console.error("Error deleting image:", error); }
  };

  // ── Seed / order ────────────────────────────────────────────────────────────

  const handleSeedData = async () => {
    if (!db || !db.collection || !window.confirm("This will DELETE ALL existing committees and re-seed from the initial data. Are you sure?")) return;
    setIsSeeding(true);
    try {
        const committeesRef = db.collection('committees');
        const existingDocs = await committeesRef.get();
        if (!existingDocs.empty) {
            const deleteBatch = db.batch();
            existingDocs.docs.forEach((doc: any) => deleteBatch.delete(doc.ref));
            await deleteBatch.commit();
        }
        const addBatch = db.batch();
        INITIAL_COMMITTEES.forEach((committeeData, index) => {
            const newDocRef = committeesRef.doc();
            addBatch.set(newDocRef, { ...committeeData, order: index });
        });
        await addBatch.commit();
        await fetchCommittees();
        alert("Seeding complete!");
    } catch (error) { console.error("Error seeding data:", error); alert("An error occurred during seeding."); }
    setIsSeeding(false);
  };

  const handleMoveCommittee = (id: string, direction: 'up' | 'down') => {
    if (searchTerm) return;
    const currentIndex = committees.findIndex(c => c.id === id);
    if (currentIndex === -1) return;
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < committees.length) {
      const updatedCommittees = [...committees];
      const [movedCommittee] = updatedCommittees.splice(currentIndex, 1);
      updatedCommittees.splice(newIndex, 0, movedCommittee);
      setCommittees(updatedCommittees);
      setHasOrderChanged(true);
    }
  };

  const handleSaveOrder = async () => {
    if (!db || !db.batch || !window.confirm("Save new committee order?")) return;
    setLoading(true);
    try {
        const batch = db.batch();
        committees.forEach((committee, index) => {
            if (committee.id && !committee.id.startsWith('static-')) {
                batch.update(db.collection('committees').doc(committee.id), { order: index });
            }
        });
        await batch.commit();
        setHasOrderChanged(false);
        initialOrderRef.current = committees.map(c => c.id);
        alert("Order saved successfully!");
    } catch (error) { console.error("Error saving order:", error); alert("Failed to save order."); }
    setLoading(false);
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const openCommitteeModal = (committee: Partial<Committee> | null) => {
    setEditingCommittee(committee || { name: '', icon: 'Users', description: '', members: [] });
    setIsCommitteeModalOpen(true);
  };

  const openMemberModal = (committeeId: string, member?: CommitteeMember) => {
    setEditingMemberInfo({ committeeId, member: member || { name: '', role: '', phone: '' } });
    setIsMemberModalOpen(true);
  };

  const openActivityModal = (committeeId: string, activity?: any) => {
    setEditingActivityInfo({ committeeId, activity: activity || { title: '', description: '', date: '' } });
    setIsActivityModalOpen(true);
  };

  const openReportModal = (committeeId: string, report?: CommitteeReport) => {
    setEditingReportInfo({ committeeId, report: report || null });
    setIsReportModalOpen(true);
  };

  const toggleExpand = (id: string) => {
    setExpandedCommitteeId(prev => prev === id ? null : id);
    // Default to 'members' tab when opening
    setActiveTab(prev => ({ ...prev, [id]: prev[id] || 'members' }));
  };

  const getTab = (id: string) => activeTab[id] || 'members';
  const setTab = (id: string, tab: 'members' | 'activities' | 'images' | 'reports') =>
    setActiveTab(prev => ({ ...prev, [id]: tab }));

  const filteredCommittees = committees.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.members?.some(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
    <div className="py-12 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-serif font-bold text-church-900 mb-4 text-center">{t.departments.title}</h1>
        <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">{t.departments.subtitle}</p>

        <div className="max-w-md mx-auto mb-8 relative">
          <Search size={20} className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400" style={{ top: '50%', transform: 'translateY(-50%)' }} />
          <input type="text" className="w-full pl-10 pr-4 py-3 rounded-full border border-slate-300 focus:ring-2 focus:ring-church-500" placeholder="Search committees or members..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        {isAdmin && !isOfflineMode && (
          <div className="text-center mb-8 flex flex-wrap justify-center gap-4">
            <button onClick={() => openCommitteeModal(null)} className="inline-flex items-center px-6 py-2 bg-church-600 text-white rounded-full hover:bg-church-700 shadow-sm transition">
              <Plus size={18} className="mr-2" /> Add New Committee
            </button>
            <button onClick={handleSaveOrder} disabled={!hasOrderChanged || loading} className="inline-flex items-center px-6 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 shadow-sm transition disabled:opacity-50">
              <Save size={18} className="mr-2" /> Save Order
            </button>
            <button onClick={handleSeedData} disabled={isSeeding} className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-sm transition disabled:opacity-50">
              {isSeeding ? <Loader className="animate-spin w-5 h-5 mr-2" /> : <Database size={18} className="mr-2" />}
              Seed All Committees
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><Loader className="animate-spin text-church-500 w-10 h-10" /></div>
        ) : (
          <>
            {isOfflineMode && (
              <div className="mb-6 p-3 bg-church-50 text-church-700 text-xs rounded text-center flex items-center justify-center">
                <AlertTriangle size={14} className="mr-2" />
                Public View Mode. Admin controls are disabled.
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCommittees.map((c, index) => {
                const Icon = ICON_MAP[c.icon] || Users;
                const isExpanded = expandedCommitteeId === c.id;
                const colorClass = ICON_COLORS[c.icon] || 'from-church-600 to-church-800 text-white border-church-400';
                const currentTab = getTab(c.id);

                return (
                  <div key={c.id} className={`bg-white rounded-xl border transition-all duration-300 overflow-hidden ${isExpanded ? 'shadow-lg ring-1 ring-church-200 border-church-300' : 'shadow-sm border-slate-200 hover:shadow-md'}`}>

                    {/* ── Committee header ── */}
                    <div onClick={() => toggleExpand(c.id)} className="p-6 flex items-center justify-between cursor-pointer bg-white relative">
                      <div className="flex items-center">
                        <div className="perspective-1000 mr-5">
                          <div className={`relative w-14 h-14 rounded-full bg-gradient-to-br border-2 token-3d animate-rotate-y-slow preserve-3d flex items-center justify-center overflow-hidden ${colorClass}`}>
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shine pointer-events-none z-10"></div>
                            <div className="relative z-20 backface-hidden" style={{ transform: 'translateZ(20px)' }}>
                              <Icon size={26} className="drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]" strokeWidth={2.5} />
                            </div>
                            <div className="absolute inset-0.5 rounded-full border border-white/20 z-0"></div>
                          </div>
                        </div>
                        <div>
                          <h3 className={`text-base font-bold transition-colors ${isExpanded ? 'text-church-900' : 'text-slate-800'}`}>{c.name}</h3>
                          {c.description && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{c.description}</p>}
                        </div>
                      </div>
                      <div className="text-slate-400">{isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>
                      {isAdmin && !isOfflineMode && (
                        <div className="absolute top-2 right-2 flex space-x-1" onClick={(e) => e.stopPropagation()}>
                          {!searchTerm && (
                            <>
                              <button onClick={() => handleMoveCommittee(c.id, 'up')} disabled={index === 0} className="p-1.5 text-slate-500 bg-slate-50 rounded-full hover:bg-slate-100 disabled:opacity-30" title="Move Up"><ArrowUp size={14} /></button>
                              <button onClick={() => handleMoveCommittee(c.id, 'down')} disabled={index === filteredCommittees.length - 1} className="p-1.5 text-slate-500 bg-slate-50 rounded-full hover:bg-slate-100 disabled:opacity-30" title="Move Down"><ArrowDown size={14} /></button>
                            </>
                          )}
                          <button onClick={() => openCommitteeModal(c)} className="p-1.5 text-church-600 bg-church-50 rounded-full hover:bg-church-100"><Edit size={14} /></button>
                          <button onClick={() => handleDeleteCommittee(c.id)} className="p-1.5 text-red-500 bg-red-50 rounded-full hover:bg-red-100"><Trash size={14} /></button>
                        </div>
                      )}
                    </div>

                    {/* ── Expanded panel ── */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/70 animate-in slide-in-from-top-2 duration-200">

                        {/* Description */}
                        {c.description && (
                          <div className="px-6 pt-5 pb-3 border-b border-slate-100">
                            <p className="text-sm text-slate-700">{c.description}</p>
                          </div>
                        )}

                        {/* ── Tab bar ── */}
                        <div className="flex border-b border-slate-200 px-4 pt-3 gap-1 overflow-x-auto">
                          {(
                            [
                              { key: 'members', label: 'Committee Members' },
                              { key: 'activities', label: 'Activities' },
                              { key: 'images', label: 'Images' },
                              { key: 'reports', label: '📊 Reports' },
                            ] as const
                          ).map(({ key, label }) => (
                            <button
                              key={key}
                              onClick={(e) => { e.stopPropagation(); setTab(c.id, key); }}
                              className={`whitespace-nowrap px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                                currentTab === key
                                  ? 'border-church-600 text-church-700'
                                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>

                        {/* ── Tab content ── */}
                        <div className="p-6">

                          {/* Members tab */}
                          {currentTab === 'members' && (
                            <div>
                              <div className="flex justify-between items-center mb-3">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Members</h4>
                                {isAdmin && !isOfflineMode && (
                                  <button onClick={() => openMemberModal(c.id)} className="text-xs font-semibold text-church-600 bg-church-100 px-2 py-1 rounded-md hover:bg-church-200">+ Add</button>
                                )}
                              </div>
                              {!c.members || c.members.length === 0 ? (
                                <p className="text-sm text-slate-500 italic">No members listed.</p>
                              ) : (
                                <ul className="space-y-3">
                                  {c.members.map((member) => (
                                    <li key={member.id} className="group flex flex-col sm:flex-row sm:justify-between sm:items-baseline text-sm">
                                      <span className="font-semibold text-slate-800">{member.name}</span>
                                      <div className="flex items-baseline">
                                        <span className="text-slate-500 text-xs sm:text-sm mr-2">{member.role}</span>
                                        {isAdmin && !isOfflineMode && (
                                          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition">
                                            <button onClick={() => openMemberModal(c.id, member)} className="p-1 text-church-600 hover:bg-church-50 rounded"><Edit size={14} /></button>
                                            <button onClick={() => handleDeleteMember(c.id, member.id!)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash size={14} /></button>
                                          </div>
                                        )}
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}

                          {/* Activities tab */}
                          {currentTab === 'activities' && (
                            <div>
                              <div className="flex justify-between items-center mb-3">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Activities</h4>
                                {isAdmin && !isOfflineMode && (
                                  <button onClick={() => openActivityModal(c.id)} className="text-xs font-semibold text-church-600 bg-church-100 px-2 py-1 rounded-md hover:bg-church-200">+ Add</button>
                                )}
                              </div>
                              {!(c as any).activities || (c as any).activities.length === 0 ? (
                                <p className="text-sm text-slate-500 italic">No activities listed.</p>
                              ) : (
                                <ul className="space-y-4">
                                  {(c as any).activities.map((activity: any) => (
                                    <li key={activity.id} className="group flex flex-col sm:flex-row sm:justify-between sm:items-start text-sm bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                      <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                          <span className="font-semibold text-slate-800">{activity.title}</span>
                                          {activity.date && <span className="text-xs text-slate-500">{activity.date}</span>}
                                        </div>
                                        <p className="text-slate-600 mt-1 text-sm">{activity.description}</p>
                                      </div>
                                      {isAdmin && !isOfflineMode && (
                                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition ml-4 mt-2 sm:mt-0">
                                          <button onClick={() => openActivityModal(c.id, activity)} className="p-1 text-church-600 hover:bg-church-50 rounded"><Edit size={14} /></button>
                                          <button onClick={() => handleDeleteActivity(c.id, activity.id!)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash size={14} /></button>
                                        </div>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}

                          {/* Images tab */}
                          {currentTab === 'images' && (
                            <ImagesPanel 
                              committee={c as any}
                              isAdmin={isAdmin}
                              isOfflineMode={isOfflineMode}
                              galleryFolders={galleryFolders}
                              galleryItems={galleryItems}
                              onAdd={(id) => { setSelectedCommitteeForImage(id); setIsImageModalOpen(true); }}
                              onDelete={handleDeleteImage}
                            />
                          )}

                          {/* Reports tab */}
                          {currentTab === 'reports' && (
                            <ReportsPanel
                              committee={c as any}
                              isAdmin={isAdmin}
                              isOfflineMode={isOfflineMode}
                              onAdd={(committeeId) => openReportModal(committeeId)}
                              onEdit={(committeeId, report) => openReportModal(committeeId, report)}
                              onDelete={handleDeleteReport}
                            />
                          )}

                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {filteredCommittees.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <p>No committees found matching "{searchTerm}"</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>

    {/* ── Committee Modal ── */}
    {isCommitteeModalOpen && (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
          <form onSubmit={handleSaveCommittee}>
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4">{editingCommittee?.id ? 'Edit Committee' : 'New Committee'}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Committee Name</label>
                  <input required className="w-full border border-slate-300 rounded p-2" value={editingCommittee?.name || ''} onChange={e => setEditingCommittee({...editingCommittee, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">{t.common.description}</label>
                  <textarea className="w-full border border-slate-300 rounded p-2 h-24" value={editingCommittee?.description || ''} onChange={e => setEditingCommittee({...editingCommittee, description: e.target.value})} placeholder="Brief description..."></textarea>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Icon</label>
                  <select required className="w-full border border-slate-300 rounded p-2" value={editingCommittee?.icon} onChange={e => setEditingCommittee({...editingCommittee, icon: e.target.value})}>
                    {Object.keys(ICON_MAP).map(iconName => <option key={iconName} value={iconName}>{iconName}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 flex justify-end space-x-2 rounded-b-xl">
              <button type="button" onClick={() => setIsCommitteeModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button type="submit" disabled={loading} className="px-4 py-2 bg-church-600 text-white rounded flex items-center">{loading ? <Loader className="animate-spin w-4 h-4 mr-2" /> : <Save size={16} className="mr-2" />} Save</button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* ── Member Modal ── */}
    {isMemberModalOpen && (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
          <form onSubmit={handleSaveMember}>
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4">{editingMemberInfo?.member?.id ? 'Edit Member' : 'Add Member'}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                  <input required className="w-full border border-slate-300 rounded p-2" value={editingMemberInfo?.member?.name || ''} onChange={e => setEditingMemberInfo({...editingMemberInfo, member: { ...editingMemberInfo?.member, name: e.target.value }})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Role</label>
                  <input required className="w-full border border-slate-300 rounded p-2" value={editingMemberInfo?.member?.role || ''} onChange={e => setEditingMemberInfo({...editingMemberInfo, member: { ...editingMemberInfo?.member, role: e.target.value }})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Phone (Optional)</label>
                  <input className="w-full border border-slate-300 rounded p-2" value={editingMemberInfo?.member?.phone || ''} onChange={e => setEditingMemberInfo({...editingMemberInfo, member: { ...editingMemberInfo?.member, phone: e.target.value }})} />
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 flex justify-end space-x-2 rounded-b-xl">
              <button type="button" onClick={() => setIsMemberModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button type="submit" disabled={loading} className="px-4 py-2 bg-church-600 text-white rounded flex items-center">{loading ? <Loader className="animate-spin w-4 h-4 mr-2" /> : <Save size={16} className="mr-2" />} Save</button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* ── Activity Modal ── */}
    {isActivityModalOpen && (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
          <form onSubmit={handleSaveActivity}>
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4">{editingActivityInfo?.activity?.id ? 'Edit Activity' : 'Add Activity'}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Title</label>
                  <input required className="w-full border border-slate-300 rounded p-2" value={editingActivityInfo?.activity?.title || ''} onChange={e => setEditingActivityInfo({...editingActivityInfo, activity: { ...editingActivityInfo?.activity, title: e.target.value }})} placeholder="e.g., Annual Retreat" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Date (Optional)</label>
                  <input type="text" className="w-full border border-slate-300 rounded p-2" value={editingActivityInfo?.activity?.date || ''} onChange={e => setEditingActivityInfo({...editingActivityInfo, activity: { ...editingActivityInfo?.activity, date: e.target.value }})} placeholder="e.g., October 15, 2026" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                  <textarea required className="w-full border border-slate-300 rounded p-2 h-24" value={editingActivityInfo?.activity?.description || ''} onChange={e => setEditingActivityInfo({...editingActivityInfo, activity: { ...editingActivityInfo?.activity, description: e.target.value }})} placeholder="Details about the activity..."></textarea>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 flex justify-end space-x-2 rounded-b-xl">
              <button type="button" onClick={() => setIsActivityModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button type="submit" disabled={loading} className="px-4 py-2 bg-church-600 text-white rounded flex items-center">{loading ? <Loader className="animate-spin w-4 h-4 mr-2" /> : <Save size={16} className="mr-2" />} Save</button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* ── Report Modal ── */}
    {isReportModalOpen && (
      <ReportModal
        committeeId={editingReportInfo.committeeId}
        editingReport={editingReportInfo.report}
        onSave={handleSaveReport}
        onClose={() => { setIsReportModalOpen(false); setEditingReportInfo({ committeeId: '' }); }}
        loading={loading}
      />
    )}

    {/* ── Image Modal ── */}
    {isImageModalOpen && selectedCommitteeForImage && (
      <ImageModal 
        committeeId={selectedCommitteeForImage}
        onSave={handleSaveImage}
        onClose={() => { setIsImageModalOpen(false); setSelectedCommitteeForImage(null); }}
        loading={loading}
      />
    )}
    </>
  );
};

export default Departments;
