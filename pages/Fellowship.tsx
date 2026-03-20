import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { Ministry, KTPHruaitute, KTPBudget, KTPMember, KTPGroup, KTPSubCommittee, BudgetItem } from '../types';
import { getConstants } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Clock, Users, Calendar, Loader, Home, Book, List, History, Camera, Video, UserSquare, 
  Edit, Save, X, Trash2, Plus, DollarSign, Table as TableIcon,
  Download, FileUp, FileDown, TrendingUp, Phone, MessageCircle, AlertTriangle,
  BarChart2
} from 'lucide-react';
import * as XLSX from 'xlsx';

// ─── FINANCE REPORT TYPES ────────────────────────────────────────────────────

interface FinanceLineItem {
  id: string;
  head: string;
  amount: number;
}

interface FinanceReport {
  id?: string;
  fellowshipId: string;
  year: number;
  month: number; // 1–12
  income: FinanceLineItem[];
  expenditure: FinanceLineItem[];
  updatedAt?: any;
}

// ─── FINANCE REPORT COMPONENT ────────────────────────────────────────────────

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => currentYear - i);

/** Editable row for a line item */
const LineItemRow: React.FC<{
  item: FinanceLineItem;
  index: number;
  onChange: (index: number, field: 'head' | 'amount', value: string) => void;
  onRemove: (index: number) => void;
}> = ({ item, index, onChange, onRemove }) => (
  <tr className="border-b border-slate-100">
    <td className="px-3 py-2 text-center text-slate-500 text-sm w-12">{index + 1}</td>
    <td className="px-3 py-2">
      <input
        className="w-full border border-slate-200 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-church-400 outline-none"
        placeholder="Describe the item"
        value={item.head}
        onChange={e => onChange(index, 'head', e.target.value)}
      />
    </td>
    <td className="px-3 py-2 w-40">
      <input
        type="number"
        className="w-full border border-slate-200 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-church-400 outline-none text-right"
        placeholder="0"
        value={item.amount || ''}
        onChange={e => onChange(index, 'amount', e.target.value)}
      />
    </td>
    <td className="px-3 py-2 w-10 text-center">
      <button onClick={() => onRemove(index)} className="text-red-400 hover:text-red-600">
        <Trash2 size={14} />
      </button>
    </td>
  </tr>
);

/** Read-only row for public view */
const ReadOnlyRow: React.FC<{ item: FinanceLineItem; index: number }> = ({ item, index }) => (
  <tr className="border-b border-slate-100 hover:bg-slate-50">
    <td className="px-4 py-2 text-center text-slate-500 text-sm">{index + 1}</td>
    <td className="px-4 py-2 text-slate-700 text-sm">{item.head}</td>
    <td className="px-4 py-2 text-right font-mono text-sm font-medium text-slate-800">
      ₹ {Number(item.amount).toLocaleString('en-IN')}
    </td>
  </tr>
);

/** Table (income or expenditure) used in edit mode */
const EditableTable: React.FC<{
  title: string;
  color: 'green' | 'red';
  items: FinanceLineItem[];
  onAdd: () => void;
  onChange: (index: number, field: 'head' | 'amount', value: string) => void;
  onRemove: (index: number) => void;
}> = ({ title, color, items, onAdd, onChange, onRemove }) => {
  const total = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const colorClass = color === 'green'
    ? { head: 'text-green-700', total: 'text-green-800 bg-green-50', btn: 'text-green-600 hover:bg-green-50' }
    : { head: 'text-red-700', total: 'text-red-800 bg-red-50', btn: 'text-red-600 hover:bg-red-50' };

  return (
    <div>
      <h4 className={`font-bold text-base mb-2 ${colorClass.head}`}>{title}</h4>
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="px-3 py-2 text-center w-12">Sl.No</th>
              <th className="px-3 py-2">Head</th>
              <th className="px-3 py-2 text-right w-40">Amount (₹)</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <LineItemRow key={item.id} item={item} index={i} onChange={onChange} onRemove={onRemove} />
            ))}
            {items.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-4 text-center text-slate-400 italic text-sm">No items yet.</td></tr>
            )}
          </tbody>
          <tfoot>
            <tr className={`${colorClass.total} font-bold`}>
              <td colSpan={2} className="px-4 py-2 text-right text-sm">Grand Total</td>
              <td className="px-3 py-2 text-right font-mono text-sm">₹ {total.toLocaleString('en-IN')}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
      <button
        onClick={onAdd}
        className={`mt-2 flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded border ${colorClass.btn} border-current`}
      >
        <Plus size={12} /> Add Row
      </button>
    </div>
  );
};

