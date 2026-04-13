import React, { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { 
  Book, Users, DollarSign, List, History, 
  Camera, Video, UserSquare, Loader, Edit, Save, X, LucideIcon
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { getConstants } from '../constants';
import { db, storage } from '../services/firebase';

interface NavLinkConfig {
  id: string;
  path: string;
  label: string;
  icon: LucideIcon;
}

interface MinistryLayoutProps {
  ministryId: string;
  navLinks: NavLinkConfig[];
}

const MinistryLayout: React.FC<MinistryLayoutProps> = ({ ministryId, navLinks }) => {
  const { language } = useLanguage();
  const { isAdmin } = useAuth();
  const [fellowship, setFellowship] = useState<Ministry | null>(null);

  useEffect(() => {
    const fetchMinistry = async () => {
      if (!db) {
        setFellowship(getConstants(language).ministries.find(m => m.id === ministryId) || null);
        return;
      }
      try {
        const docSnap = await db.collection('ministries').doc(ministryId).get();
        if (docSnap.exists) {
          setFellowship({ ...docSnap.data(), id: docSnap.id } as Ministry);
        } else {
          setFellowship(getConstants(language).ministries.find(m => m.id === ministryId) || null);
        }
      } catch (err) {
        console.error(`Error fetching ${ministryId}:`, err);
        setFellowship(getConstants(language).ministries.find(m => m.id === ministryId) || null);
      }
    };
    fetchMinistry();
  }, [ministryId, language]);

  // ── Edit state ──────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });

  const currentImage = customImage || fellowship?.image;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setLogoFile(file);
    if (file) setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSaveLogo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !logoFile) return;
    setIsSaving(true);
    try {
      const storageRef = storage.ref(`ministry_logos/${ministryId}_${Date.now()}`);
      await storageRef.put(logoFile);
      const imageUrl: string = await storageRef.getDownloadURL();

      await db.collection('ministries').doc(ministryId).set({ image: imageUrl }, { merge: true });
      
      // Update local state to ensure the new image persists
      setFellowship({ ...fellowship!, image: imageUrl });
      setCustomImage(imageUrl);
      setIsEditing(false);
      setLogoFile(null);
      setPreviewUrl(null);
    } catch (err) {
      console.error(`Error saving ${ministryId} logo:`, err);
    }
    setIsSaving(false);
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setIsSaving(true);
    try {
      await db.collection('ministries').doc(ministryId).set(editForm, { merge: true });
      setFellowship({ ...fellowship!, ...editForm });
      setIsEditingInfo(false);
    } catch (err) {
      console.error(`Error saving ${ministryId} info:`, err);
    }
    setIsSaving(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsEditingInfo(false);
    setLogoFile(null);
    setPreviewUrl(null);
  };

  if (!fellowship) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader className="animate-spin text-church-500" />
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen pb-12">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="bg-church-900 text-white border-b border-church-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-6">

            {/* Logo — editable by admin */}
            <div className="relative group w-24 h-24 shrink-0">
              <div className="w-24 h-24 bg-white p-2 rounded-full shadow-xl">
                <img
                  src={currentImage || ''}
                  alt={fellowship.name}
                  className="w-full h-full object-contain rounded-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${fellowship.acronym || 'Logo'}&background=0f172a&color=fff&size=256`;
                  }}
                />
              </div>
              {isAdmin && (
                <button
                  onClick={() => setIsEditing(true)}
                  title="Edit logo"
                  className="absolute inset-0 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <Edit size={20} />
                </button>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-serif font-bold text-white">{fellowship.name}</h1>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setEditForm({ name: fellowship.name, description: fellowship.description });
                      setIsEditingInfo(true);
                    }}
                    className="p-1.5 hover:bg-white/20 rounded-lg text-white/70 hover:text-white transition"
                  >
                    <Edit size={18} />
                  </button>
                )}
              </div>
              <p className="text-church-200 mt-2 max-w-2xl whitespace-pre-line">{fellowship.description}</p>
            </div>
          </div>
        </div>

        {/* ── Nav tabs ───────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto no-scrollbar">
            {navLinks.map(link => (
              <NavLink
                key={link.id}
                to={link.path}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 border-b-2 text-sm font-bold whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-yellow-400 text-yellow-300'
                      : 'border-transparent text-church-300 hover:text-white hover:border-church-700'
                  }`
                }
              >
                <link.icon size={16} className="mr-2" />
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>

      {/* ── Page content ───────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </div>

      {/* ── Edit Logo Modal ────────────────────────────────── */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
            <form onSubmit={handleSaveLogo}>
              {/* Modal header */}
              <div className="p-5 border-b flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800">Edit {fellowship.acronym} Logo</h3>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={22} />
                </button>
              </div>

              {/* Modal body */}
              <div className="p-6 space-y-4">
                {/* Preview */}
                <div className="flex justify-center">
                  <div className="w-28 h-28 bg-white border-2 border-slate-200 p-1.5 rounded-full shadow overflow-hidden">
                    <img
                      src={previewUrl ?? currentImage ?? ''}
                      alt="Preview"
                      className="w-full h-full object-contain rounded-full"
                    />
                  </div>
                </div>

                {/* File picker */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Choose new logo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full text-sm text-slate-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-church-50 file:text-church-700
                      hover:file:bg-church-100"
                  />
                </div>
              </div>

              {/* Modal footer */}
              <div className="p-5 border-t bg-slate-50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-white font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !logoFile}
                  className="px-4 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 font-medium flex items-center shadow-md transition disabled:opacity-50"
                >
                  {isSaving
                    ? <Loader className="animate-spin w-4 h-4 mr-2" />
                    : <Save size={16} className="mr-2" />}
                  Save Logo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Info Modal ────────────────────────────────── */}
      {isEditingInfo && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <form onSubmit={handleSaveInfo}>
              <div className="p-5 border-b flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800">Edit {fellowship.name} Info</h3>
                <button type="button" onClick={handleCancel} className="text-slate-400 hover:text-slate-600">
                  <X size={22} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Name</label>
                  <input
                    required
                    value={editForm.name}
                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                    className="w-full border rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                  <textarea
                    required
                    value={editForm.description}
                    onChange={e => setEditForm({...editForm, description: e.target.value})}
                    className="w-full border rounded-lg p-2.5 h-32"
                  />
                </div>
              </div>
              <div className="p-5 border-t bg-slate-50 flex justify-end gap-3">
                <button type="button" onClick={handleCancel} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-white font-medium transition">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 font-medium flex items-center shadow-md transition disabled:opacity-50">
                  {isSaving ? <Loader className="animate-spin w-4 h-4 mr-2" /> : <Save size={16} className="mr-2" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MinistryLayout;
