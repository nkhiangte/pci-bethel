
import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../services/firebase';
import { WeeklyDuty } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { getConstants } from '../constants';
import { Loader, Save, X, Database, Shield, ClipboardList, Clock, CalendarDays, Mic, BookOpen } from 'lucide-react';
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
                const data = docSnap.data() as WeeklyDuty;
                // Ensure new structure exists if migrating from old data
                if (!data.servicePrograms || typeof data.servicePrograms.sundaySchool === 'string') {
                    data.servicePrograms = {
                        sundaySchool: { tantu: '', zirlai: typeof data.servicePrograms?.sundaySchool === 'string' ? data.servicePrograms.sundaySchool : '' },
                        morning: { tantu: '', thuhriltu: typeof data.servicePrograms?.morning === 'string' ? data.servicePrograms.morning : '' },
                        evening: { tantu: '', thuhriltu: typeof data.servicePrograms?.evening === 'string' ? data.servicePrograms.evening : '' }
                    };
                }
                setDuties(data);
            } else {
                setDuties(staticDuty);
            }
        } catch (error) {
            console.error("Error fetching duties:", error);
            setDuties(staticDuty); 
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

    const handleServiceTitleChange = (timeType: 'sundaySchool' | 'morning' | 'evening', value: string) => {
        setDuties(prev => ({
            ...prev,
            serviceTitles: {
                ...(prev.serviceTitles || { sundaySchool: '', morning: '', evening: '' }),
                [timeType]: value
            }
        }));
    };

    const handleServiceProgramDetailChange = (
        timeType: 'sundaySchool' | 'morning' | 'evening', 
        field: 'tantu' | 'zirlai' | 'thuhriltu', 
        value: string
    ) => {
        setDuties(prev => ({
            ...prev,
            servicePrograms: {
                ...(prev.servicePrograms || { 
                    sundaySchool: { tantu: '', zirlai: '' }, 
                    morning: { tantu: '', thuhriltu: '' }, 
                    evening: { tantu: '', thuhriltu: '' } 
                }),
                [timeType]: {
                    ...prev.servicePrograms?.[timeType],
                    [field]: value
                }
            } as any
        }));
    };

    const handleMidWeekChange = (day: 'nilai' | 'inrinni', field: string, value: string) => {
        setDuties(prev => ({
            ...prev,
            midWeek: {
                ...prev.midWeek,
                [day]: {
                    ...(prev.midWeek?.[day] || {}),
                    [field]: value
                }
            } as any
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
                                <Clock size={20} className="mr-2"/> Inkhawm Hun (Service Times & Programs)
                            </h3>
                            <div className="grid md:grid-cols-3 gap-6">
                                {/* Sunday School */}
                                <div className="space-y-2 bg-white p-4 rounded-lg border border-slate-200">
                                    <h4 className="font-bold text-slate-700 border-b pb-2 mb-2 flex items-center gap-2"><BookOpen size={16}/> Sunday School</h4>
                                    <input 
                                        className="w-full border border-slate-300 p-2 rounded text-sm mb-2" 
                                        value={duties.serviceTitles?.sundaySchool || 'Sunday School'} 
                                        onChange={e => handleServiceTitleChange('sundaySchool', e.target.value)} 
                                        placeholder="Title"
                                    />
                                    <input 
                                        className="w-full border border-slate-300 p-2 rounded text-sm mb-2" 
                                        value={duties.serviceTimes?.sundaySchool || ''} 
                                        onChange={e => handleServiceTimeChange('sundaySchool', e.target.value)} 
                                        placeholder="Time"
                                    />
                                    <div className="pt-2 border-t border-slate-100 mt-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Ṭantu</label>
                                        <input 
                                            className="w-full border border-slate-300 p-2 rounded text-sm mb-2" 
                                            value={duties.servicePrograms?.sundaySchool?.tantu || ''} 
                                            onChange={e => handleServiceProgramDetailChange('sundaySchool', 'tantu', e.target.value)} 
                                            placeholder="Tantu Hming"
                                        />
                                        <label className="text-xs font-bold text-slate-500 uppercase">Zirlai / Topic</label>
                                        <input 
                                            className="w-full border border-slate-300 p-2 rounded text-sm" 
                                            value={duties.servicePrograms?.sundaySchool?.zirlai || ''} 
                                            onChange={e => handleServiceProgramDetailChange('sundaySchool', 'zirlai', e.target.value)} 
                                            placeholder="Zirlai"
                                        />
                                    </div>
                                </div>

                                {/* Morning (Chawhnu) */}
                                <div className="space-y-2 bg-white p-4 rounded-lg border border-slate-200">
                                    <h4 className="font-bold text-slate-700 border-b pb-2 mb-2 flex items-center gap-2"><Clock size={16}/> Chawhnu Inkhawm</h4>
                                    <input 
                                        className="w-full border border-slate-300 p-2 rounded text-sm mb-2" 
                                        value={duties.serviceTitles?.morning || 'Chawhnu Inkhawm'} 
                                        onChange={e => handleServiceTitleChange('morning', e.target.value)} 
                                        placeholder="Title"
                                    />
                                    <input 
                                        className="w-full border border-slate-300 p-2 rounded text-sm mb-2" 
                                        value={duties.serviceTimes?.morning || ''} 
                                        onChange={e => handleServiceTimeChange('morning', e.target.value)} 
                                        placeholder="Time"
                                    />
                                    <div className="pt-2 border-t border-slate-100 mt-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Thuhriltu</label>
                                        <input 
                                            className="w-full border border-slate-300 p-2 rounded text-sm mb-2" 
                                            value={duties.servicePrograms?.morning?.thuhriltu || ''} 
                                            onChange={e => handleServiceProgramDetailChange('morning', 'thuhriltu', e.target.value)} 
                                            placeholder="Thuhriltu Hming"
                                        />
                                        <label className="text-xs font-bold text-slate-500 uppercase">Ṭantu</label>
                                        <input 
                                            className="w-full border border-slate-300 p-2 rounded text-sm" 
                                            value={duties.servicePrograms?.morning?.tantu || ''} 
                                            onChange={e => handleServiceProgramDetailChange('morning', 'tantu', e.target.value)} 
                                            placeholder="Tantu Hming"
                                        />
                                    </div>
                                </div>

                                {/* Evening (Zan) */}
                                <div className="space-y-2 bg-white p-4 rounded-lg border border-slate-200">
                                    <h4 className="font-bold text-slate-700 border-b pb-2 mb-2 flex items-center gap-2"><Mic size={16}/> Zan Inkhawm</h4>
                                    <input 
                                        className="w-full border border-slate-300 p-2 rounded text-sm mb-2" 
                                        value={duties.serviceTitles?.evening || 'Zan Inkhawm'} 
                                        onChange={e => handleServiceTitleChange('evening', e.target.value)} 
                                        placeholder="Title"
                                    />
                                    <input 
                                        className="w-full border border-slate-300 p-2 rounded text-sm mb-2" 
                                        value={duties.serviceTimes?.evening || ''} 
                                        onChange={e => handleServiceTimeChange('evening', e.target.value)} 
                                        placeholder="Time"
                                    />
                                    <div className="pt-2 border-t border-slate-100 mt-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Thuhriltu</label>
                                        <input 
                                            className="w-full border border-slate-300 p-2 rounded text-sm mb-2" 
                                            value={duties.servicePrograms?.evening?.thuhriltu || ''} 
                                            onChange={e => handleServiceProgramDetailChange('evening', 'thuhriltu', e.target.value)} 
                                            placeholder="Thuhriltu Hming"
                                        />
                                        <label className="text-xs font-bold text-slate-500 uppercase">Ṭantu</label>
                                        <input 
                                            className="w-full border border-slate-300 p-2 rounded text-sm" 
                                            value={duties.servicePrograms?.evening?.tantu || ''} 
                                            onChange={e => handleServiceProgramDetailChange('evening', 'tantu', e.target.value)} 
                                            placeholder="Tantu Hming"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* New Mid-Week Program Section */}
                        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                                <CalendarDays size={20} className="mr-2"/> Mid-Week Programs
                            </h3>
                            <div className="grid md:grid-cols-2 gap-8">
                                {/* Nilai Zan */}
                                <div className="space-y-3">
                                    <h4 className="font-bold text-church-600 border-b pb-1">Nilai Zan (Wednesday)</h4>
                                    <input className="w-full border p-2 rounded" placeholder="Title (e.g. Nilai Zan Inkhawm)" value={duties.midWeek?.nilai?.title || ''} onChange={e => handleMidWeekChange('nilai', 'title', e.target.value)} />
                                    <input className="w-full border p-2 rounded" placeholder="Time (e.g. 07:00 PM)" value={duties.midWeek?.nilai?.time || ''} onChange={e => handleMidWeekChange('nilai', 'time', e.target.value)} />
                                    <input className="w-full border p-2 rounded" placeholder="Hruaitu" value={duties.midWeek?.nilai?.hruaitu || ''} onChange={e => handleMidWeekChange('nilai', 'hruaitu', e.target.value)} />
                                    <input className="w-full border p-2 rounded" placeholder="Ṭantu" value={duties.midWeek?.nilai?.tantu || ''} onChange={e => handleMidWeekChange('nilai', 'tantu', e.target.value)} />
                                    <input className="w-full border p-2 rounded" placeholder="Thupui (Topic)" value={duties.midWeek?.nilai?.thupui || ''} onChange={e => handleMidWeekChange('nilai', 'thupui', e.target.value)} />
                                    <input className="w-full border p-2 rounded" placeholder="Thuhriltu / Hawngtu" value={duties.midWeek?.nilai?.thuhriltu || ''} onChange={e => handleMidWeekChange('nilai', 'thuhriltu', e.target.value)} />
                                </div>
                                {/* Inrinni Zan */}
                                <div className="space-y-3">
                                    <h4 className="font-bold text-church-600 border-b pb-1">Inrinni Zan (Saturday)</h4>
                                    <input className="w-full border p-2 rounded" placeholder="Title (e.g. Inrinni Zan Inkhawm)" value={duties.midWeek?.inrinni?.title || ''} onChange={e => handleMidWeekChange('inrinni', 'title', e.target.value)} />
                                    <input className="w-full border p-2 rounded" placeholder="Time (e.g. 07:00 PM)" value={duties.midWeek?.inrinni?.time || ''} onChange={e => handleMidWeekChange('inrinni', 'time', e.target.value)} />
                                    <input className="w-full border p-2 rounded" placeholder="Hruaitu" value={duties.midWeek?.inrinni?.hruaitu || ''} onChange={e => handleMidWeekChange('inrinni', 'hruaitu', e.target.value)} />
                                    <input className="w-full border p-2 rounded" placeholder="Ṭantu" value={duties.midWeek?.inrinni?.tantu || ''} onChange={e => handleMidWeekChange('inrinni', 'tantu', e.target.value)} />
                                    <input className="w-full border p-2 rounded" placeholder="Thupui (Topic)" value={duties.midWeek?.inrinni?.thupui || ''} onChange={e => handleMidWeekChange('inrinni', 'thupui', e.target.value)} />
                                    <input className="w-full border p-2 rounded" placeholder="Thuhriltu / Hawngtu" value={duties.midWeek?.inrinni?.thuhriltu || ''} onChange={e => handleMidWeekChange('inrinni', 'thuhriltu', e.target.value)} />
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
                            <h3 className="text-lg font-bold text-slate-800 border-t pt-6">Kohhran Hun Ruatna (Sunday)</h3>
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