/** Read-only table used in public view */
const ReadOnlyTable: React.FC<{
  title: string;
  color: 'green' | 'red';
  items: FinanceLineItem[];
}> = ({ title, color, items }) => {
  const total = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const colorClass = color === 'green'
    ? { head: 'text-green-700 bg-green-50', total: 'text-green-800 bg-green-50 border-green-200' }
    : { head: 'text-red-700 bg-red-50', total: 'text-red-800 bg-red-50 border-red-200' };

  return (
    <div>
      <div className={`px-4 py-2 rounded-t-lg font-bold text-sm ${colorClass.head}`}>{title}</div>
      <div className="border border-slate-200 rounded-b-lg overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-2 text-center w-14">Sl.No</th>
              <th className="px-4 py-2">Head</th>
              <th className="px-4 py-2 text-right w-36">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <ReadOnlyRow key={item.id} item={item} index={i} />
            ))}
            {items.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400 italic text-sm">No entries recorded.</td></tr>
            )}
          </tbody>
          <tfoot>
            <tr className={`font-bold border-t-2 ${colorClass.total}`}>
              <td colSpan={2} className="px-4 py-2 text-right text-sm">Grand Total</td>
              <td className="px-4 py-2 text-right font-mono text-sm">₹ {total.toLocaleString('en-IN')}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

const newLineItem = (): FinanceLineItem => ({ id: `li_${Date.now()}_${Math.random()}`, head: '', amount: 0 });

