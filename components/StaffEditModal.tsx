
import React, { useState, useEffect } from 'react';
import { Staff } from '../types';
import { Loader, Save, X, Trash2, AlertCircle, Move, ZoomIn } from 'lucide-react';

interface StaffEditModalProps {
  staff: Partial<Staff>;
  onClose: () => void;
  // FIX: Updated collectionName type to include 'proPastors'
  onSave: (staff: Staff, collectionName: 'elders' | 'pastors' | 'proPastors') => Promise<void>;
  // FIX: Updated collectionName type to include 'proPastors'
  onDelete: (id: string, collectionName: 'elders' | 'pastors' | 'proPastors') => Promise<void>;
  isLoading: boolean;
  showDeleteConfirm: string | null;
  setShowDeleteConfirm: (id: string | null) => void;
  // FIX: Updated collectionName type to include 'proPastors'
  collectionName: 'elders' | 'pastors' | 'proPastors'; // Added to distinguish between elders and pastors and proPastors
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

  // The delete button will now always be shown if staff.id exists,
  // as per the user's request for full admin control.
  // Actual deletion permission is handled by Firestore Security Rules.
  const allowDeleteUI = true; 

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
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
                                objectPosition: `${formData.imagePositionX ?? 50}% ${formData.imagePositionY ?? 0}%`, // Default to top center (50% 0%)
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
                        <span>Horizontal Position (X)</span>
                        <span>{formData.imagePositionX ?? 50}%</span>
                    </div>
                    <input 
                        type="range" min="0" max="100" 
                        value={formData.imagePositionX ?? 50} 
                        onChange={(e) => setFormData({...formData, imagePositionX: Number(e.target.value)})}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-church-600"
                    />
                </div>
                <div>
                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                        <span>Vertical Position (Y)</span>
                        <span>{formData.imagePositionY ?? 0}%</span>
                    </div>
                    <input 
                        type="range" min="0" max="100" 
                        value={formData.imagePositionY ?? 0} 
                        onChange={(e) => setFormData({...formData, imagePositionY: Number(e.target.value)})}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-church-600"
                    />
                </div>
                <div>
                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                        <span className="flex items-center"><ZoomIn size={12} className="mr-1"/> Zoom / Scale</span>
                        <span>{formData.imageScale ?? 1}x</span>
                    </div>
                    <input 
                        type="range" min="1" max="3" step="0.1"
                        value={formData.imageScale ?? 1} 
                        onChange={(e) => setFormData({...formData, imageScale: Number(e.target.value)})}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-church-600"
                    />
                </div>
                <div className="flex justify-end">
                    <button 
                        onClick={() => setFormData({...formData, imagePositionX: 50, imagePositionY: 0, imageScale: 1})}
                        className="text-xs text-church-600 hover:underline"
                    >
                        Reset Adjustments
                    </button>
                </div>
            </div>
        </div>

        {/* Right Side: Form Details */}
        <div className="md:w-1/2 flex flex-col h-full max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center bg-church-50">
            <h3 className="text-xl font-bold text-church-900">{staff.id ? `Edit ${staff.name}` : `Add New ${staff.role || 'Staff'}`}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Name</label>
                <input
                className="w-full border border-slate-300 rounded p-2.5"
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Staff Member's Full Name"
                />
            </div>
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Role</label>
                <input
                className="w-full border border-slate-300 rounded p-2.5"
                value={formData.role || ''}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
                placeholder="e.g., Elder, Pastor, Deacon"
                />
            </div>
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Period / Ordination Year (Optional)</label>
                <input
                className="w-full border border-slate-300 rounded p-2.5"
                value={formData.period || ''}
                onChange={e => setFormData({ ...formData, period: e.target.value })}
                placeholder="e.g., 2020-2024 (Pastors) or 2010 (Ordination Year)"
                />
            </div>
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Image URL</label>
                <input
                className="w-full border border-slate-300 rounded p-2.5"
                value={formData.imageUrl || ''}
                onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
                />
            </div>
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Description/Caption</label>
                <textarea
                className="w-full border border-slate-300 rounded p-2.5 h-24"
                value={formData.description || ''}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="A brief description or role of the staff member."
                />
            </div>
            {staff.id && allowDeleteUI && ( // Always show delete button if ID exists
                <div className="pt-4 border-t border-slate-100">
                <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(staff.id || '')}
                    className="w-full flex items-center justify-center px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition shadow-sm"
                >
                    <Trash2 size={16} className="mr-2" /> Delete {staff.role || 'Staff'}
                </button>
                </div>
            )}
            </div>
            <div className="p-4 bg-slate-50 flex justify-end space-x-2 rounded-br-xl">
            <button onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-white transition">Cancel</button>
            <button onClick={handleSaveClick} disabled={isLoading} className="px-4 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 flex items-center transition shadow-sm disabled:opacity-50">
                {isLoading ? <Loader className="animate-spin w-4 h-4 mr-2" /> : <Save size={16} className="mr-2" />} Save Changes
            </button>
            </div>
        </div>
      </div>

      {showDeleteConfirm && allowDeleteUI && ( // Always show delete confirmation if triggered
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-90 duration-200">
            <div className="flex items-center text-red-600 mb-4"><AlertCircle className="w-6 h-6 mr-2" /><h3 className="text-lg font-bold">Confirm Delete</h3></div>
            <p className="text-slate-600 mb-6">Are you sure you want to delete this {staff.role?.toLowerCase() || 'staff member'}? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
              <button onClick={() => { if (staff.id) onDelete(staff.id, collectionName); setShowDeleteConfirm(null); }} disabled={isLoading} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition shadow-sm disabled:opacity-50">Delete {staff.role || 'Staff'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffEditModal;
