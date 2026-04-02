import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, Plus, Edit, Trash2, Loader, 
  UserSquare, X, Save, AlertCircle 
} from 'lucide-react';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { KTPYearlyReport } from '../../types';

const StatField: React.FC<{
  label: string;
  value: string | number;
  onChange: (val: string) => void;
  type?: 'text' | 'number' | 'select';
  options?: string[];
  placeholder?: string;
}> = ({ label, value, onChange, type = 'number', options, placeholder }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
    {type === 'select' ? (
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-church-500 outline-none bg-white"
      >
        {options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    ) : (
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-church-500 outline-none"
      />
    )}
  </div>
);

const YearlyReportModal: React.FC<{
  report: Partial<KTPYearlyReport> | null;
  onClose: () => void;
  onSave: (data: KTPYearlyReport) => void;
  isLoading: boolean;
}> = ({ report, onClose, onSave, isLoading }) => {
  const [formData, setFormData] = useState<Partial<KTPYearlyReport>>({
    year: new Date().getFullYear(),
    officeBearers: [
      { role: 'Leader', name: '' },
      { role: 'Asst. Leader', name: '' },
      { role: 'Secretary', name: '' },
      { role: 'Asst. Secretary', name: '' },
      { role: 'Treasurer', name: '' },
      { role: 'Finance Secretary', name: '' }
    ],
    statistics: {
      mipa: 0, hmeichhia: 0, total: 0,
      branchComtMemberZat: 0, branchComtNeihTawhZat: 0,
      kristianThalaiCopy: 0, missionaryChawmZat: 0,
      groupZat: 4, groupBudget: 0, groupIntihsiakna: '',
      subComtZat: 6,
      inhlawhHnatlangNeihZat: 0, hlaZirZat: 0, hlaRemZat: 0,
      branchProject: '', missionaryChawmna: '',
      openingBalance: 0, income: 0, expenditure: 0, totalBalance: 0,
      inkhawmPercentage: '', inkhawmNeihZat: 0, inkhawmPercent: '', inkhawmAverage: 0,
      fellowshipNeihZat: 0, fellowshipPercent: '', fellowshipAverage: 0,
      sumTuakDanTlangpui: '', missionaryChhuakTharZat: 0, evangelismCell: 'No',
      bialChhungBranchIntlawhtawn: '', bialPawnAtangTlawhtu: '', bialPawnahRawngbawlna: '',
      memberThi: 0, memberInnei: 0,
      reportTuldang: ''
    }
  });

  useEffect(() => {
    if (report) setFormData(report);
  }, [report]);

  const updateStat = (key: keyof KTPYearlyReport['statistics'], value: any) => {
    setFormData(prev => {
      const newStats = { ...prev.statistics!, [key]: value };
      if (['mipa', 'hmeichhia'].includes(key)) {
        newStats.total = Number(newStats.mipa || 0) + Number(newStats.hmeichhia || 0);
      }
      if (['openingBalance', 'income', 'expenditure'].includes(key)) {
        newStats.totalBalance = (Number(newStats.openingBalance || 0) + Number(newStats.income || 0)) - Number(newStats.expenditure || 0);
      }
      return { ...prev, statistics: newStats };
    });
  };

  const updateOB = (index: number, name: string) => {
    const newOB = [...(formData.officeBearers || [])];
    newOB[index] = { ...newOB[index], name };
    setFormData({ ...formData, officeBearers: newOB });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in duration-300">
        <div className="px-8 py-5 border-b bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-church-600 p-2 rounded-lg text-white"><FileText size={20}/></div>
            <h3 className="text-xl font-bold text-slate-800">{report?.id ? 'Edit' : 'New'} Yearly Report</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10">
          {/* Year Selection */}
          <div className="max-w-xs">
            <StatField label="Report Year" value={formData.year!} onChange={v => setFormData({...formData, year: parseInt(v)})} />
          </div>

          {/* Office Bearers */}
          <section>
            <h4 className="text-sm font-black text-church-700 uppercase tracking-widest mb-4 flex items-center gap-2">
              <UserSquare size={16} /> Office Bearers
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {formData.officeBearers?.map((ob, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">{ob.role}</label>
                  <input 
                    className="w-full bg-transparent border-b border-slate-200 focus:border-church-500 outline-none py-1 font-bold text-slate-700"
                    value={ob.name}
                    onChange={e => updateOB(i, e.target.value)}
                    placeholder="Enter name"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Statistics Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Member Inchhiarna */}
            <section className="space-y-4">
              <h4 className="text-sm font-black text-church-700 uppercase tracking-widest border-b pb-2">Member Inchhiarna</h4>
              <div className="grid grid-cols-2 gap-4">
                <StatField label="Mipa" value={formData.statistics!.mipa} onChange={v => updateStat('mipa', parseInt(v))} />
                <StatField label="Hmeichhia" value={formData.statistics!.hmeichhia} onChange={v => updateStat('hmeichhia', parseInt(v))} />
                <div className="col-span-2 p-3 bg-church-50 rounded-lg flex justify-between items-center">
                  <span className="text-xs font-bold text-church-700 uppercase">Total Members</span>
                  <span className="text-lg font-black text-church-900">{formData.statistics!.total}</span>
                </div>
                <StatField label="Branch Comt Member zat" value={formData.statistics!.branchComtMemberZat} onChange={v => updateStat('branchComtMemberZat', parseInt(v))} />
                <StatField label="Branch Comt neih tawh zat" value={formData.statistics!.branchComtNeihTawhZat} onChange={v => updateStat('branchComtNeihTawhZat', parseInt(v))} />
                <StatField label="Kristian thalai copy" value={formData.statistics!.kristianThalaiCopy} onChange={v => updateStat('kristianThalaiCopy', parseInt(v))} />
                <StatField label="Missionary Chawmzat" value={formData.statistics!.missionaryChawmZat} onChange={v => updateStat('missionaryChawmZat', parseInt(v))} />
                <StatField label="Group zat" value={formData.statistics!.groupZat} onChange={v => updateStat('groupZat', parseInt(v))} />
                <StatField label="Group Budget" value={formData.statistics!.groupBudget} onChange={v => updateStat('groupBudget', parseInt(v))} />
                <div className="col-span-2">
                  <StatField label="Group intihsiakna" type="text" value={formData.statistics!.groupIntihsiakna} onChange={v => updateStat('groupIntihsiakna', v)} />
                </div>
                <StatField label="Sub-Comt. zat" value={formData.statistics!.subComtZat} onChange={v => updateStat('subComtZat', parseInt(v))} />
              </div>
            </section>

            {/* Rawngbawlna */}
            <section className="space-y-4">
              <h4 className="text-sm font-black text-church-700 uppercase tracking-widest border-b pb-2">Rawngbawlna</h4>
              <div className="grid grid-cols-1 gap-4">
                <StatField label="Inhlawh hnatlang neih zat" value={formData.statistics!.inhlawhHnatlangNeihZat} onChange={v => updateStat('inhlawhHnatlangNeihZat', parseInt(v))} />
                <StatField label="Hla zir zat" value={formData.statistics!.hlaZirZat} onChange={v => updateStat('hlaZirZat', parseInt(v))} />
                <StatField label="Hla rem zat" value={formData.statistics!.hlaRemZat} onChange={v => updateStat('hlaRemZat', parseInt(v))} />
                <StatField label="Branch Project" type="text" value={formData.statistics!.branchProject} onChange={v => updateStat('branchProject', v)} />
                <StatField label="Missionary chawmna" type="text" value={formData.statistics!.missionaryChawmna} onChange={v => updateStat('missionaryChawmna', v)} />
              </div>
            </section>

            {/* Finance */}
            <section className="space-y-4">
              <h4 className="text-sm font-black text-church-700 uppercase tracking-widest border-b pb-2">Finance</h4>
              <div className="grid grid-cols-2 gap-4">
                <StatField label="Opening Balance" value={formData.statistics!.openingBalance} onChange={v => updateStat('openingBalance', parseInt(v))} />
                <StatField label="Income" value={formData.statistics!.income} onChange={v => updateStat('income', parseInt(v))} />
                <StatField label="Expenditure" value={formData.statistics!.expenditure} onChange={v => updateStat('expenditure', parseInt(v))} />
                <div className="p-3 bg-slate-900 rounded-lg flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total Balance</span>
                  <span className="text-lg font-black text-white">₹{formData.statistics!.totalBalance}</span>
                </div>
              </div>
            </section>

            {/* INKHAWM */}
            <section className="space-y-4">
              <h4 className="text-sm font-black text-church-700 uppercase tracking-widest border-b pb-2">INKHAWM</h4>
              <div className="grid grid-cols-2 gap-4">
                <StatField label="Inkhawm Percentage" type="text" value={formData.statistics!.inkhawmPercentage} onChange={v => updateStat('inkhawmPercentage', v)} />
                <StatField label="Inkhawm neih zat" value={formData.statistics!.inkhawmNeihZat} onChange={v => updateStat('inkhawmNeihZat', parseInt(v))} />
                <StatField label="Inkhawm %" type="text" value={formData.statistics!.inkhawmPercent} onChange={v => updateStat('inkhawmPercent', v)} />
                <StatField label="Average" value={formData.statistics!.inkhawmAverage} onChange={v => updateStat('inkhawmAverage', parseInt(v))} />
                <StatField label="Fellowship Neih zat" value={formData.statistics!.fellowshipNeihZat} onChange={v => updateStat('fellowshipNeihZat', parseInt(v))} />
                <StatField label="Fellowship %" type="text" value={formData.statistics!.fellowshipPercent} onChange={v => updateStat('fellowshipPercent', v)} />
                <StatField label="Average" value={formData.statistics!.fellowshipAverage} onChange={v => updateStat('fellowshipAverage', parseInt(v))} />
              </div>
            </section>
          </div>

          {/* Report Tuldang */}
          <section className="space-y-4">
            <h4 className="text-sm font-black text-church-700 uppercase tracking-widest border-b pb-2">Report Tuldang</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatField label="Sum tuak dan tlangpui" type="text" value={formData.statistics!.sumTuakDanTlangpui} onChange={v => updateStat('sumTuakDanTlangpui', v)} />
              <StatField label="Missionary-a chhuak thar zat" value={formData.statistics!.missionaryChhuakTharZat} onChange={v => updateStat('missionaryChhuakTharZat', parseInt(v))} />
              <StatField label="Evangelism Cell" type="select" options={['Yes', 'No']} value={formData.statistics!.evangelismCell} onChange={v => updateStat('evangelismCell', v)} />
              <StatField label="Bial chhung Branch intlawhtawn" type="text" value={formData.statistics!.bialChhungBranchIntlawhtawn} onChange={v => updateStat('bialChhungBranchIntlawhtawn', v)} />
              <StatField label="Bial pawn atang tlawhtu" type="text" value={formData.statistics!.bialPawnAtangTlawhtu} onChange={v => updateStat('bialPawnAtangTlawhtu', v)} />
              <StatField label="Bial pawnah rawngbawlna" type="text" value={formData.statistics!.bialPawnahRawngbawlna} onChange={v => updateStat('bialPawnahRawngbawlna', v)} />
              <StatField label="Member thi" value={formData.statistics!.memberThi} onChange={v => updateStat('memberThi', parseInt(v))} />
              <StatField label="Member Innei" value={formData.statistics!.memberInnei} onChange={v => updateStat('memberInnei', parseInt(v))} />
            </div>
            <div className="flex flex-col gap-1 mt-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Additional Remarks</label>
              <textarea 
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-church-500 outline-none min-h-[120px]"
                value={formData.statistics!.reportTuldang}
                onChange={e => updateStat('reportTuldang', e.target.value)}
                placeholder="Enter any other important reports or achievements..."
              />
            </div>
          </section>
        </div>

        <div className="px-8 py-5 border-t bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-white transition-colors">Cancel</button>
          <button 
            onClick={() => onSave(formData as KTPYearlyReport)} 
            disabled={isLoading}
            className="px-8 py-2 bg-church-600 text-white rounded-xl font-bold hover:bg-church-700 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <Loader className="animate-spin" size={18}/> : <Save size={18}/>}
            {isLoading ? 'Saving...' : 'Save Report'}
          </button>
        </div>
      </div>
    </div>
  );
};

const YearlyReports: React.FC = () => {
  const { isAdmin } = useAuth();
  const [reports, setReports] = useState<KTPYearlyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<KTPYearlyReport | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<Partial<KTPYearlyReport> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    if (!db?.collection) { setLoading(false); return; }
    try {
      const snapshot = await db.collection('ktpYearlyReports').get();
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KTPYearlyReport));
      data.sort((a, b) => b.year - a.year);
      setReports(data);
      if (data.length > 0 && !selectedReport) setSelectedReport(data[0]);
    } catch (e) { console.error("Error fetching yearly reports:", e); }
    setLoading(false);
  }, [selectedReport]);

  useEffect(() => { fetchReports(); }, []);

  const handleSaveReport = async (data: KTPYearlyReport) => {
    setIsSaving(true);
    try {
      const { id, ...saveData } = data;
      if (id) {
        await db.collection('ktpYearlyReports').doc(id).set(saveData, { merge: true });
      } else {
        await db.collection('ktpYearlyReports').add({ ...saveData, createdAt: new Date().toISOString() });
      }
      setIsModalOpen(false);
      fetchReports();
    } catch (e) { alert("Failed to save report."); }
    setIsSaving(false);
  };

  const handleDeleteReport = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;
    try {
      await db.collection('ktpYearlyReports').doc(id).delete();
      if (selectedReport?.id === id) setSelectedReport(null);
      fetchReports();
    } catch (e) { alert("Failed to delete report."); }
  };

  if (loading) return <div className="p-12 text-center"><Loader className="animate-spin mx-auto text-church-500" /></div>;

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar: Report Years */}
        <div className="w-full lg:w-64 shrink-0 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Yearly Reports</h3>
            {isAdmin && (
              <button 
                onClick={() => { setEditingReport(null); setIsModalOpen(true); }}
                className="p-1.5 bg-church-600 text-white rounded-lg hover:bg-church-700 shadow-sm"
              >
                <Plus size={14}/>
              </button>
            )}
          </div>
          
          {reports.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed">
              <p className="text-slate-400 text-sm italic">No reports yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2">
              {reports.map(report => (
                <div 
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                    selectedReport?.id === report.id 
                      ? 'bg-church-600 border-church-600 text-white shadow-lg shadow-church-200 translate-x-1' 
                      : 'bg-white border-slate-100 text-slate-600 hover:border-church-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FileText size={16} className={selectedReport?.id === report.id ? 'text-yellow-300' : 'text-church-500'} />
                    <span className="font-bold">{report.year}</span>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditingReport(report); setIsModalOpen(true); }}
                        className={`p-1 rounded ${selectedReport?.id === report.id ? 'hover:bg-church-500 text-white' : 'hover:bg-blue-50 text-blue-600'}`}
                      >
                        <Edit size={12}/>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteReport(report.id); }}
                        className={`p-1 rounded ${selectedReport?.id === report.id ? 'hover:bg-church-500 text-white' : 'hover:bg-red-50 text-red-600'}`}
                      >
                        <Trash2 size={12}/>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main Content: Report Details */}
        <div className="flex-1 min-w-0">
          {!selectedReport ? (
            <div className="h-96 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-100 shadow-sm text-slate-400">
              <FileText size={48} className="mb-4 opacity-20" />
              <p className="font-bold">Select a report year to view details</p>
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
              {/* Header */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-church-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-church-100">
                    <FileText size={32} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-serif font-black text-slate-900">Yearly Report {selectedReport.year}</h2>
                    <p className="text-slate-400 font-medium">Bethel Branch KTP • Detailed Statistics</p>
                  </div>
                </div>
                <div className="flex gap-3">
                   {/* Add export button here if needed */}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Member Inchhiarna */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Member Inchhiarna</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Mipa</span><span className="font-bold">{selectedReport.statistics.mipa}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Hmeichhia</span><span className="font-bold">{selectedReport.statistics.hmeichhia}</span></div>
                    <div className="flex justify-between text-sm pt-2 border-t font-black"><span className="text-church-700">Total Members</span><span className="text-church-900">{selectedReport.statistics.total}</span></div>
                    <div className="flex justify-between text-sm pt-2"><span className="text-slate-500">Branch Comt Member zat</span><span className="font-bold">{selectedReport.statistics.branchComtMemberZat}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Branch Comt neih tawh zat</span><span className="font-bold">{selectedReport.statistics.branchComtNeihTawhZat}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Kristian thalai copy</span><span className="font-bold">{selectedReport.statistics.kristianThalaiCopy}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Missionary Chawmzat</span><span className="font-bold">{selectedReport.statistics.missionaryChawmZat}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Group zat</span><span className="font-bold">{selectedReport.statistics.groupZat}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Group Budget</span><span className="font-bold">₹{selectedReport.statistics.groupBudget}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Group intihsiakna</span><span className="font-bold">{selectedReport.statistics.groupIntihsiakna}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Sub-Comt. zat</span><span className="font-bold">{selectedReport.statistics.subComtZat}</span></div>
                  </div>
                </div>

                {/* Rawngbawlna */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Rawngbawlna</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Inhlawh hnatlang neih zat</span><span className="font-bold">{selectedReport.statistics.inhlawhHnatlangNeihZat}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Hla zir zat</span><span className="font-bold">{selectedReport.statistics.hlaZirZat}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Hla rem zat</span><span className="font-bold">{selectedReport.statistics.hlaRemZat}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Branch Project</span><span className="font-bold">{selectedReport.statistics.branchProject}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Missionary chawmna</span><span className="font-bold">{selectedReport.statistics.missionaryChawmna}</span></div>
                  </div>
                </div>

                {/* Finance */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Finance</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Opening Balance</span><span className="font-bold text-slate-600">₹{selectedReport.statistics.openingBalance}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Income</span><span className="font-bold text-green-600">₹{selectedReport.statistics.income}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Expenditure</span><span className="font-bold text-red-600">₹{selectedReport.statistics.expenditure}</span></div>
                    <div className="flex justify-between text-sm border-t pt-2"><span className="font-bold">Total Balance</span><span className="font-black text-church-700">₹{selectedReport.statistics.totalBalance}</span></div>
                  </div>
                </div>

                {/* INKHAWM */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">INKHAWM</h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Inkhawm neih zat</span><span className="font-bold">{selectedReport.statistics.inkhawmNeihZat}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Inkhawm %</span><span className="font-bold">{selectedReport.statistics.inkhawmPercent}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Average</span><span className="font-bold">{selectedReport.statistics.inkhawmAverage}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Fellowship Neih zat</span><span className="font-bold">{selectedReport.statistics.fellowshipNeihZat}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Fellowship %</span><span className="font-bold">{selectedReport.statistics.fellowshipPercent}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Average</span><span className="font-bold">{selectedReport.statistics.fellowshipAverage}</span></div>
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

                {/* Report Tuldang */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Report Tuldang</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    <div className="flex flex-col"><span className="text-xs font-bold text-slate-400 uppercase">Sum tuak dan tlangpui</span><span className="font-bold">{selectedReport.statistics.sumTuakDanTlangpui}</span></div>
                    <div className="flex flex-col"><span className="text-xs font-bold text-slate-400 uppercase">Missionary-a chhuak thar zat</span><span className="font-bold">{selectedReport.statistics.missionaryChhuakTharZat}</span></div>
                    <div className="flex flex-col"><span className="text-xs font-bold text-slate-400 uppercase">Evangelism Cell</span><span className="font-bold">{selectedReport.statistics.evangelismCell}</span></div>
                    <div className="flex flex-col"><span className="text-xs font-bold text-slate-400 uppercase">Bial chhung Branch intlawhtawn</span><span className="font-bold">{selectedReport.statistics.bialChhungBranchIntlawhtawn}</span></div>
                    <div className="flex flex-col"><span className="text-xs font-bold text-slate-400 uppercase">Bial pawn atang tlawhtu</span><span className="font-bold">{selectedReport.statistics.bialPawnAtangTlawhtu}</span></div>
                    <div className="flex flex-col"><span className="text-xs font-bold text-slate-400 uppercase">Bial pawnah rawngbawlna</span><span className="font-bold">{selectedReport.statistics.bialPawnahRawngbawlna}</span></div>
                    <div className="flex flex-col"><span className="text-xs font-bold text-slate-400 uppercase">Member thi</span><span className="font-bold">{selectedReport.statistics.memberThi}</span></div>
                    <div className="flex flex-col"><span className="text-xs font-bold text-slate-400 uppercase">Member Innei</span><span className="font-bold">{selectedReport.statistics.memberInnei}</span></div>
                  </div>
                  {selectedReport.statistics.reportTuldang && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">
                        {selectedReport.statistics.reportTuldang}
                      </p>
                    </div>
                  )}
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

export default YearlyReports;
