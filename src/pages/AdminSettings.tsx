
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { Shield, Save, Loader, Upload, Trash2, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { db, storage } from '../services/firebase';

const AdminSettings: React.FC = () => {
  const { t } = useLanguage();
  const { isAdmin, currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!db || !db.collection) {
        setLoading(false);
        return;
      }
      try {
        const doc = await db.collection('settings').doc('church').get();
        if (doc.exists) {
          setLogoUrl(doc.data().logoUrl || '');
        }
      } catch (e) {
        console.error("Error fetching settings:", e);
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  if (!currentUser) return <Navigate to="/login" />;
  if (!isAdmin) return <Navigate to="/" />;

  const handleSave = async () => {
    if (!db || !db.collection) return;
    setIsSaving(true);
    try {
      let finalLogoUrl = logoUrl;

      if (logoFile) {
        setIsUploading(true);
        const storageRef = storage.ref(`church_logos/main_logo_${Date.now()}`);
        await storageRef.put(logoFile);
        finalLogoUrl = await storageRef.getDownloadURL();
        setIsUploading(false);
      }

      await db.collection('settings').doc('church').set({
        logoUrl: finalLogoUrl,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.uid
      }, { merge: true });

      setLogoUrl(finalLogoUrl);
      setLogoFile(null);
      alert(t.fellowship.save);
    } catch (error) {
      console.error("Error saving settings:", error);
      alert(t.stats.saveFail);
    }
    setIsSaving(false);
  };

  const handleDeleteLogo = async () => {
    if (!window.confirm(t.fellowship.deleteConfirm)) return;
    setIsSaving(true);
    try {
      await db.collection('settings').doc('church').update({
        logoUrl: ''
      });
      setLogoUrl('');
      alert(t.fellowship.save);
    } catch (error) {
      console.error("Error deleting logo:", error);
      alert(t.stats.deleteFail);
    }
    setIsSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader className="animate-spin text-church-600 w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="p-2 hover:bg-white rounded-full transition text-slate-500">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-3xl font-serif font-bold text-church-900">{t.admin.churchSettings}</h1>
          </div>
          <button 
            onClick={handleSave} 
            disabled={isSaving || isUploading}
            className="flex items-center px-6 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 transition shadow-sm font-bold disabled:opacity-50"
          >
            {isSaving ? <Loader className="animate-spin w-4 h-4 mr-2" /> : <Save size={18} className="mr-2" />}
            {t.fellowship.save}
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center">
              <ImageIcon className="mr-2 text-church-600" /> {t.admin.logo}
            </h2>
            <p className="text-slate-500 text-sm">{t.admin.logoNote}</p>
          </div>

          <div className="p-8 space-y-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-32 h-32 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative group">
                {logoFile ? (
                  <img src={URL.createObjectURL(logoFile)} alt="Preview" className="w-full h-full object-contain p-2" />
                ) : logoUrl ? (
                  <img src={logoUrl} alt="Church Logo" className="w-full h-full object-contain p-2" referrerPolicy="no-referrer" />
                ) : (
                  <ImageIcon size={40} className="text-slate-300" />
                )}
                {(logoUrl || logoFile) && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <button 
                      onClick={() => {
                        if (logoFile) setLogoFile(null);
                        else handleDeleteLogo();
                      }}
                      className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-4">
                <div className="relative">
                  <input 
                    type="file" 
                    id="logo-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  />
                  <label 
                    htmlFor="logo-upload"
                    className="flex items-center justify-center px-6 py-3 border-2 border-dashed border-church-200 rounded-xl cursor-pointer hover:bg-church-50 transition group"
                  >
                    <Upload size={20} className="mr-2 text-church-400 group-hover:text-church-600" />
                    <span className="text-sm font-bold text-church-700">{t.admin.uploadLogo}</span>
                  </label>
                </div>
                <p className="text-xs text-slate-400 text-center md:text-left">
                  Recommended: Square PNG or SVG with transparent background.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
