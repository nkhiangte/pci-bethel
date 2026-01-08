
import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Clock, Edit, X, Save, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';

interface ContactInfo {
  addressLine1: string;
  addressLine2: string;
  phone: string;
  email: string;
  officeHoursWeekdays: string;
  officeHoursWeekend: string;
  mapUrl: string;
}

const INITIAL_CONTACT_DATA: ContactInfo = {
  addressLine1: "Bethel Veng, Champhai",
  addressLine2: "Mizoram 796321",
  phone: "+91 98620 12345",
  email: "office@bethelkohhran.pci",
  officeHoursWeekdays: "Tue - Fri: 10am - 4pm",
  officeHoursWeekend: "Sat: 10am - 1pm",
  mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3656.849280860851!2d93.3283253!3d23.4735394!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x374d810056637385%3A0x6a2c3c6f24056250!2sPCI%20Champhai%20Bethel%20Kohhran!5e0!3m2!1sen!2sin!4v1709568000000!5m2!1sen!2sin"
};

const Contact: React.FC = () => {
  const { isAdmin } = useAuth();
  const [data, setData] = useState<ContactInfo>(INITIAL_CONTACT_DATA);
  const [loading, setLoading] = useState(true);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<ContactInfo>(INITIAL_CONTACT_DATA);
  const [isSaving, setIsSaving] = useState(false);

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
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!db || !db.collection) return;
    setIsSaving(true);
    try {
      await db.collection('settings').doc('contact').set(editForm);
      setData(editForm);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving contact info:", error);
      alert("Failed to save changes.");
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
        ></iframe>
        {isAdmin && (
            <button 
                onClick={handleEditClick} 
                className="absolute bottom-4 right-4 bg-white text-church-600 px-4 py-2 rounded-lg shadow-lg font-bold flex items-center hover:bg-church-50 transition z-10"
            >
                <Edit size={18} className="mr-2" /> Edit Info
            </button>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="grid md:grid-cols-3 gap-8">
            {/* Location Card */}
            <div className="bg-white p-8 rounded-xl shadow-lg flex flex-col items-center text-center hover:shadow-xl transition-shadow duration-300">
                <div className="p-4 bg-church-50 text-church-600 rounded-full mb-4 ring-4 ring-church-50/50"><MapPin size={32} /></div>
                <h3 className="font-bold text-lg mb-3 text-slate-800">Our Location</h3>
                <div className="text-slate-600 leading-relaxed">
                    <p>{data.addressLine1}</p>
                    <p>{data.addressLine2}</p>
                </div>
            </div>

            {/* Phone & Email Card */}
            <div className="bg-white p-8 rounded-xl shadow-lg flex flex-col items-center text-center hover:shadow-xl transition-shadow duration-300">
                <div className="p-4 bg-green-50 text-green-600 rounded-full mb-4 ring-4 ring-green-50/50"><Phone size={32} /></div>
                <h3 className="font-bold text-lg mb-3 text-slate-800">Phone & Email</h3>
                <div className="text-slate-600 leading-relaxed space-y-1">
                    <p className="font-medium text-slate-800">{data.phone}</p>
                    <p className="text-sm">{data.email}</p>
                </div>
            </div>

             {/* Office Hours Card */}
             <div className="bg-white p-8 rounded-xl shadow-lg flex flex-col items-center text-center hover:shadow-xl transition-shadow duration-300">
                <div className="p-4 bg-orange-50 text-orange-600 rounded-full mb-4 ring-4 ring-orange-50/50"><Clock size={32} /></div>
                <h3 className="font-bold text-lg mb-3 text-slate-800">Office Hours</h3>
                <div className="text-slate-600 leading-relaxed space-y-1">
                    <p>{data.officeHoursWeekdays}</p>
                    <p>{data.officeHoursWeekend}</p>
                </div>
            </div>
        </div>

        {/* Contact Form */}
        <div className="mt-16 bg-white rounded-xl shadow-sm border border-slate-100 p-8 md:p-12 max-w-3xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-serif font-bold text-church-900 mb-2">Send us a Message</h2>
                <p className="text-slate-500">We'd love to hear from you. Fill out the form below.</p>
            </div>
            <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Your Name</label>
                        <input className="w-full border border-slate-200 bg-slate-50 rounded-lg p-3 focus:bg-white focus:ring-2 focus:ring-church-500 outline-none transition" required placeholder="John Doe" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Phone Number</label>
                        <input className="w-full border border-slate-200 bg-slate-50 rounded-lg p-3 focus:bg-white focus:ring-2 focus:ring-church-500 outline-none transition" placeholder="+91..." />
                    </div>
                </div>
                <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1.5">Message</label>
                     <textarea className="w-full border border-slate-200 bg-slate-50 rounded-lg p-3 h-40 focus:bg-white focus:ring-2 focus:ring-church-500 outline-none transition resize-none" required placeholder="How can we help you?"></textarea>
                </div>
                <button className="w-full bg-church-600 text-white font-bold py-4 rounded-lg hover:bg-church-700 transition shadow-lg shadow-church-200 transform hover:-translate-y-0.5">Send Message</button>
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
                        <h4 className="font-bold text-orange-600 text-sm uppercase tracking-wider border-b pb-2">Office Hours</h4>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Weekdays</label>
                                <input className="w-full border p-2 rounded" value={editForm.officeHoursWeekdays} onChange={e => setEditForm({...editForm, officeHoursWeekdays: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Weekend</label>
                                <input className="w-full border p-2 rounded" value={editForm.officeHoursWeekend} onChange={e => setEditForm({...editForm, officeHoursWeekend: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-bold text-slate-600 text-sm uppercase tracking-wider border-b pb-2">Map Configuration</h4>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Google Maps Embed URL (iframe src)</label>
                            <input className="w-full border p-2 rounded text-sm font-mono text-slate-600" value={editForm.mapUrl} onChange={e => setEditForm({...editForm, mapUrl: e.target.value})} />
                            <p className="text-xs text-slate-400 mt-1">Copy the 'src' attribute from Google Maps 'Embed a map' feature.</p>
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
