
import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Edit, X, Save, Loader, AlertCircle, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { useLanguage } from '../contexts/LanguageContext';

interface ContactInfo {
  addressLine1: string;
  addressLine2: string;
  phone: string;
  email: string;
  mapUrl: string;
}

const INITIAL_CONTACT_DATA: ContactInfo = {
  addressLine1: "Bethel Veng, Champhai",
  addressLine2: "Mizoram 796321",
  phone: "+91 98620 12345",
  email: "office@bethelkohhran.pci",
  // Updated map URL to point exactly to PCI Champhai Bethel Kohhran per request
  mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d11111.96502726909!2d93.32881935!3d23.47795035!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x374c5b850f896b29%3A0x59635515cb423e25!2sChamphai%20Bethel%20Presbyterian%20Church!5e1!3m2!1sen!2sin!4v1767936549517!5m2!1sen!2sin"
};

const Contact: React.FC = () => {
  const { isAdmin } = useAuth();
  const { t } = useLanguage();
  const [data, setData] = useState<ContactInfo>(INITIAL_CONTACT_DATA);
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<ContactInfo>(INITIAL_CONTACT_DATA);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (db && db.collection) {
        try {
          const doc = await db.collection('settings').doc('contact').get();
          if (doc.exists) {
            setData(doc.data() as ContactInfo);
          }
        } catch (error) {
          console.error("Error fetching contact info:", error);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleEditClick = () => {
    setEditForm(data);
    setSaveError(null);
    setIsEditing(true);
  };

  const handleMapUrlChange = (value: string) => {
    // Check if the input is an iframe string and extract the src
    const iframeMatch = value.match(/src="([^"]+)"/);
    if (iframeMatch && iframeMatch[1]) {
        setEditForm({...editForm, mapUrl: iframeMatch[1]});
    } else {
        setEditForm({...editForm, mapUrl: value});
    }
  };

  const handleSave = async () => {
    if (!db || !db.collection) {
        setSaveError("Database connection not available.");
        return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      await db.collection('settings').doc('contact').set(editForm);
      setData(editForm);
      setIsEditing(false);
    } catch (error: any) {
      console.error("Error saving contact info:", error);
      if (error.code === 'permission-denied') {
          setSaveError("Permission denied. Ensure you are logged in as admin and rules allow writes to 'settings'.");
      } else {
          setSaveError("Failed to save changes. " + (error.message || ''));
      }
    }
    setIsSaving(false);
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-12">
      {/* Map Header */}
      <div className="h-96 w-full bg-slate-200 relative group">
        <iframe 
            src={data.mapUrl} 
            width="100%" 
            height="100%" 
            style={{border:0}} 
            allowFullScreen={true} 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
            className="grayscale-[20%]"
            title="Church Location"
        ></iframe>
        {isAdmin && (
            <button 
                onClick={handleEditClick} 
                className="absolute bottom-4 right-4 bg-white text-church-600 px-4 py-2 rounded-lg shadow-lg font-bold flex items-center hover:bg-church-50 transition z-10"
            >
                <Edit size={18} className="mr-2" /> Edit Location & Info
            </button>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Location Card */}
            <div className="bg-white p-8 rounded-xl shadow-lg flex flex-col items-center text-center hover:shadow-xl transition-shadow duration-300">
                <div className="p-4 bg-church-50 text-church-600 rounded-full mb-4 ring-4 ring-church-50/50"><MapPin size={32} /></div>
                <h3 className="font-bold text-lg mb-3 text-slate-800">{t.contact.location}</h3>
                <div className="text-slate-600 leading-relaxed">
                    <p>{data.addressLine1}</p>
                    <p>{data.addressLine2}</p>
                </div>
            </div>

            {/* Phone & Email Card */}
            <div className="bg-white p-8 rounded-xl shadow-lg flex flex-col items-center text-center hover:shadow-xl transition-shadow duration-300">
                <div className="p-4 bg-green-50 text-green-600 rounded-full mb-4 ring-4 ring-green-50/50"><Phone size={32} /></div>
                <h3 className="font-bold text-lg mb-3 text-slate-800">{t.contact.phoneEmail}</h3>
                <div className="text-slate-600 leading-relaxed space-y-3 flex flex-col items-center">
                    <div className="flex flex-col items-center gap-2">
                        <p className="font-medium text-slate-800">{data.phone}</p>
                        <div className="flex gap-3">
                            <a 
                                href={`tel:${data.phone.replace(/[^0-9+]/g, '')}`}
                                className="flex items-center gap-2 px-4 py-2 bg-church-50 text-church-600 rounded-full text-sm font-bold hover:bg-church-100 transition shadow-sm border border-church-100"
                            >
                                <Phone size={16} /> Call
                            </a>
                            <a 
                                href={`https://wa.me/91${data.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-full text-sm font-bold hover:bg-green-100 transition shadow-sm border border-green-100"
                            >
                                <MessageCircle size={16} /> WhatsApp
                            </a>
                        </div>
                    </div>
                    <p className="text-sm">{data.email}</p>
                </div>
            </div>
        </div>

        {/* Contact Form */}
        <div className="mt-16 bg-white rounded-xl shadow-sm border border-slate-100 p-8 md:p-12 max-w-3xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-serif font-bold text-church-900 mb-2">{t.contact.sendMessage}</h2>
                <p className="text-slate-500">{t.contact.formSubtitle}</p>
            </div>
            <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">{t.contact.name}</label>
                        <input className="w-full border border-slate-200 bg-slate-50 rounded-lg p-3 focus:bg-white focus:ring-2 focus:ring-church-500 outline-none transition" required placeholder="Hming..." />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">{t.contact.phone}</label>
                        <input className="w-full border border-slate-200 bg-slate-50 rounded-lg p-3 focus:bg-white focus:ring-2 focus:ring-church-500 outline-none transition" placeholder="+91..." />
                    </div>
                </div>
                <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1.5">{t.contact.message}</label>
                     <textarea className="w-full border border-slate-200 bg-slate-50 rounded-lg p-3 h-40 focus:bg-white focus:ring-2 focus:ring-church-500 outline-none transition resize-none" required placeholder="Engnge i sawi duh?"></textarea>
                </div>
                <button className="w-full bg-church-600 text-white font-bold py-4 rounded-lg hover:bg-church-700 transition shadow-lg shadow-church-200 transform hover:-translate-y-0.5">{t.contact.send}</button>
            </form>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-xl sticky top-0 z-10">
                    <h3 className="text-xl font-bold text-slate-800">Edit Contact Information</h3>
                    <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>
                <div className="p-6 space-y-6">
                    {saveError && (
                        <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start text-sm border border-red-200">
                            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                            {saveError}
                        </div>
                    )}
                    
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h4 className="font-bold text-church-600 text-sm uppercase tracking-wider border-b pb-2">Location Details</h4>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Address Line 1</label>
                                <input className="w-full border p-2 rounded" value={editForm.addressLine1} onChange={e => setEditForm({...editForm, addressLine1: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Address Line 2 (Pin)</label>
                                <input className="w-full border p-2 rounded" value={editForm.addressLine2} onChange={e => setEditForm({...editForm, addressLine2: e.target.value})} />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h4 className="font-bold text-green-600 text-sm uppercase tracking-wider border-b pb-2">Contact Details</h4>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                <input className="w-full border p-2 rounded" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input className="w-full border p-2 rounded" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-bold text-slate-600 text-sm uppercase tracking-wider border-b pb-2">Map Configuration</h4>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Google Maps Embed URL</label>
                            <input 
                                className="w-full border p-2 rounded text-sm font-mono text-slate-600" 
                                value={editForm.mapUrl} 
                                onChange={e => handleMapUrlChange(e.target.value)}
                                placeholder="Paste iframe code here..."
                            />
                            <p className="text-xs text-slate-400 mt-1">
                                You can paste the full &lt;iframe&gt; code from Google Maps here, and we will extract the link for you.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="p-6 border-t bg-slate-50 flex justify-end space-x-3 rounded-b-xl sticky bottom-0 z-10">
                    <button onClick={() => setIsEditing(false)} className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-white font-medium transition">Cancel</button>
                    <button onClick={handleSave} disabled={isSaving} className="px-5 py-2.5 bg-church-600 text-white rounded-lg hover:bg-church-700 font-medium flex items-center shadow-md transition disabled:opacity-50">
                        {isSaving ? <Loader className="animate-spin w-4 h-4 mr-2" /> : <Save size={18} className="mr-2" />} Save Changes
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Contact;
