
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { ChurchRecord, BaptismRecord, WeddingRecord, DeathRecord, InkhawmpuiRecord } from '../types';
import { BookUser, HeartHandshake, Baby, Cross, Users, Plus, Edit, Trash, X, Save, Loader, AlertTriangle } from 'lucide-react';

type RecordType = 'baptism' | 'wedding' | 'death' | 'inkhawmpui';

const Records: React.FC = () => {
    const { t } = useLanguage();
    const { isAdmin } = useAuth();
    const [activeTab, setActiveTab] = useState<RecordType>('baptism');
    const [records, setRecords] = useState<ChurchRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOfflineMode, setIsOfflineMode] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    // FIX: Changed state type from Partial<ChurchRecord> to a union of partials to correctly handle the discriminated union.
    const [editingRecord, setEditingRecord] = useState<Partial<BaptismRecord> | Partial<WeddingRecord> | Partial<DeathRecord> | Partial<InkhawmpuiRecord> | null>(null);

    const MOCK_DATA: ChurchRecord[] = [
        { id: 'b1', type: 'baptism', name: 'Lalrinfela Pachuau', dateOfBirth: '2023-01-15', baptismDate: '2023-05-20', parents: 'Pu Lalthanmawia & Pi Zorini', minister: 'Rev. H. Vanlalruata' },
        { id: 'w1', type: 'wedding', groomName: 'Samuel V.L. Hriata', brideName: 'Esther Lalhlimpuii', weddingDate: '2024-02-14', minister: 'Rev. H. Vanlalruata' },
        { id: 'd1', type: 'death', name: 'Upa C. Lalzuala', dateOfDeath: '2024-03-01', age: 78, familyContact: 'Pu Lalhruaia' },
        { id: 'i1', type: 'inkhawmpui', eventName: 'Bial Inkhawmpui Vawi 50-na', year: 2023, theme: 'Krista Chhungkua', location: 'Bethel Kohhran', speakers: 'Rev. Dr. Vanlalzuala' }
    ];

    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        setLoading(true);
        setIsOfflineMode(false);
        if (!db?.collection) {
            setRecords(MOCK_DATA);
            setIsOfflineMode(true);
            setLoading(false);
            return;
        }
        try {
            const snapshot = await db.collection('records').get();
            if (snapshot.empty) {
                setRecords(MOCK_DATA);
            } else {
                const data = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as ChurchRecord[];
                setRecords(data);
            }
        } catch (error: any) {
            console.error("Error fetching records:", error.message);
            if (error.code === 'permission-denied' || error.message.includes('permission')) {
                setIsOfflineMode(true);
            }
            setRecords(MOCK_DATA);
        }
        setLoading(false);
    };

    const handleAddNew = () => {
        // FIX: Directly set the editingRecord state with the correct object type for each tab. This is now type-safe due to the updated state type.
        switch(activeTab) {
            case 'baptism': setEditingRecord({ type: 'baptism', name: '', dateOfBirth: '', baptismDate: '', parents: '', minister: '' }); break;
            case 'wedding': setEditingRecord({ type: 'wedding', groomName: '', brideName: '', weddingDate: '', minister: '' }); break;
            case 'death': setEditingRecord({ type: 'death', name: '', dateOfDeath: '', age: 0, familyContact: '' }); break;
            case 'inkhawmpui': setEditingRecord({ type: 'inkhawmpui', eventName: '', year: new Date().getFullYear(), theme: '', location: '', speakers: '' }); break;
        }
        setIsModalOpen(true);
    };
    
    const handleEdit = (record: ChurchRecord) => {
        setEditingRecord(record);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!db?.doc || !window.confirm("Are you sure you want to delete this record?")) return;
        try {
            await db.collection('records').doc(id).delete();
            fetchRecords();
        } catch (error) {
            console.error("Error deleting record:", error);
        }
    };
    
    const handleSave = async () => {
        if (!db?.collection || !editingRecord) return;
        setLoading(true);
        try {
            const { id, ...data } = editingRecord;
            if (id) {
                await db.collection('records').doc(id).set(data, { merge: true });
            } else {
                await db.collection('records').add(data);
            }
            setIsModalOpen(false);
            fetchRecords();
        } catch (error) {
            console.error("Error saving record:", error);
        }
        setLoading(false);
    };


    const tabs = [
        { id: 'baptism', label: t.records.tabs.baptism, icon: Baby },
        { id: 'wedding', label: t.records.tabs.wedding, icon: HeartHandshake },
        { id: 'death', label: t.records.tabs.death, icon: Cross },
        { id: 'inkhawmpui', label: t.records.tabs.conference, icon: Users },
    ];
    
    const filteredRecords = records.filter(r => r.type === activeTab);

    return (
        <div className="py-12 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-serif font-bold text-church-900 mb-4 text-center">{t.records.title}</h1>
                <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">{t.records.subtitle}</p>
                
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-2 mb-8 flex flex-wrap gap-2 justify-center">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as RecordType)}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                activeTab === tab.id ? 'bg-church-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <tab.icon size={16} className="mr-2" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {isOfflineMode && (
                    <div className="mb-6 p-3 bg-blue-50 text-blue-700 text-xs rounded text-center flex items-center justify-center">
                        <AlertTriangle size={14} className="mr-2" />
                        Public View Mode. Admin controls are disabled due to database permissions.
                    </div>
                )}

                <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100">
                    {isAdmin && !isOfflineMode && (
                        <div className="flex justify-end mb-4">
                            <button onClick={handleAddNew} className="flex items-center px-4 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 shadow-sm">
                                <Plus size={18} className="mr-2" /> {t.records.add}
                            </button>
                        </div>
                    )}
                    
                    <div className="overflow-x-auto">
                        {loading ? <Loader className="animate-spin mx-auto my-12" /> : filteredRecords.length === 0 ? (
                            <p className="text-center text-slate-500 py-8">{t.records.empty}</p>
                        ) : (
                            <table className="w-full text-sm text-left text-slate-500">
                                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                    <tr>
                                        {activeTab === 'baptism' && <>
                                            <th className="px-6 py-3">{t.records.theads.name}</th>
                                            <th className="px-6 py-3">{t.records.theads.dob}</th>
                                            <th className="px-6 py-3">{t.records.theads.baptism_date}</th>
                                            <th className="px-6 py-3">{t.records.theads.parents}</th>
                                            <th className="px-6 py-3">{t.records.theads.minister}</th>
                                        </>}
                                        {activeTab === 'wedding' && <>
                                            <th className="px-6 py-3">{t.records.theads.groom}</th>
                                            <th className="px-6 py-3">{t.records.theads.bride}</th>
                                            <th className="px-6 py-3">{t.records.theads.wedding_date}</th>
                                            <th className="px-6 py-3">{t.records.theads.wedding_minister}</th>
                                        </>}
                                        {activeTab === 'death' && <>
                                            <th className="px-6 py-3">{t.records.theads.name}</th>
                                            <th className="px-6 py-3">{t.records.theads.dod}</th>
                                            <th className="px-6 py-3">{t.records.theads.age}</th>
                                            <th className="px-6 py-3">{t.records.theads.family}</th>
                                        </>}
                                        {activeTab === 'inkhawmpui' && <>
                                            <th className="px-6 py-3">{t.records.theads.event}</th>
                                            <th className="px-6 py-3">{t.records.theads.year}</th>
                                            <th className="px-6 py-3">{t.records.theads.theme}</th>
                                            <th className="px-6 py-3">{t.records.theads.location}</th>
                                            <th className="px-6 py-3">{t.records.theads.speakers}</th>
                                        </>}
                                        {isAdmin && !isOfflineMode && <th className="px-6 py-3">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRecords.map(rec => (
                                        <tr key={rec.id} className="bg-white border-b hover:bg-slate-50">
                                            {rec.type === 'baptism' && <>
                                                <td className="px-6 py-4 font-medium text-slate-900">{rec.name}</td>
                                                <td className="px-6 py-4">{rec.dateOfBirth}</td>
                                                <td className="px-6 py-4">{rec.baptismDate}</td>
                                                <td className="px-6 py-4">{rec.parents}</td>
                                                <td className="px-6 py-4">{rec.minister}</td>
                                            </>}
                                            {rec.type === 'wedding' && <>
                                                <td className="px-6 py-4 font-medium text-slate-900">{rec.groomName}</td>
                                                <td className="px-6 py-4 font-medium text-slate-900">{rec.brideName}</td>
                                                <td className="px-6 py-4">{rec.weddingDate}</td>
                                                <td className="px-6 py-4">{rec.minister}</td>
                                            </>}
                                            {rec.type === 'death' && <>
                                                <td className="px-6 py-4 font-medium text-slate-900">{rec.name}</td>
                                                <td className="px-6 py-4">{rec.dateOfDeath}</td>
                                                <td className="px-6 py-4">{rec.age}</td>
                                                <td className="px-6 py-4">{rec.familyContact}</td>
                                            </>}
                                            {rec.type === 'inkhawmpui' && <>
                                                <td className="px-6 py-4 font-medium text-slate-900">{rec.eventName}</td>
                                                <td className="px-6 py-4">{rec.year}</td>
                                                <td className="px-6 py-4">{rec.theme}</td>
                                                <td className="px-6 py-4">{rec.location}</td>
                                                <td className="px-6 py-4">{rec.speakers}</td>
                                            </>}
                                            {isAdmin && !isOfflineMode && (
                                                <td className="px-6 py-4 flex space-x-2">
                                                    <button onClick={() => handleEdit(rec)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit size={16} /></button>
                                                    <button onClick={() => handleDelete(rec.id!)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash size={16} /></button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Add/Edit Modal */}
                {isModalOpen && editingRecord && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
                            <div className="p-6 border-b flex justify-between items-center">
                                <h3 className="text-lg font-bold">
                                    {editingRecord.id ? 'Edit' : 'Add'} {tabs.find(t=>t.id === activeTab)?.label} Record
                                </h3>
                                <button onClick={() => setIsModalOpen(false)}><X/></button>
                            </div>
                            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                                {activeTab === 'baptism' && (
                                    <>
                                        {/* FIX: Add type assertion to editingRecord when spreading to update state for a discriminated union. */}
                                        <input className="w-full border p-2 rounded" placeholder="Name" value={(editingRecord as BaptismRecord).name} onChange={e => setEditingRecord({...editingRecord as Partial<BaptismRecord>, name: e.target.value})} />
                                        <input type="date" className="w-full border p-2 rounded" placeholder="Date of Birth" value={(editingRecord as BaptismRecord).dateOfBirth} onChange={e => setEditingRecord({...editingRecord as Partial<BaptismRecord>, dateOfBirth: e.target.value})} />
                                        <input type="date" className="w-full border p-2 rounded" placeholder="Baptism Date" value={(editingRecord as BaptismRecord).baptismDate} onChange={e => setEditingRecord({...editingRecord as Partial<BaptismRecord>, baptismDate: e.target.value})} />
                                        <input className="w-full border p-2 rounded" placeholder="Parents' Names" value={(editingRecord as BaptismRecord).parents} onChange={e => setEditingRecord({...editingRecord as Partial<BaptismRecord>, parents: e.target.value})} />
                                        <input className="w-full border p-2 rounded" placeholder="Officiating Minister" value={(editingRecord as BaptismRecord).minister} onChange={e => setEditingRecord({...editingRecord as Partial<BaptismRecord>, minister: e.target.value})} />
                                    </>
                                )}
                                {activeTab === 'wedding' && (
                                     <>
                                        <input className="w-full border p-2 rounded" placeholder="Groom's Name" value={(editingRecord as WeddingRecord).groomName} onChange={e => setEditingRecord({...editingRecord as Partial<WeddingRecord>, groomName: e.target.value})} />
                                        <input className="w-full border p-2 rounded" placeholder="Bride's Name" value={(editingRecord as WeddingRecord).brideName} onChange={e => setEditingRecord({...editingRecord as Partial<WeddingRecord>, brideName: e.target.value})} />
                                        <input type="date" className="w-full border p-2 rounded" placeholder="Wedding Date" value={(editingRecord as WeddingRecord).weddingDate} onChange={e => setEditingRecord({...editingRecord as Partial<WeddingRecord>, weddingDate: e.target.value})} />
                                        <input className="w-full border p-2 rounded" placeholder="Officiating Minister" value={(editingRecord as WeddingRecord).minister} onChange={e => setEditingRecord({...editingRecord as Partial<WeddingRecord>, minister: e.target.value})} />
                                    </>
                                )}
                                {activeTab === 'death' && (
                                     <>
                                        <input className="w-full border p-2 rounded" placeholder="Name" value={(editingRecord as DeathRecord).name} onChange={e => setEditingRecord({...editingRecord as Partial<DeathRecord>, name: e.target.value})} />
                                        <input type="date" className="w-full border p-2 rounded" placeholder="Date of Death" value={(editingRecord as DeathRecord).dateOfDeath} onChange={e => setEditingRecord({...editingRecord as Partial<DeathRecord>, dateOfDeath: e.target.value})} />
                                        <input type="number" className="w-full border p-2 rounded" placeholder="Age" value={(editingRecord as DeathRecord).age} onChange={e => setEditingRecord({...editingRecord as Partial<DeathRecord>, age: parseInt(e.target.value) || 0})} />
                                        <input className="w-full border p-2 rounded" placeholder="Family Contact" value={(editingRecord as DeathRecord).familyContact} onChange={e => setEditingRecord({...editingRecord as Partial<DeathRecord>, familyContact: e.target.value})} />
                                    </>
                                )}
                                {activeTab === 'inkhawmpui' && (
                                     <>
                                        <input className="w-full border p-2 rounded" placeholder="Event Name" value={(editingRecord as InkhawmpuiRecord).eventName} onChange={e => setEditingRecord({...editingRecord as Partial<InkhawmpuiRecord>, eventName: e.target.value})} />
                                        <input type="number" className="w-full border p-2 rounded" placeholder="Year" value={(editingRecord as InkhawmpuiRecord).year} onChange={e => setEditingRecord({...editingRecord as Partial<InkhawmpuiRecord>, year: parseInt(e.target.value) || new Date().getFullYear()})} />
                                        <input className="w-full border p-2 rounded" placeholder="Theme" value={(editingRecord as InkhawmpuiRecord).theme} onChange={e => setEditingRecord({...editingRecord as Partial<InkhawmpuiRecord>, theme: e.target.value})} />
                                        <input className="w-full border p-2 rounded" placeholder="Location" value={(editingRecord as InkhawmpuiRecord).location} onChange={e => setEditingRecord({...editingRecord as Partial<InkhawmpuiRecord>, location: e.target.value})} />
                                        <input className="w-full border p-2 rounded" placeholder="Key Speakers" value={(editingRecord as InkhawmpuiRecord).speakers} onChange={e => setEditingRecord({...editingRecord as Partial<InkhawmpuiRecord>, speakers: e.target.value})} />
                                    </>
                                )}
                            </div>
                            <div className="p-4 bg-slate-50 flex justify-end space-x-2">
                                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
                                <button onClick={handleSave} className="px-4 py-2 bg-church-600 text-white rounded flex items-center">
                                    {loading ? <Loader className="animate-spin w-4 h-4 mr-2" /> : <Save size={16} className="mr-2" />} Save
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Records;
