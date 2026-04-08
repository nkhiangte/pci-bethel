import React, { useState, useEffect, useCallback } from 'react';
import { 
  Phone, MessageCircle, Plus, Edit, Trash2, X, Loader, UserSquare, Camera, User
} from 'lucide-react';
import { db, storage } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { KTPHruaitute, KTPGroup, KTPMember, CommitteeImage } from '../../types';

const MemberEditModal: React.FC<{
  member: Partial<KTPMember> | null;
  onSave: (memberData: KTPMember, file: File | null) => void;
  onClose: () => void;
  isLoading: boolean;
}> = ({ member, onSave, onClose, isLoading }) => {
  const [memberData, setMemberData] = useState<Partial<KTPMember>>({ name: '', role: '', phone: '', imageUrl: '' });
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    if (member) {
      setMemberData(member);
      setPreviewUrl(member.imageUrl || '');
    }
  }, [member]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Edit Member</h3>
          <button onClick={onClose}><X size={20}/></button>
        </div>
        
        <div className="space-y-4">
          <div className="flex flex-col items-center mb-4">
            <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-slate-200 overflow-hidden flex items-center justify-center relative group">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <User size={40} className="text-slate-300" />
              )}
              <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                <Camera size={24} className="text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
            <p className="text-xs text-slate-500 mt-2">Click to change photo</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Name</label>
            <input 
              className="w-full border p-2 rounded-lg" 
              value={memberData.name || ''}
              onChange={e => setMemberData({ ...memberData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Role</label>
            <input 
              className="w-full border p-2 rounded-lg" 
              value={memberData.role || ''}
              onChange={e => setMemberData({ ...memberData, role: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Phone</label>
            <input 
              className="w-full border p-2 rounded-lg" 
              value={memberData.phone || ''}
              onChange={e => setMemberData({ ...memberData, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Image URL</label>
            <input 
              className="w-full border p-2 rounded-lg text-xs text-slate-500" 
              placeholder="https://..."
              value={memberData.imageUrl || ''}
              onChange={e => {
                setMemberData({ ...memberData, imageUrl: e.target.value });
                setPreviewUrl(e.target.value);
              }}
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-slate-50">Cancel</button>
          <button 
            onClick={() => onSave(memberData as KTPMember, file)} 
            disabled={isLoading}
            className="px-6 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 font-bold disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

const GroupEditModal: React.FC<{
  group: Partial<KTPGroup> | null;
  onSave: (groupData: KTPGroup) => void;
  onClose: () => void;
  isLoading: boolean;
}> = ({ group, onSave, onClose, isLoading }) => {
  const [groupData, setGroupData] = useState<Partial<KTPGroup>>({ id: '', groupName: '', members: [] });
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

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

  const handleMemberImageUpload = async (index: number, file: File) => {
    setUploadingIndex(index);
    try {
      const storageRef = storage.ref(`ktp_members/${Date.now()}_${file.name}`);
      await storageRef.put(file);
      const url = await storageRef.getDownloadURL();
      handleMemberChange(index, 'imageUrl', url);
    } catch (e) {
      console.error("Error uploading member image:", e);
      alert("Failed to upload image.");
    }
    setUploadingIndex(null);
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
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
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
                <button onClick={() => removeMember(i)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"><X size={12}/></button>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full bg-white border border-slate-200 overflow-hidden flex items-center justify-center relative group/img">
                      {member.imageUrl ? (
                        <img src={member.imageUrl} alt="Member" className="w-full h-full object-cover" />
                      ) : (
                        <User size={24} className="text-slate-300" />
                      )}
                      <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 cursor-pointer transition-opacity">
                        <Camera size={16} className="text-white" />
                        <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleMemberImageUpload(i, e.target.files[0])} />
                      </label>
                      {uploadingIndex === i && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                          <Loader size={16} className="animate-spin text-church-600" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-grow">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500">Name</label>
                      <input 
                        placeholder="Name" 
                        className="w-full border p-2 rounded text-sm" 
                        value={member.name} 
                        onChange={e => handleMemberChange(i, 'name', e.target.value)} 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500">Role</label>
                      <input 
                        placeholder="Role" 
                        className="w-full border p-2 rounded text-sm" 
                        value={member.role} 
                        onChange={e => handleMemberChange(i, 'role', e.target.value)} 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-500">Phone</label>
                      <input 
                        placeholder="Phone" 
                        className="w-full border p-2 rounded text-sm" 
                        value={member.phone} 
                        onChange={e => handleMemberChange(i, 'phone', e.target.value)} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-6 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-slate-50">Cancel</button>
          <button 
            onClick={handleSave} 
            disabled={isLoading || uploadingIndex !== null}
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<CommitteeImage | null>(null);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<KTPMember | null>(null);
  const [editingMemberType, setEditingMemberType] = useState<'leaders' | 'committeeMembers' | 'exOfficioMembers' | null>(null);

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

  const handleSaveImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !data || !editingImage) return;
    setIsSaving(true);
    try {
      let imageUrl = editingImage.url;
      if (imageFile) {
        const storageRef = storage.ref(`ktp_leaders_images/${Date.now()}`);
        await storageRef.put(imageFile);
        imageUrl = await storageRef.getDownloadURL();
      }

      let currentImages = data.leadersImages || [];
      const imageData = { ...editingImage, url: imageUrl, uploadedAt: new Date().toISOString() };

      if (editingImage.id) {
        currentImages = currentImages.map((img: any) => img.id === editingImage.id ? imageData : img);
      } else {
        currentImages.push({ ...imageData, id: Date.now().toString() });
      }
      
      await db.collection('ktpLeaders').doc('2026').update({ leadersImages: currentImages });
      fetchData();
      setIsImageModalOpen(false);
      setEditingImage(null);
      setImageFile(null);
    } catch (error) { console.error("Error saving image:", error); alert("Failed to save image."); }
    setIsSaving(false);
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!db || !data || !window.confirm("Are you sure you want to delete this image?")) return;
    try {
      const currentImages = (data.leadersImages || []).filter((img: any) => img.id !== imageId);
      await db.collection('ktpLeaders').doc('2026').update({ leadersImages: currentImages });
      fetchData();
    } catch (error) { console.error("Error deleting image:", error); alert("Failed to delete image."); }
  };

  const handleEditMember = (member: KTPMember, type: 'leaders' | 'committeeMembers' | 'exOfficioMembers') => {
    setEditingMember(member);
    setEditingMemberType(type);
    setIsMemberModalOpen(true);
  };

  const handleSaveMember = async (memberData: KTPMember, file: File | null) => {
    if (!data || !editingMemberType) return;
    setIsSaving(true);
    try {
      let imageUrl = memberData.imageUrl || '';
      if (file) {
        const storageRef = storage.ref(`ktp_members/${Date.now()}_${file.name}`);
        await storageRef.put(file);
        imageUrl = await storageRef.getDownloadURL();
      }

      const updatedMember = { ...memberData, imageUrl };
      const currentList = [...(data[editingMemberType] || [])];
      
      // Ensure all members have IDs for reliable matching
      const index = currentList.findIndex(m => m.id === memberData.id || (m.name === memberData.name && m.role === memberData.role));
      
      if (index !== -1) {
        currentList[index] = { ...updatedMember, id: currentList[index].id || `mem_${Date.now()}` };
      } else {
        currentList.push({ ...updatedMember, id: `mem_${Date.now()}` });
      }

      await db.collection('ktpLeaders').doc('2026').update({ [editingMemberType]: currentList });
      setIsMemberModalOpen(false);
      fetchData();
    } catch (e) { 
      console.error("Error saving member:", e);
      alert("Failed to save member."); 
    }
    setIsSaving(false);
  };

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

  const handleDownloadExcel = () => {
    if (!data) return;
    
    const excelData: any[][] = [['Category', 'Name', 'Role', 'Phone']];
    
    // Add Leaders
    data.leaders?.forEach(m => excelData.push(['Office Bearer', m.name, m.role || '', m.phone || '']));
    // Add Committee
    data.committeeMembers?.forEach(m => excelData.push(['Committee Member', m.name, m.role || '', m.phone || '']));
    // Add Ex-Officio
    data.exOfficioMembers?.forEach(m => excelData.push(['Ex-Officio', m.name, m.role || '', m.phone || '']));
    // Add Groups
    data.groupLeaders?.forEach(group => {
      group.members?.forEach(m => excelData.push([group.groupName, m.name, m.role || '', m.phone || '']));
    });

    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "KTP Leaders List");
    XLSX.writeFile(workbook, "KTP_Leaders_List_2026.xlsx");
  };

  if (data === undefined) return <div className="p-12 text-center"><Loader className="animate-spin mx-auto text-church-500" /></div>;
  if (!data) return <div className="p-8 bg-white rounded-xl shadow-sm text-center">No data available.</div>;

  const MemberList = ({ title, members, type }: { title: string, members: KTPMember[], type: 'leaders' | 'committeeMembers' | 'exOfficioMembers' }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-8">
      <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2">
        <UserSquare size={20} className="text-church-600" />
        {title}
      </h3>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member, i) => (
          <li key={i} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-church-200 transition-colors group relative">
            <div className="w-12 h-12 rounded-full bg-slate-200 border border-slate-300 overflow-hidden shrink-0 flex items-center justify-center">
              {member.imageUrl ? (
                <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover" />
              ) : (
                <User size={24} className="text-slate-400" />
              )}
            </div>
            <div className="flex-grow min-w-0">
              <p className="font-semibold text-slate-800 truncate">{member.name}</p>
              <p className="text-slate-500 text-xs truncate">{member.role}</p>
              {member.phone && (
                <div className="flex items-center gap-1 mt-1">
                   <Phone size={10} className="text-slate-400" />
                   <span className="text-[10px] text-slate-500 font-mono">{member.phone}</span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              {isAdmin && (
                <button 
                  onClick={() => handleEditMember(member, type)}
                  className="p-1.5 bg-white text-church-600 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Edit Member"
                >
                  <Edit size={12} />
                </button>
              )}
              {member.phone && (
                <div className="flex gap-1">
                  <a href={`tel:${member.phone.replace(/\s+/g, '')}`} className="p-1.5 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition" title={`Call ${member.name}`}>
                    <Phone size={12} />
                  </a>
                  <a href={`https://wa.me/91${member.phone.replace(/\s+/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-teal-50 text-teal-600 rounded-full hover:bg-teal-100 transition" title={`WhatsApp ${member.name}`}>
                    <MessageCircle size={12} />
                  </a>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Leaders Images Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h3 className="text-lg font-bold text-slate-800">Hruaitute Photo</h3>
          <div className="flex gap-2">
            <button 
              onClick={handleDownloadExcel}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-100 border border-emerald-100"
              title="Download Excel List"
            >
              <Download size={14} /> Excel
            </button>
            {isAdmin && (
              <button 
                onClick={() => { setEditingImage({ id: '', url: '', uploadedAt: '' }); setIsImageModalOpen(true); setImageFile(null); }}
                className="flex items-center gap-2 px-3 py-1.5 bg-church-600 text-white text-xs font-bold rounded-lg hover:bg-church-700"
              >
                <Plus size={14} /> Add Photo
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {(data.leadersImages || []).map((img) => (
            <div key={img.id} className="relative group border rounded-xl overflow-hidden aspect-square">
              <img src={img.url} alt="Leader" className="w-full h-full object-cover cursor-pointer" onClick={() => setEnlargedImage(img.url)} />
              {isAdmin && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleDeleteImage(img.id)} className="p-1.5 bg-red-500 text-white rounded-lg"><Trash2 size={12} /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {data.leaders && <MemberList title="Office Bearers" members={data.leaders} type="leaders" />}
      {data.committeeMembers && <MemberList title="Committee Members" members={data.committeeMembers} type="committeeMembers" />}
      {data.exOfficioMembers && <MemberList title="Ex-Officio Members" members={data.exOfficioMembers} type="exOfficioMembers" />}
      
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
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                                            {member.imageUrl ? (
                                                <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={14} className="text-slate-400" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-700">{member.name}</p>
                                            <p className="text-slate-500 text-xs">{member.role}</p>
                                        </div>
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

      {isMemberModalOpen && (
        <MemberEditModal 
          member={editingMember}
          onClose={() => setIsMemberModalOpen(false)}
          onSave={handleSaveMember}
          isLoading={isSaving}
        />
      )}

      {/* Image Modal */}
      {isImageModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Add Photo</h3>
            <form onSubmit={handleSaveImage} className="space-y-4">
              <input className="w-full border rounded-xl p-3" placeholder="Image URL" value={editingImage?.url || ''} onChange={e => setEditingImage({...editingImage!, url: e.target.value})} />
              <div className="flex items-center gap-2">
                <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} />
                <Camera size={20} className="text-slate-400" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => { setIsImageModalOpen(false); setImageFile(null); }} className="px-4 py-2 text-slate-600">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-6 py-2 bg-church-600 text-white rounded-xl">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enlarged Image Modal */}
      {enlargedImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setEnlargedImage(null)}>
          <img src={enlargedImage} alt="Enlarged" className="max-w-full max-h-full object-contain" />
          <button onClick={() => setEnlargedImage(null)} className="absolute top-4 right-4 text-white"><X size={32} /></button>
        </div>
      )}
    </div>
  );
};

export default KtpLeaders;
