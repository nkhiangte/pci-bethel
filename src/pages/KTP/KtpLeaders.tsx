import React, { useState, useEffect, useCallback } from 'react';
import { 
  Phone, MessageCircle, Plus, Edit, Trash2, X, Loader, UserSquare 
} from 'lucide-react';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { KTPHruaitute, KTPGroup, KTPMember } from '../../types';

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
              placeholder="e.g. Group 1"
            />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
                <label className="block text-sm font-bold text-slate-700">Members</label>
                <button onClick={addMember} className="text-xs bg-church-100 text-church-700 px-2 py-1 rounded font-bold hover:bg-church-200">+ Add Member</button>
            </div>
            {groupData.members?.map((member, i) => (
              <div key={member.id} className="p-3 border rounded-lg bg-slate-50 relative group">
                <button onClick={() => removeMember(i)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input 
                    placeholder="Name" 
                    className="border p-2 rounded text-sm" 
                    value={member.name} 
                    onChange={e => handleMemberChange(i, 'name', e.target.value)} 
                  />
                  <input 
                    placeholder="Role" 
                    className="border p-2 rounded text-sm" 
                    value={member.role} 
                    onChange={e => handleMemberChange(i, 'role', e.target.value)} 
                  />
                  <input 
                    placeholder="Phone" 
                    className="border p-2 rounded text-sm" 
                    value={member.phone} 
                    onChange={e => handleMemberChange(i, 'phone', e.target.value)} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-6 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-slate-50">Cancel</button>
          <button 
            onClick={handleSave} 
            disabled={isLoading}
            className="px-6 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 font-bold disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Group'}
          </button>
        </div>
      </div>
    </div>
  );
};

const KtpLeaders: React.FC = () => {
  const { isAdmin } = useAuth();
  const [data, setData] = useState<KTPHruaitute | null | undefined>(undefined);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Partial<KTPGroup> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!db?.collection) return;
    try {
      const leadersDoc = await db.collection('ktpLeaders').doc('2026').get();
      if (leadersDoc.exists) setData(leadersDoc.data() as KTPHruaitute);
    } catch (e) { console.error("Error fetching KTP data:", e); }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEditGroup = (group: KTPGroup) => {
    setEditingGroup(group);
    setIsGroupModalOpen(true);
  };

  const handleAddNewGroup = () => {
    setEditingGroup({ id: '', groupName: '', members: [] });
    setIsGroupModalOpen(true);
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!window.confirm("Are you sure you want to delete this group?") || !data) return;
    try {
      const updatedGroups = (data.groupLeaders || []).filter(g => g.id !== groupId);
      await db.collection('ktpLeaders').doc('2026').update({ groupLeaders: updatedGroups });
      fetchData();
    } catch (e) { alert("Failed to delete group."); }
  };

  const handleSaveGroup = async (groupData: KTPGroup) => {
    if (!data) return;
    setIsSaving(true);
    try {
      let updatedGroups = [...(data.groupLeaders || [])];
      if (groupData.id) {
        updatedGroups = updatedGroups.map(g => g.id === groupData.id ? groupData : g);
      } else {
        updatedGroups.push({ ...groupData, id: `group_${Date.now()}` });
      }
      await db.collection('ktpLeaders').doc('2026').update({ groupLeaders: updatedGroups });
      setIsGroupModalOpen(false);
      fetchData();
    } catch (e) { alert("Failed to save group."); }
    setIsSaving(false);
  };

  if (data === undefined) return <div className="p-12 text-center"><Loader className="animate-spin mx-auto text-church-500" /></div>;
  if (!data) return <div className="p-8 bg-white rounded-xl shadow-sm text-center">No data available.</div>;

  const MemberList = ({ title, members }: { title: string, members: KTPMember[] }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-8">
      <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2">
        <UserSquare size={20} className="text-church-600" />
        {title}
      </h3>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member, i) => (
          <li key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-church-200 transition-colors">
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

export default KtpLeaders;
