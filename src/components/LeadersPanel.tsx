import React, { useState, useRef } from 'react';
import { Users, PlusCircle, Edit, Trash, Loader, Camera, Download, Upload } from 'lucide-react';
import { CommitteeMember } from '../types';
import { db, storage } from '../services/firebase';
import * as XLSX from 'xlsx';

interface LeadersPanelProps {
  ministryId: string;
  isAdmin: boolean;
  members: CommitteeMember[];
  onUpdate: () => void;
}

const LeadersPanel: React.FC<LeadersPanelProps> = ({ ministryId, isAdmin, members, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<CommitteeMember | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !ministryId || !editingMember) return;
    setLoading(true);
    try {
      let imageUrl = editingMember.imageUrl;
      if (imageFile) {
        const storageRef = storage.ref(`ministry_leaders/${ministryId}_${Date.now()}`);
        await storageRef.put(imageFile);
        imageUrl = await storageRef.getDownloadURL();
      }

      const ministryRef = db.collection('ministries').doc(ministryId);
      const doc = await ministryRef.get();
      let currentMembers = (doc.data() as any).members || [];
      
      const memberData = { ...editingMember, imageUrl };

      if (editingMember.id) {
        currentMembers = currentMembers.map((m: any) => m.id === editingMember.id ? memberData : m);
      } else {
        currentMembers.push({ ...memberData, id: Date.now().toString() });
      }
      
      await ministryRef.update({ members: currentMembers });
      onUpdate();
      setIsMemberModalOpen(false);
      setImageFile(null);
    } catch (error) { console.error("Error saving member:", error); }
    setLoading(false);
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!db || !ministryId || !window.confirm("Are you sure you want to delete this leader?")) return;
    try {
      const ministryRef = db.collection('ministries').doc(ministryId);
      const doc = await ministryRef.get();
      const currentMembers = ((doc.data() as any).members || []).filter((m: any) => m.id !== memberId);
      await ministryRef.update({ members: currentMembers });
      onUpdate();
    } catch (error) { console.error("Error deleting member:", error); }
  };

  const handleDownloadTemplate = () => {
    const template = [
      { Name: '', Designation: '', Phone: '' }
    ];
    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    XLSX.writeFile(workbook, 'Leaders_Template.xlsx');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !db || !ministryId) return;
    setLoading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      const newMembers = jsonData.map(row => ({
        id: Date.now().toString() + Math.random(),
        name: row.Name || '',
        role: row.Designation || '',
        phone: row.Phone ? String(row.Phone) : ''
      }));

      const ministryRef = db.collection('ministries').doc(ministryId);
      const doc = await ministryRef.get();
      const currentMembers = (doc.data() as any).members || [];
      await ministryRef.update({ members: [...currentMembers, ...newMembers] });
      onUpdate();
    } catch (error) { console.error("Error importing members:", error); }
    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-slate-800">Hruaitute</h3>
        {isAdmin && (
          <div className="flex gap-2">
            <button onClick={handleDownloadTemplate} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-bold text-sm">
              <Download size={18} /> Template
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-bold text-sm">
              <Upload size={18} /> Import
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImport} accept=".xlsx, .xls" className="hidden" />
            <button 
              onClick={() => { setEditingMember({ name: '', role: '', phone: '', imageUrl: '' }); setIsMemberModalOpen(true); setImageFile(null); }}
              className="flex items-center gap-2 px-4 py-2 bg-church-600 text-white rounded-xl hover:bg-church-700 transition-all font-bold text-sm"
            >
              <PlusCircle size={18} /> Add Leader
            </button>
          </div>
        )}
      </div>

      {!members || members.length === 0 ? (
        <p className="text-slate-500 text-center py-8">No leaders added yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-4 font-bold text-slate-700 text-sm">Name</th>
                <th className="p-4 font-bold text-slate-700 text-sm">Designation</th>
                <th className="p-4 font-bold text-slate-700 text-sm">Contact</th>
                {isAdmin && <th className="p-4 font-bold text-slate-700 text-sm text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/50">
                  <td className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                      {member.imageUrl ? (
                        <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-full h-full p-2 text-slate-400" />
                      )}
                    </div>
                    <span className="font-bold text-slate-800">{member.name}</span>
                  </td>
                  <td className="p-4 text-church-600 font-medium text-sm">{member.role}</td>
                  <td className="p-4 text-slate-600 text-sm">
                    {member.phone && (
                      <div className="flex gap-2">
                        <a href={`tel:${member.phone}`} className="text-church-600 hover:text-church-800">
                          {member.phone}
                        </a>
                        <a href={`https://wa.me/${member.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-800">
                          WhatsApp
                        </a>
                      </div>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setEditingMember(member); setIsMemberModalOpen(true); }} className="p-2 text-church-600 hover:bg-church-50 rounded-lg"><Edit size={16} /></button>
                        <button onClick={() => handleDeleteMember(member.id!)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash size={16} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Member Modal */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">{editingMember?.id ? 'Edit Leader' : 'Add Leader'}</h3>
            <form onSubmit={handleSaveMember} className="space-y-4">
              <input required className="w-full border rounded-xl p-3" placeholder="Name" value={editingMember?.name || ''} onChange={e => setEditingMember({...editingMember!, name: e.target.value})} />
              <input required className="w-full border rounded-xl p-3" placeholder="Designation" value={editingMember?.role || ''} onChange={e => setEditingMember({...editingMember!, role: e.target.value})} />
              <input className="w-full border rounded-xl p-3" placeholder="Phone" value={editingMember?.phone || ''} onChange={e => setEditingMember({...editingMember!, phone: e.target.value})} />
              <input className="w-full border rounded-xl p-3" placeholder="Image URL" value={editingMember?.imageUrl || ''} onChange={e => setEditingMember({...editingMember!, imageUrl: e.target.value})} />
              <div className="flex items-center gap-2">
                <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} />
                <Camera size={20} className="text-slate-400" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => { setIsMemberModalOpen(false); setImageFile(null); }} className="px-4 py-2 text-slate-600">Cancel</button>
                <button type="submit" disabled={loading} className="px-6 py-2 bg-church-600 text-white rounded-xl">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadersPanel;
