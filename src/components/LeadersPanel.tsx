import React, { useState, useRef } from 'react';
import { Users, PlusCircle, Edit, Trash, Loader, Camera, Download, Upload, X, Maximize2, Phone, MessageCircle } from 'lucide-react';
import { CommitteeMember, CommitteeImage } from '../types';
import { db, storage } from '../services/firebase';
import * as XLSX from 'xlsx';

interface LeadersPanelProps {
  ministryId: string;
  isAdmin: boolean;
  members: CommitteeMember[];
  leadersImages?: CommitteeImage[];
  onUpdate: () => void;
}

const LeadersPanel: React.FC<LeadersPanelProps> = ({ ministryId, isAdmin, members, leadersImages = [], onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<CommitteeMember | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<CommitteeImage | null>(null);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

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

  const handleSaveImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !ministryId || !editingImage) return;
    setLoading(true);
    try {
      let imageUrl = editingImage.url;
      if (imageFile) {
        const storageRef = storage.ref(`ministry_leaders_images/${ministryId}_${Date.now()}`);
        await storageRef.put(imageFile);
        imageUrl = await storageRef.getDownloadURL();
      }

      const ministryRef = db.collection('ministries').doc(ministryId);
      const doc = await ministryRef.get();
      let currentImages = (doc.data() as any).leadersImages || [];
      
      const imageData = { ...editingImage, url: imageUrl, uploadedAt: new Date().toISOString() };

      if (editingImage.id) {
        currentImages = currentImages.map((img: any) => img.id === editingImage.id ? imageData : img);
      } else {
        currentImages.push({ ...imageData, id: Date.now().toString() });
      }
      
      await ministryRef.update({ leadersImages: currentImages });
      onUpdate();
      setIsImageModalOpen(false);
      setEditingImage(null);
      setImageFile(null);
    } catch (error) { console.error("Error saving image:", error); }
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

  const handleDeleteImage = async (imageId: string) => {
    if (!db || !ministryId || !window.confirm("Are you sure you want to delete this image?")) return;
    try {
      const ministryRef = db.collection('ministries').doc(ministryId);
      const doc = await ministryRef.get();
      const currentImages = ((doc.data() as any).leadersImages || []).filter((img: any) => img.id !== imageId);
      await ministryRef.update({ leadersImages: currentImages });
      onUpdate();
    } catch (error) { console.error("Error deleting image:", error); }
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
    <div className="bg-white p-6 rounded-xl shadow-sm space-y-8">
      {/* Leaders Images Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-slate-800">Hruaitute Photo</h3>
          {isAdmin && (
            <button 
              onClick={() => { setEditingImage({ id: '', url: '', uploadedAt: '' }); setIsImageModalOpen(true); setImageFile(null); }}
              className="flex items-center gap-2 px-4 py-2 bg-church-600 text-white rounded-xl hover:bg-church-700 transition-all font-bold text-sm"
            >
              <PlusCircle size={18} /> Add Photo
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {leadersImages.map((img) => (
            <div key={img.id} className="relative group border rounded-xl overflow-hidden aspect-square">
              <img src={img.url} alt="Leader" className="w-full h-full object-cover cursor-pointer" onClick={() => setEnlargedImage(img.url)} />
              {isAdmin && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleDeleteImage(img.id)} className="p-1.5 bg-red-500 text-white rounded-lg"><Trash size={14} /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Member List Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800">Hruaitute List</h3>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => (
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
                      <a href={`tel:${member.phone}`} className="p-1.5 bg-church-100 text-church-600 rounded-lg hover:bg-church-200 transition-colors" title="Call">
                        <Phone size={14} />
                      </a>
                      <a href={`https://wa.me/91${member.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors" title="WhatsApp">
                        <MessageCircle size={14} />
                      </a>
                    </div>
                  )}
                </div>
                
                {isAdmin && (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingMember(member); setIsMemberModalOpen(true); setImageFile(null); }} className="p-1.5 bg-white text-church-600 shadow-sm border border-slate-200 hover:bg-church-50 rounded-lg"><Edit size={14} /></button>
                    <button onClick={() => handleDeleteMember(member.id!)} className="p-1.5 bg-white text-red-500 shadow-sm border border-slate-200 hover:bg-red-50 rounded-lg"><Trash size={14} /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Member Modal */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">{editingMember?.id ? 'Edit Leader' : 'Add Leader'}</h3>
            <form onSubmit={handleSaveMember} className="space-y-4">
              <div className="flex flex-col items-center mb-4">
                <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative group cursor-pointer">
                  {imageFile ? (
                    <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full h-full object-cover" />
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
                        setImageFile(e.target.files[0]);
                      }
                    }}
                  />
                </div>
                <span className="text-xs text-slate-500 mt-2">Upload Profile Picture</span>
              </div>
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

      {/* Image Modal */}
      {isImageModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Add Photo</h3>
            <form onSubmit={handleSaveImage} className="space-y-4">
              <input className="w-full border rounded-xl p-3" placeholder="Image URL" value={editingImage?.url || ''} onChange={e => setEditingImage({...editingImage!, url: e.target.value})} />
              <div className="flex items-center gap-2">
                <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} />
                <Camera size={20} className="text-slate-400" />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => { setIsImageModalOpen(false); setImageFile(null); }} className="px-4 py-2 text-slate-600">Cancel</button>
                <button type="submit" disabled={loading} className="px-6 py-2 bg-church-600 text-white rounded-xl">Save</button>
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

export default LeadersPanel;