/** Main Finance Report component — handles both admin edit and public view */
const FinanceReportSection: React.FC<{ fellowshipId: string; isAdmin: boolean }> = ({ fellowshipId, isAdmin }) => {
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-based

  const [report, setReport] = useState<FinanceReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [draftIncome, setDraftIncome] = useState<FinanceLineItem[]>([]);
  const [draftExpenditure, setDraftExpenditure] = useState<FinanceLineItem[]>([]);

  const docId = `${fellowshipId}_${selectedYear}_${String(selectedMonth).padStart(2, '0')}`;

  const fetchReport = useCallback(async () => {
    if (!db?.collection) return;
    setLoading(true);
    try {
      const snap = await db.collection('financeReports').doc(docId).get();
      if (snap.exists) {
        setReport({ id: snap.id, ...snap.data() } as FinanceReport);
      } else {
        setReport(null);
      }
    } catch (e) {
      console.error('Finance report fetch error', e);
      setReport(null);
    }
    setLoading(false);
  }, [docId]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const startEditing = () => {
    setDraftIncome(report ? report.income.map(i => ({ ...i })) : [newLineItem()]);
    setDraftExpenditure(report ? report.expenditure.map(i => ({ ...i })) : [newLineItem()]);
    setIsEditing(true);
  };

  const cancelEditing = () => setIsEditing(false);

  const handleSave = async () => {
    if (!db?.collection) return;
    setSaving(true);
    try {
      const payload: FinanceReport = {
        fellowshipId,
        year: selectedYear,
        month: selectedMonth,
        income: draftIncome.filter(i => i.head.trim()),
        expenditure: draftExpenditure.filter(i => i.head.trim()),
        updatedAt: new Date(),
      };
      await db.collection('financeReports').doc(docId).set(payload, { merge: true });
      setIsEditing(false);
      fetchReport();
    } catch (e) {
      console.error(e);
      alert('Failed to save finance report.');
    }
    setSaving(false);
  };

  // Helpers for draft tables
  const makeIncomeChanger = (i: number, field: 'head' | 'amount', val: string) => {
    setDraftIncome(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: field === 'amount' ? parseFloat(val) || 0 : val } : item));
  };
  const makeExpenditureChanger = (i: number, field: 'head' | 'amount', val: string) => {
    setDraftExpenditure(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: field === 'amount' ? parseFloat(val) || 0 : val } : item));
  };

  const totalIncome = (report?.income || []).reduce((s, i) => s + Number(i.amount), 0);
  const totalExpenditure = (report?.expenditure || []).reduce((s, i) => s + Number(i.amount), 0);
  const balance = totalIncome - totalExpenditure;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header + Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <BarChart2 size={20} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Finance Report</h2>
              <p className="text-sm text-slate-500">Monthly income & expenditure statement</p>
            </div>
          </div>
          {/* Year & Month Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 bg-white focus:ring-2 focus:ring-indigo-400 outline-none"
            >
              {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 bg-white focus:ring-2 focus:ring-indigo-400 outline-none"
            >
              {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
            {isAdmin && !isEditing && (
              <button
                onClick={startEditing}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition"
              >
                <Edit size={15} /> {report ? 'Edit Report' : 'Create Report'}
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center bg-white rounded-xl shadow-sm"><Loader className="animate-spin mx-auto text-indigo-500" /></div>
      ) : isEditing ? (
        /* ── EDIT MODE ── */
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800">
              Editing: {MONTHS[selectedMonth - 1]} {selectedYear}
            </h3>
            <div className="flex gap-2">
              <button onClick={cancelEditing} className="px-4 py-2 border rounded-lg text-sm hover:bg-slate-50 flex items-center gap-1"><X size={14}/> Cancel</button>
              <button
                onClick={handleSave}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2"
              >
                {saving ? <Loader className="animate-spin" size={14}/> : <Save size={14}/>} Save Report
              </button>
            </div>
          </div>

          <EditableTable
            title="Income"
            color="green"
            items={draftIncome}
            onAdd={() => setDraftIncome(prev => [...prev, newLineItem()])}
            onChange={(i, f, v) => makeIncomeChanger(i, f, v)}
            onRemove={i => setDraftIncome(prev => prev.filter((_, idx) => idx !== i))}
          />
          <EditableTable
            title="Expenditure"
            color="red"
            items={draftExpenditure}
            onAdd={() => setDraftExpenditure(prev => [...prev, newLineItem()])}
            onChange={(i, f, v) => makeExpenditureChanger(i, f, v)}
            onRemove={i => setDraftExpenditure(prev => prev.filter((_, idx) => idx !== i))}
          />
        </div>
      ) : report ? (
        /* ── PUBLIC VIEW ── */
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-6">
          <h3 className="font-bold text-slate-800 text-lg border-b pb-3">
            {MONTHS[selectedMonth - 1]} {selectedYear} — Finance Statement
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            <ReadOnlyTable title="Income" color="green" items={report.income} />
            <ReadOnlyTable title="Expenditure" color="red" items={report.expenditure} />
          </div>

          {/* Balance Summary */}
          <div className="pt-4 border-t border-slate-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-xs text-green-600 font-bold uppercase tracking-wider mb-1">Total Income</p>
                <p className="text-lg font-mono font-black text-green-800">₹ {totalIncome.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-xs text-red-600 font-bold uppercase tracking-wider mb-1">Total Expenditure</p>
                <p className="text-lg font-mono font-black text-red-800">₹ {totalExpenditure.toLocaleString('en-IN')}</p>
              </div>
              <div className={`rounded-lg p-4 ${balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>Balance</p>
                <p className={`text-lg font-mono font-black ${balance >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
                  ₹ {Math.abs(balance).toLocaleString('en-IN')}
                  <span className="text-xs ml-1">{balance < 0 ? '(deficit)' : ''}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── NO REPORT ── */
        <div className="bg-white rounded-xl shadow-sm border border-dashed border-slate-300 p-12 text-center">
          <BarChart2 size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">No finance report for {MONTHS[selectedMonth - 1]} {selectedYear}.</p>
          {isAdmin && (
            <button onClick={startEditing} className="mt-4 px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700">
              + Create Report
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ─── KTP SPECIFIC COMPONENTS (unchanged) ─────────────────────────────────────

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
                                            <a href={`tel:${member.phone.replace(/\s+/g, '')}`} className="p-1.5 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition"><Phone size={12} /></a>
                                            <a href={`https://wa.me/91${member.phone.replace(/\s+/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-teal-50 text-teal-600 rounded-full hover:bg-teal-100 transition"><MessageCircle size={12} /></a>
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
                    <a href={`tel:${member.phone.replace(/\s+/g, '')}`} className="p-1.5 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition"><Phone size={12} /></a>
                    <a href={`https://wa.me/91${member.phone.replace(/\s+/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-teal-50 text-teal-600 rounded-full hover:bg-teal-100 transition"><MessageCircle size={12} /></a>
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

// ─── GENERIC STATS TABLE ──────────────────────────────────────────────────────

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
    } catch (e) { console.error(`Error fetching ${collectionName}:`, e); }
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
    } catch (e) { alert("Failed to save record."); }
  };

  const handleDelete = async (id: string) => {
    if (!db || !window.confirm("Are you sure?")) return;
    try { await db.collection(collectionName).doc(id).delete(); fetchData(); } catch (e) { console.error(e); }
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
                docData.percentage = ((parseFloat(docData.donors) / parseFloat(docData.totalFamilies)) * 100).toFixed(2);
            } else if (collectionName === 'kpvmNitinInkhawm' && docData.performers && docData.totalHouses) {
                docData.percentage = ((parseFloat(docData.performers) / parseFloat(docData.totalHouses)) * 100).toFixed(2);
            }
            batch.set(ref.doc(), docData);
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
          p.percentage = ((parseFloat(p.donors) / parseFloat(p.totalFamilies)) * 100).toFixed(2);
      } else if (collectionName === 'kpvmNitinInkhawm' && p.performers && p.totalHouses) {
          p.percentage = ((parseFloat(p.performers) / parseFloat(p.totalHouses)) * 100).toFixed(2);
      }
      setEditingItem({...p});
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <h3 className="text-xl font-bold text-slate-800">{title}</h3>
            <div className="flex gap-2">
                <button onClick={handleExport} className="p-2 text-green-600 hover:bg-green-50 rounded-lg border border-green-200" title="Export Excel"><FileDown size={18} /></button>
                {isAdmin && (
                    <>
                        <button onClick={handleTemplate} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200" title="Download Template"><Download size={18} /></button>
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

// ─── MAIN FELLOWSHIP COMPONENT ────────────────────────────────────────────────

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
    { id: 'finance-report', label: 'Finance Report', icon: BarChart2 },
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
    { id: 'finance-report', label: 'Finance Report', icon: BarChart2 },
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

  // ── KPVM ──
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
                  {kpvmActiveTab === 'finance-report' && (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                          <FinanceReportSection fellowshipId="kpvm" isAdmin={isAdmin} />
                      </div>
                  )}
              </div>
          </div>
      );
  }
  
  // ── KTP ──
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
                 {ktpActiveTab === 'finance-report' && <FinanceReportSection fellowshipId="ktp" isAdmin={isAdmin} />}
                 {ktpActiveTab === 'members' && <div className="p-8 bg-white rounded-xl shadow-sm">Member List content goes here...</div>}
                 {ktpActiveTab === 'history' && <div className="p-8 bg-white rounded-xl shadow-sm">History content goes here...</div>}
                 {ktpActiveTab === 'gallery' && <div className="p-8 bg-white rounded-xl shadow-sm">Gallery content goes here...</div>}
                 {ktpActiveTab === 'productions' && <div className="p-8 bg-white rounded-xl shadow-sm">Productions content goes here...</div>}
                 {ktpActiveTab === 'whoswho' && <div className="p-8 bg-white rounded-xl shadow-sm">Who's Who content goes here...</div>}
              </div>
        </div>
     );
  }

  // ── GENERIC FALLBACK (all other fellowships get Finance Report too) ──
  const [genericTab, setGenericTab] = useState('about');

  const genericNavLinks = [
    { id: 'about', label: 'About', icon: Home },
    { id: 'finance-report', label: 'Finance Report', icon: BarChart2 },
  ];

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

        {/* Tab bar for generic pages */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex space-x-1 overflow-x-auto no-scrollbar">
                    {genericNavLinks.map(link => (
                        <button
                            key={link.id}
                            onClick={() => setGenericTab(link.id)}
                            className={`flex items-center px-5 py-4 border-b-2 text-sm font-bold whitespace-nowrap transition-colors ${
                                genericTab === link.id
                                    ? 'border-church-600 text-church-700'
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
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {genericTab === 'about' && (
                <div className="bg-white p-8 rounded-xl shadow-sm animate-in fade-in duration-300">
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
            )}
            {genericTab === 'finance-report' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <FinanceReportSection fellowshipId={id!} isAdmin={isAdmin} />
                </div>
            )}
        </div>
    </div>
  );
};

export default Fellowship;
