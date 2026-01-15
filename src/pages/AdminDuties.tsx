
import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../services/firebase';
import { WeeklyDuty, ProgramField } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { getConstants } from '../constants';
import { Loader, Save, X, Database, Shield, ClipboardList, Clock, CalendarDays, Mic, BookOpen, Plus, Trash2, Users } from 'lucide-react';
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
            setDuties(staticDuty as any);
            setLoading(false);
            return;
        }

        try {
            const docRef = db.collection('weeklyDuties').doc('current');
            
            // Add a timeout to fallback to static data if Firestore is slow/offline
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Fetch timeout')), 5000)
            );
            
            // Try to fetch from server/cache
            const docSnap: any = await Promise.race([
                docRef.get(),
                timeoutPromise
            ]);

            if (docSnap.exists) {
                const data = docSnap.data() as any;
                
                // MIGRATION LOGIC: Convert old object format to new array format
                const newServicePrograms: any = {
                    sundaySchool: Array.isArray(data.servicePrograms?.sundaySchool) ? data.servicePrograms.sundaySchool : [],
                    morning: Array.isArray(data.servicePrograms?.morning) ? data.servicePrograms.morning : [],
                    evening: Array.isArray(data.servicePrograms?.evening) ? data.servicePrograms.evening : []
                };

                // If it was an object, map standard fields
                if (data.servicePrograms && !Array.isArray(data.servicePrograms.sundaySchool)) {
                    if (data.servicePrograms.sundaySchool?.tantu) newServicePrograms.sundaySchool.push({ id: 'legacy-1', label: 'Ṭantu', value: data.servicePrograms.sundaySchool.tantu });
                    if (data.servicePrograms.sundaySchool?.zirlai) newServicePrograms.sundaySchool.push({ id: 'legacy-2', label: 'Zirlai / Topic', value: data.servicePrograms.sundaySchool.zirlai });
                    
                    if (data.servicePrograms.morning?.thuhriltu) newServicePrograms.morning.push({ id: 'legacy-1', label: 'Thuhriltu', value: data.servicePrograms.morning.thuhriltu });
                    if (data.servicePrograms.morning?.tantu) newServicePrograms.morning.push({ id: 'legacy-2', label: 'Ṭantu', value: data.servicePrograms.morning.tantu });

                    if (data.servicePrograms.evening?.thuhriltu) newServicePrograms.evening.push({ id: 'legacy-1', label: 'Thuhriltu', value: data.servicePrograms.evening.thuhriltu });
                    if (data.servicePrograms.evening?.tantu) newServicePrograms.evening.push({ id: 'legacy-2', label: 'Ṭantu', value: data.servicePrograms.evening.tantu });
                }

                setDuties({ ...data, servicePrograms: newServicePrograms });
            } else {
                setDuties(staticDuty as any);
            }
        } catch (error: any) {
            console.warn("Using static duties due to fetch error:", error.message || error);
            setDuties(staticDuty as any); 
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

    const handleFieldChange = (field: keyof WeeklyDuty, value: string) => {
        setDuties(prev => ({ ...prev, [field]: value }));
    };

    const handleListChange = (field: keyof WeeklyDuty, value: string) => {
        setDuties(prev => ({ ...prev, [field]: value.split('\n') }));
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

    // New Dynamic Program Handlers
    const addProgramField = (serviceType: 'sundaySchool' | 'morning' | 'evening') => {
        const newField: ProgramField = { id: Date.now().toString(), label: '', value: '' };
        setDuties(prev => ({
            ...prev,
            servicePrograms: {
                ...(prev.servicePrograms || { sundaySchool: [], morning: [], evening: [] }),
                [serviceType]: [...(prev.servicePrograms?.[serviceType] || []), newField]
            }
        }));
    };

    const removeProgramField = (serviceType: 'sundaySchool' | 'morning' | 'evening', fieldId: string) => {
        setDuties(prev => ({
            ...prev,
            servicePrograms: {
                ...(prev.servicePrograms || { sundaySchool: [], morning: [], evening: [] }),
                [serviceType]: (prev.servicePrograms?.[serviceType] || []).filter(f => f.id !== fieldId)
            }
        }));
    };

    const updateProgramField = (serviceType: 'sundaySchool' | 'morning' | 'evening', fieldId: string, key: 'label' | 'value', value: string) => {
        setDuties(prev => ({
            ...prev,
            servicePrograms: {
                ...(prev.servicePrograms || { sundaySchool: [], morning: [], evening: [] }),
                [serviceType]: (prev.servicePrograms?.[serviceType] || []).map(f => 
                    f.id === fieldId ? { ...f, [key]: value } : f
                )
            }
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

    if (!currentUser) return <Navigate to="/login" />;
    if (!isAdmin) return <div className="p-20 text-center">Access Denied</div>;

    const ServiceConfigBox = ({ type, title, icon: Icon }: { type: 'sundaySchool' | 'morning' | 'evening', title: string, icon: any }) => (
        <div className="space-y-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h4 className="font-black text-slate-800 border-b border-slate-100 pb-3 mb-2 flex items-center gap-3">
                <Icon size={20} className="text-church-600"/> {title}
            </h4>
            
            <div className="space-y-3 mb-6">
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Display Title</label>
                    <input 
                        className="w-full border border-slate-200 p-3 rounded-xl text-sm font-bold bg-slate-50 focus:bg-white transition" 
                        value={duties.serviceTitles?.[type] || ''} 
                        onChange={e => handleServiceTitleChange(type, e.target.value)} 
                        placeholder="e.g. Sunday School"
                    />
                </div>
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Time</label>
                    <input 
                        className="w-full border border-slate-200 p-3 rounded-xl text-sm bg-slate-50 focus:bg-white transition" 
                        value={duties.serviceTimes?.[type] || ''} 
                        onChange={e => handleServiceTimeChange(type, e.target.value)} 
                        placeholder="e.g. 10:00 AM"
                    />
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Program Fields</label>
                    <button onClick={() => addProgramField(type)} className="text-church-600 hover:text-church-800 flex items-center text-[10px] font-black uppercase tracking-tighter bg-church-50 px-2 py-1 rounded">
                        <Plus size={12} className="mr-1"/> Add Field
                    </button>
                </div>
                
                <div className="space-y-3">
                    {(duties.servicePrograms?.[type] || []).map((field) => (
                        <div key={field.id} className="flex gap-2 items-start group">
                            <div className="flex-1 space-y-1">
                                <input 
                                    className="w-full border-none bg-slate-100 p-2 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500 focus:ring-1 focus:ring-church-200" 
                                    value={field.label} 
                                    onChange={e => updateProgramField(type, field.id, 'label', e.target.value)} 
                                    placeholder="LABEL (e.g. ṬANTU)"
                                />
                                <input 
                                    className="w-full border border-slate-200 p-2 rounded-lg text-sm font-bold text-slate-800 focus:ring-1 focus:ring-church-300" 
                                    value={field.value} 
                                    onChange={e => updateProgramField(type, field.id, 'value', e.target.value)} 
                                    placeholder="Value"
                                />
                            </div>
                            <button onClick={() => removeProgramField(type, field.id)} className="p-2 text-slate-300 hover:text-red-500 mt-6 transition-colors">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                    {(duties.servicePrograms?.[type] || []).length === 0 && (
                        <p className="text-[10px] text-slate-400 italic text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">No program details added yet.</p>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="py-12 bg-slate-50 min-h-screen">
            <div className="max-w-6xl mx-auto px-6">
                <div className="mb-12">
                    <h1 className="text-4xl font-serif font-black text-slate-900 mb-2">Manage Weekly Duties</h1>
                    <p className="text-slate-500 font-medium">Configure program details and service times for the congregation.</p>
                </div>

                {loading ? <div className="text-center py-24"><Loader className="animate-spin h-12 w-12 mx-auto text-church-600" /></div>
                : (
                    <div className="space-y-12">
                        {/* Sunday Services Section */}
                        <div className="grid lg:grid-cols-3 gap-8">
                            <ServiceConfigBox type="sundaySchool" title="Sunday School" icon={BookOpen} />
                            <ServiceConfigBox type="morning" title="Chawhnu Inkhawm" icon={Clock} />
                            <ServiceConfigBox type="evening" title="Zan Inkhawm" icon={Mic} />
                        </div>

                        {/* Other Personnel and Ranges */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm grid md:grid-cols-2 gap-12">
                            <div className="space-y-6">
                                <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs border-b pb-4 flex items-center gap-2"><ClipboardList size={18} className="text-church-600"/> General Settings</h3>
                                <div className="grid gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Week Range</label>
                                        <input className="w-full border border-slate-200 p-3 rounded-xl text-sm font-bold" value={duties.weekRange || ''} onChange={e => handleFieldChange('weekRange', e.target.value)} placeholder="e.g. 05 - 11 Jan, 2026" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Zai Hruaitu</label><input className="w-full border border-slate-200 p-3 rounded-xl text-sm" value={duties.zaiHruaitu || ''} onChange={e => handleFieldChange('zaiHruaitu', e.target.value)} /></div>
                                        <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Hla Hriltu</label><input className="w-full border border-slate-200 p-3 rounded-xl text-sm" value={duties.hlaHriltu || ''} onChange={e => handleFieldChange('hlaHriltu', e.target.value)} /></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Piano</label><input className="w-full border border-slate-200 p-3 rounded-xl text-sm" value={duties.pianoTumtu || ''} onChange={e => handleFieldChange('pianoTumtu', e.target.value)} /></div>
                                        <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Sound</label><input className="w-full border border-slate-200 p-3 rounded-xl text-sm" value={duties.lightAndSoundDuty || ''} onChange={e => handleFieldChange('lightAndSoundDuty', e.target.value)} /></div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs border-b pb-4 flex items-center gap-2"><Users size={18} className="text-church-600"/> Team Rosters</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Thawhlawm Chhiartute (One per line)</label>
                                        <textarea className="w-full border border-slate-200 p-3 rounded-xl text-xs h-24" value={duties.thawhlawmChiartute?.join('\n') || ''} onChange={e => handleListChange('thawhlawmChiartute', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Ushers (One per line)</label>
                                        <textarea className="w-full border border-slate-200 p-3 rounded-xl text-xs h-24" value={duties.ushers?.join('\n') || ''} onChange={e => handleListChange('ushers', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-8">
                            <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-4 px-10 py-5 bg-church-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-church-700 shadow-2xl transition disabled:opacity-50">
                                {isSaving ? <Loader className="animate-spin" size={20}/> : <Save size={20} />}
                                {isSaving ? 'Updating...' : 'Publish Changes'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDuties;
