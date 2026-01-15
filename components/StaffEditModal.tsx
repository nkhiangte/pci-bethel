
import React, { useState, useEffect } from 'react';
import { Staff } from '../types';
import { Loader, Save, X, Trash2, AlertCircle, Move, ZoomIn, BookOpen, PlusCircle, Phone } from 'lucide-react';

interface StaffEditModalProps {
  staff: Partial<Staff>;
  onClose: () => void;
  onSave: (staff: Staff, collectionName: 'elders' | 'pastors' | 'proPastors') => Promise<void>;
  onDelete: (id: string, collectionName: 'elders' | 'pastors' | 'proPastors') => Promise<void>;
  isLoading: boolean;
  showDeleteConfirm: string | null;
  setShowDeleteConfirm: (id: string | null) => void;
  collectionName: 'elders' | 'pastors' | 'proPastors';
}

const StaffEditModal: React.FC<StaffEditModalProps> = ({ staff, onClose, onSave, onDelete, isLoading, showDeleteConfirm, setShowDeleteConfirm, collectionName }) => {
  const [formData, setFormData] = useState<Partial<Staff>>(staff);

  useEffect(() => {
    setFormData(staff);
  }, [staff]);

  const handleSaveClick = async () => {
    if (formData.name && formData.imageUrl && formData.role) {
      await onSave(formData as Staff, collectionName);
    } else {
      alert("Please fill in Name, Image URL, and Role.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[120] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col md:flex-row overflow-hidden animate-in zoom-in-90 duration-200">
        
        {/* Left Side: Image Preview & Adjustment */}
        <div className="md:w-1/2 bg-slate-100 p-6 flex flex-col border-r border-slate-200">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center"><Move size={18} className="mr-2"/> Image Adjustments</h3>
            
            <div className="flex-1 flex items-center justify-center mb-6 bg-slate-200 rounded-lg overflow-hidden relative shadow-inner min-h-[300px]">
                {formData.imageUrl ? (
                    <div className="relative w-64 h-64 rounded-full md:rounded-lg overflow-hidden bg-white shadow-lg border-4 border-white">
                        <img 
                            src={formData.imageUrl} 
                            alt="Preview" 
                            className="w-full h-full object-cover transition-all duration-200"
                            style={{
                                objectPosition: `${formData.imagePositionX ?? 50}% ${formData.imagePositionY ?? 0}%`,
                                transform: `scale(${formData.imageScale ?? 1})`
                            }}
                        />
                    </div>
                ) : (
                    <div className="text-slate-400">Enter Image URL to Preview</div>
                )}
            </div>

            <div className="space-y-4 bg-white p-4 rounded-lg shadow-sm">
                <div>
                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                        <span>Horizontal (X)</span>
                        <span>{formData.imagePositionX ?? 50}%</span>
                    </div>
                    <input 
                        type="range" min="-100" max="200" 
                        value={formData.imagePositionX ?? 50} 
                        onChange={(e) => setFormData({...formData, imagePositionX: Number(e.target.value)})}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-church-600"
                    />
                </div>
                <div>
                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                        <span>Vertical (Y)</span>
                        <span>{formData.imagePositionY ?? 0}%</span>
                    </div>
                    <input 
                        type="range" min="-100" max="200" 
                        value={formData.imagePositionY ?? 0} 
                        onChange={(e) => setFormData({...formData, imagePositionY: Number(e.target.value)})}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-church-600"
                    />
                </div>
                <div>
                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                        <span className="flex items-center"><ZoomIn size={12} className="mr-1"/> Zoom</span>
                        <span>{formData.imageScale ?? 1}x</span>
                    </div>
                    <input 
                        type="range" min="1" max="3" step="0.1"
                        value={formData.imageScale ?? 1} 
                        onChange={(e) => setFormData({...formData, imageScale: Number(e.target.value)})}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-church-600"
                    />
                </div>
            </div>
        </div>

        {/* Right Side: Form Details */}
        <div className="md:w-1/2 flex flex-col h-full max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center bg-church-50">
            <h3 className="text-xl font-bold text-church-900">{staff.id ? `Edit ${staff.name}` : `Add New Member`}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Name</label>
                <input
                className="w-full border border-slate-300 rounded p-2.5"
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full Name"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Role</label>
                    <input
                    className="w-full border border-slate-300 rounded p-2.5"
                    value={formData.role || ''}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g., Elder, Pastor"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Ordination Year</label>
                    <input
                    className="w-full border border-slate-300 rounded p-2.5"
                    value={formData.period || ''}
                    onChange={e => setFormData({ ...formData, period: e.target.value })}
                    placeholder="e.g., 2010"
                    />
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Qualification</label>
                    <input
                    className="w-full border border-slate-300 rounded p-2.5"
                    value={formData.qualification || ''}
                    onChange={e => setFormData({ ...formData, qualification: e.target.value })}
                    placeholder="e.g. B.A, B.D"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Probation Tenure</label>
                    <input
                    className="w-full border border-slate-300 rounded p-2.5"
                    value={formData.probationTenure || ''}
                    onChange={e => setFormData({ ...formData, probationTenure: e.target.value })}
                    placeholder="e.g. 2005 - 2007"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Phone size={14} /> Phone Number (Optional)
                </label>
                <input
                className="w-full border border-slate-300 rounded p-2.5"
                value={formData.phoneNumber || ''}
                onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="e.g., 9862012345"
                />
            </div>
            
            {/* Multiple Previous Bials Section */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Previous Bials History</label>
                <div className="space-y-2">
                    {(formData.previousBials || []).map((item, index) => (
                        <div key={index} className="flex gap-2 items-center">
                            <input 
                                className="flex-1 border border-slate-300 rounded p-2 text-sm" 
                                placeholder="Bial Name" 
                                value={item.field} 
                                onChange={e => {
                                    const list = [...(formData.previousBials || [])];
                                    list[index] = { ...list[index], field: e.target.value };
                                    setFormData({ ...formData, previousBials: list });
                                }}
                            />
                            <input 
                                className="w-32 border border-slate-300 rounded p-2 text-sm" 
                                placeholder="Tenure (e.g. 2010-15)" 
                                value={item.period} 
                                onChange={e => {
                                    const list = [...(formData.previousBials || [])];
                                    list[index] = { ...list[index], period: e.target.value };
                                    setFormData({ ...formData, previousBials: list });
                                }}
                            />
                            <button 
                                onClick={() => {
                                    const list = [...(formData.previousBials || [])];
                                    list.splice(index, 1);
                                    setFormData({ ...formData, previousBials: list });
                                }}
                                className="p-2 text-red-500 hover:bg-red-50 rounded"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
                <button 
                    type="button"
                    onClick={() => setFormData({ ...formData, previousBials: [...(formData.previousBials || []), { field: '', period: '' }] })}
                    className="mt-3 text-xs font-bold text-church-600 flex items-center gap-1 hover:underline"
                >
                    <PlusCircle size={14}/> Add Previous Bial
                </button>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Image URL</label>
                <input
                className="w-full border border-slate-300 rounded p-2.5"
                value={formData.imageUrl || ''}
                onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://..."
                />
            </div>
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Brief Description (Quote)</label>
                <textarea
                className="w-full border border-slate-300 rounded p-2.5 h-16 resize-none"
                value={formData.description || ''}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Short inspiring quote."
                />
            </div>
            <div>
                <label className="block text-sm font-bold text-church-700 mb-1 flex items-center gap-2">
                    <BookOpen size={16} /> Detailed Biography (Firebase)
                </label>
                <textarea
                className="w-full border border-slate-300 rounded p-2.5 h-48 font-serif"
                value={formData.biography || ''}
                onChange={e => setFormData({ ...formData, biography: e.target.value })}
                placeholder="Write the full life story, service history, and personal testimony here. This text is saved to Firebase."
                />
            </div>
            {staff.id && (
                <div className="pt-4 border-t border-slate-100">
                <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(staff.id || '')}
                    className="w-full flex items-center justify-center px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition shadow-sm"
                >
                    <Trash2 size={16} className="mr-2" /> Delete Record
                </button>
                </div>
            )}
            </div>
            <div className="p-4 bg-slate-50 flex justify-end space-x-2 rounded-br-xl border-t">
            <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-white transition">Cancel</button>
            <button onClick={handleSaveClick} disabled={isLoading} className="px-4 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 flex items-center transition shadow-sm disabled:opacity-50">
                {isLoading ? <Loader className="animate-spin w-4 h-4 mr-2" /> : <Save size={16} className="mr-2" />} Save Biography
            </button>
            </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-[130] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl p-6 max-sm w-full shadow-2xl animate-in zoom-in-90 duration-200">
            <div className="flex items-center text-red-600 mb-4"><AlertCircle className="w-6 h-6 mr-2" /><h3 className="text-lg font-bold">Confirm Delete</h3></div>
            <p className="text-slate-600 mb-6">Are you sure? This will remove the entire leader record and biography from Firebase.</p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
              <button onClick={() => { if (staff.id) onDelete(staff.id, collectionName); setShowDeleteConfirm(null); }} disabled={isLoading} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition shadow-sm disabled:opacity-50">Delete Permanently</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffEditModal;
