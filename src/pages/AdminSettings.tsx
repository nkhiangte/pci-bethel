
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { Shield, Save, Loader, Upload, Trash2, ArrowLeft, Image as ImageIcon, MapPin, Phone, Mail, Map } from 'lucide-react';
import { db, storage } from '../services/firebase';

const INITIAL_CONTACT_DATA = {
  addressLine1: "Bethel Veng, Champhai",
  addressLine2: "Mizoram 796321",
  phone: "+91 98620 12345",
  email: "office@bethelkohhran.pci",
  mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d11111.96502726909!2d93.32881935!3d23.47795035!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x374c5b850f896b29%3A0x59635515cb423e25!2sChamphai%20Bethel%20Presbyterian%20Church!5e1!3m2!1sen!2sin!4v1767936549517!5m2!1sen!2sin"
};

const AdminSettings: React.FC = () => {
  const { t } = useLanguage();
  const { isAdmin, currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [contactData, setContactData] = useState(INITIAL_CONTACT_DATA);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!db || !db.collection) {
        setLoading(false);
        return;
      }
      try {
        const [churchDoc, contactDoc] = await Promise.all([
          db.collection('settings').doc('church').get(),
          db.collection('settings').doc('contact').get()
        ]);
        
        if (churchDoc.exists) {
          setLogoUrl(churchDoc.data()?.logoUrl || '');
        }

        if (contactDoc.exists) {
          setContactData({ ...INITIAL_CONTACT_DATA, ...contactDoc.data() });
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

      await Promise.all([
        db.collection('settings').doc('church').set({
          logoUrl: finalLogoUrl,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser.uid
        }, { merge: true }),
        db.collection('settings').doc('contact').set({
          ...contactData,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser.uid
        }, { merge: true })
      ]);

      setLogoUrl(finalLogoUrl);
      setLogoFile(null);
      alert("Settings saved successfully.");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings.");
    }
    setIsSaving(false);
  };

  const handleDeleteLogo = async () => {
    if (!window.confirm("Are you sure you want to delete the current logo?")) return;
    setIsSaving(true);
    try {
      await db.collection('settings').doc('church').update({
        logoUrl: ''
      });
      setLogoUrl('');
      alert("Logo deleted successfully.");
    } catch (error) {
      console.error("Error deleting logo:", error);
      alert("Failed to delete logo.");
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

        <div className="space-y-6">
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

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-8 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center">
                <MapPin className="mr-2 text-church-600" /> Contact Information
              </h2>
              <p className="text-slate-500 text-sm">Update the contact details displayed across the website and footer.</p>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Address Line 1</label>
                  <input 
                    type="text" 
                    value={contactData.addressLine1}
                    onChange={e => setContactData({...contactData, addressLine1: e.target.value})}
                    className="w-full border-slate-300 rounded-lg p-3 border outline-none focus:ring-2 focus:ring-church-500"
                    placeholder="e.g., Bethel Veng, Champhai"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Address Line 2</label>
                  <input 
                    type="text" 
                    value={contactData.addressLine2}
                    onChange={e => setContactData({...contactData, addressLine2: e.target.value})}
                    className="w-full border-slate-300 rounded-lg p-3 border outline-none focus:ring-2 focus:ring-church-500"
                    placeholder="e.g., Mizoram 796321"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                  <input 
                    type="text" 
                    value={contactData.phone}
                    onChange={e => setContactData({...contactData, phone: e.target.value})}
                    className="w-full border-slate-300 rounded-lg p-3 border outline-none focus:ring-2 focus:ring-church-500"
                    placeholder="e.g., +91 98620 12345"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                  <input 
                    type="email" 
                    value={contactData.email}
                    onChange={e => setContactData({...contactData, email: e.target.value})}
                    className="w-full border-slate-300 rounded-lg p-3 border outline-none focus:ring-2 focus:ring-church-500"
                    placeholder="e.g., office@bethelkohhran.pci"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Google Maps Embed URL</label>
                  <textarea 
                    value={contactData.mapUrl}
                    onChange={e => setContactData({...contactData, mapUrl: e.target.value})}
                    className="w-full border-slate-300 rounded-lg p-3 border outline-none focus:ring-2 focus:ring-church-500 h-24"
                    placeholder="<iframe src='...'>...</iframe> or just the HTTPS URL"
                  />
                  <p className="text-xs text-slate-500 mt-2">Paste the 'src' URL from Google Maps Embed. This points to the map display on the contact page.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminSettings;

