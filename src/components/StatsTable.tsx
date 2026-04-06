import React, { useState, useEffect, useCallback } from 'react';
import { 
  Table as TableIcon, Plus, Edit, Trash2, Loader, 
  Save, X, Download, FileUp, FileDown 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { db } from '../services/firebase';
import { useTranslation } from '../translations';

interface StatsTableProps {
  title: string;
  collectionName: string;
  columns: { key: string; label: string; type: 'text' | 'number' }[];
  isAdmin: boolean;
}

const StatsTable: React.FC<StatsTableProps> = ({ title, collectionName, columns, isAdmin }) => {
  const { t } = useTranslation();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [isAdding, setIsAdding] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    if (!db?.collection) { setLoading(false); return; }
    try {
      const snap = await db.collection(collectionName).get();
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      docs.sort((a, b) => (b.year || 0) - (a.year || 0));
      setData(docs);
    } catch (e) { console.error(`Error fetching ${collectionName}:`, e); }
    setLoading(false);
  }, [collectionName]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async (id?: string) => {
    try {
      if (id) {
        await db.collection(collectionName).doc(id).set(editForm, { merge: true });
        setEditingId(null);
      } else {
        await db.collection(collectionName).add(editForm);
        setIsAdding(false);
      }
      setEditForm({});
      fetchData();
    } catch (e) { alert(t.stats.saveFail); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t.stats.deleteConfirm)) return;
    try {
      await db.collection(collectionName).doc(id).delete();
      fetchData();
    } catch (e) { alert(t.stats.deleteFail); }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Stats");
    XLSX.writeFile(workbook, `${title}.xlsx`);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b flex justify-between items-center bg-slate-50">
        <h3 className="text-lg font-bold text-slate-800 flex items-center">
          <TableIcon size={20} className="mr-2 text-church-600"/> {title}
        </h3>
        <div className="flex gap-2">
          <button onClick={exportToExcel} className="p-2 text-slate-500 hover:bg-slate-200 rounded-lg transition" title={t.stats.export}>
            <Download size={18}/>
          </button>
          {isAdmin && (
            <button 
              onClick={() => { setIsAdding(true); setEditForm({}); }}
              className="px-4 py-2 bg-church-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-church-700 transition"
            >
              <Plus size={16}/> {t.stats.addRecord}
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {columns.map(col => (
                <th key={col.key} className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">{col.label}</th>
              ))}
              {isAdmin && <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-right">{t.stats.actions}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isAdding && (
              <tr className="bg-church-50/30">
                {columns.map(col => (
                  <td key={col.key} className="px-6 py-3">
                    <input 
                      type={col.type}
                      className="w-full border rounded px-2 py-1 text-sm"
                      value={editForm[col.key] || ''}
                      onChange={e => setEditForm({...editForm, [col.key]: col.type === 'number' ? parseFloat(e.target.value) : e.target.value})}
                    />
                  </td>
                ))}
                <td className="px-6 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleSave()} className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700"><Save size={14}/></button>
                    <button onClick={() => setIsAdding(false)} className="p-1.5 bg-slate-400 text-white rounded hover:bg-slate-500"><X size={14}/></button>
                  </div>
                </td>
              </tr>
            )}
            {loading ? (
              <tr><td colSpan={columns.length + 1} className="px-6 py-12 text-center"><Loader className="animate-spin mx-auto text-church-500"/></td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={columns.length + 1} className="px-6 py-12 text-center text-slate-400 italic">{t.stats.noRecords}</td></tr>
            ) : (
              data.map(row => (
                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                  {columns.map(col => (
                    <td key={col.key} className="px-6 py-4 text-sm font-medium text-slate-700">
                      {editingId === row.id ? (
                        <input 
                          type={col.type}
                          className="w-full border rounded px-2 py-1 text-sm"
                          value={editForm[col.key] || ''}
                          onChange={e => setEditForm({...editForm, [col.key]: col.type === 'number' ? parseFloat(e.target.value) : e.target.value})}
                        />
                      ) : row[col.key]}
                    </td>
                  ))}
                  {isAdmin && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {editingId === row.id ? (
                          <>
                            <button onClick={() => handleSave(row.id)} className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700"><Save size={14}/></button>
                            <button onClick={() => setEditingId(null)} className="p-1.5 bg-slate-400 text-white rounded hover:bg-slate-500"><X size={14}/></button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => { setEditingId(row.id); setEditForm(row); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit size={14}/></button>
                            <button onClick={() => handleDelete(row.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StatsTable;
