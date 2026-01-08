
import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../services/firebase';
import { WeeklyDuty } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { getConstants } from '../constants';
import { Loader, Save, X, Database, Shield, ClipboardList, Clock } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';

const AdminDuties: React.FC = () => {
    const { isAdmin, currentUser } = useAuth();
    const [duties, setDuties] = useState<Partial<WeeklyDuty>>({});
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const { weeklyDuty: staticDuty } = getConstants('mizo');

    const fetchDuties = useCallback(async () => {
        setLoading(true);
        if (!db?.doc) {
            setDuties(staticDuty);
            setLoading(false);
            return;
        }

        try {
            const docRef = db.collection('weeklyDuties').doc('current');
            const docSnap = await docRef.get();
            if (docSnap.exists) {
                setDuties(docSnap.data() as WeeklyDuty);
            } else {
                // If no doc, start with a blank slate based on the type
                setDuties({
                  month: '', thawhlawmChiartute: [], buhfaithamHralhtute: [], ushers: [],
                  weekRange: '', zaiHruaitu: '', pianoTumtu: '', hlaHriltu: '',
                  lightAndSoundDuty: '', pangparKhawitu: '',
                  serviceTimes: {
                      sundaySchool: '10:00 AM',
                      morning: '01:30 PM',
                      evening: '07:00 PM'
                  }
                });
            }
        } catch (error) {
            console.error("Error fetching duties:", error);
            setDuties(staticDuty); // Fallback on error
        }
        setLoading(false);
    }, [staticDuty]);

    useEffect(() => {
        fetchDuties();
    }, [fetchDuties]);

    const handleSave = async () => {
        if (!db?.doc || !window.confirm("Are you sure you want to update the weekly duties? This will be live on the homepage immediately.")) {
            return;
        }
        setIsSaving(true);
        try {
            await db.collection('weeklyDuties').doc('current').set(duties, { merge: true });
            alert("Weekly duties and service times updated successfully!");
        } catch (error) {
            console.error("Error saving duties:", error);
            alert("An error occurred. Please try again.");
        }
        setIsSaving(false);
    };

    const handleListChange = (field: keyof WeeklyDuty, value: string) => {
        setDuties(prev => ({ ...prev, [field]: value.split('\n') }));
    };

    const handleFieldChange = (field: keyof WeeklyDuty, value: string) => {
        setDuties(prev => ({ ...prev, [field]: value }));
    };

    const handleServiceTimeChange = (timeType: 'sundaySchool' | 'morning' | 'evening', value: string) => {
        setDuties(prev => ({
            ...prev,
            serviceTimes: {
                ...(prev.serviceTimes || { sundaySchool: '', morning: '', evening: '' }),
                [timeType]: value
            }
        }));
    };

    if (!currentUser) return <Navigate to="/login" replace />;
    if (!isAdmin) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center">
                <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-700">Access Denied</h2>
                <p className="text-slate-500">You do not have administrative privileges.</p>
                <Link to="/" className="text-church-600 hover:underline mt-4 block">Return Home</Link>
            </div>
        </div>
    );

    return (
        <div className="py-12 bg-slate-50 min-h-screen">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-serif font-bold text-church-900 mb-4">Manage Weekly Duties</h1>
                    <p className="max-w-2xl mx-auto text-slate-600">Update the list of members on duty for various roles and adjust service times. Changes will reflect on the homepage.</p>
                </div>

                {loading ? <div className="text-center py-20"><Loader className="animate-spin h-10 w-10 mx-auto text-church-500" /></div>
                : (
                    <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-100 space-y-8">
                        
                        {/* Service Times Section */}
                        <div className="bg-church-50 p-6 rounded-lg border border-church-100">
                            <h3 className="text-lg font-bold text-church-800 mb-4 flex items-center">
                                <Clock size={20} className="mr-2"/> Inkhawm Hun (Service Times)
                            </h3>
                            <div className="grid md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Sunday School</label>
                                    <input 
                                        className="w-full border border-slate-300 p-2 rounded-lg bg-white" 
                                        value={duties.serviceTimes?.sundaySchool || ''} 
                                        onChange={e => handleServiceTimeChange('sundaySchool', e.target.value)} 
                                        placeholder="e.g. 10:00 AM"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Morning Service</label>
                                    <input 
                                        className="w-full border border-slate-300 p-2 rounded-lg bg-white" 
                                        value={duties.serviceTimes?.morning || ''} 
                                        onChange={e => handleServiceTimeChange('morning', e.target.value)} 
                                        placeholder="e.g. 01:30 PM"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Evening Service</label>
                                    <input 
                                        className="w-full border border-slate-300 p-2 rounded-lg bg-white" 
                                        value={duties.serviceTimes?.evening || ''} 
                                        onChange={e => handleServiceTimeChange('evening', e.target.value)} 
                                        placeholder="e.g. 07:00 PM"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Month (e.g., January)</label>
                                <input className="w-full border p-2 rounded-lg" value={duties.month || ''} onChange={e => handleFieldChange('month', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Week Range (e.g., 05 - 11 January, 2026)</label>
                                <input className="w-full border p-2 rounded-lg" value={duties.weekRange || ''} onChange={e => handleFieldChange('weekRange', e.target.value)} />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Thawhlawm Chiartute (One per line)</label>
                                <textarea className="w-full border p-2 rounded-lg h-32" value={duties.thawhlawmChiartute?.join('\n') || ''} onChange={e => handleListChange('thawhlawmChiartute', e.target.value)} />
                            </div>
                             <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Buhfaitham Hralhtute (One per line)</label>
                                <textarea className="w-full border p-2 rounded-lg h-32" value={duties.buhfaithamHralhtute?.join('\n') || ''} onChange={e => handleListChange('buhfaithamHralhtute', e.target.value)} />
                            </div>
                             <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Ushers (One per line)</label>
                                <textarea className="w-full border p-2 rounded-lg h-32" value={duties.ushers?.join('\n') || ''} onChange={e => handleListChange('ushers', e.target.value)} />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-slate-800 border-t pt-6">Kohhran Hun Ruatna</h3>
                            <div className="grid md:grid-cols-2 gap-6 mt-4">
                                <div><label className="block text-sm font-bold mb-1">Zai Hruaitu</label><input className="w-full border p-2 rounded-lg" value={duties.zaiHruaitu || ''} onChange={e => handleFieldChange('zaiHruaitu', e.target.value)} /></div>
                                <div><label className="block text-sm font-bold mb-1">Piano Tumtu</label><input className="w-full border p-2 rounded-lg" value={duties.pianoTumtu || ''} onChange={e => handleFieldChange('pianoTumtu', e.target.value)} /></div>
                                <div><label className="block text-sm font-bold mb-1">Hla Hriltu</label><input className="w-full border p-2 rounded-lg" value={duties.hlaHriltu || ''} onChange={e => handleFieldChange('hlaHriltu', e.target.value)} /></div>
                                <div><label className="block text-sm font-bold mb-1">Light & Sound Duty</label><input className="w-full border p-2 rounded-lg" value={duties.lightAndSoundDuty || ''} onChange={e => handleFieldChange('lightAndSoundDuty', e.target.value)} /></div>
                                <div className="md:col-span-2"><label className="block text-sm font-bold mb-1">Pangpar Khawitu</label><input className="w-full border p-2 rounded-lg" value={duties.pangparKhawitu || ''} onChange={e => handleFieldChange('pangparKhawitu', e.target.value)} /></div>
                            </div>
                        </div>
                        
                        <div className="flex justify-end pt-6 border-t">
                            <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-6 py-3 bg-church-600 text-white rounded-lg hover:bg-church-700 shadow-sm transition disabled:opacity-50">
                                {isSaving ? <Loader className="animate-spin" size={20}/> : <Save size={20} />}
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDuties;
