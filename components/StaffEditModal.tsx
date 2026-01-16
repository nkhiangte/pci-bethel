
import React, { useState, useEffect, useRef } from 'react';
import { Staff } from '../types';
import { Loader, Save, X, Trash2, AlertCircle, Move, ZoomIn, BookOpen, PlusCircle, Phone, Hand, Upload, Crop, Check, RotateCcw, Image as ImageIcon } from 'lucide-react';

const IMGBB_API_KEY = '7939507abc655d09649cc02e47dc9d49';

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
  
  // Existing CSS Positioning State
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // New Cropper State
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [cropScale, setCropScale] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const cropImageRef = useRef<HTMLImageElement>(null);
  
  // Cropper Drag State
  const [isCropDragging, setIsCropDragging] = useState(false);
  const [cropDragStart, setCropDragStart] = useState({ x: 0, y: 0 });

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

  // --- 1. EXISTING CSS POSITIONING LOGIC (For fine-tuning existing URLs) ---

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX, y: clientY });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const dx = clientX - dragStart.x;
    const dy = clientY - dragStart.y;
    const sensitivity = 0.3; 

    setFormData(prev => ({
      ...prev,
      imagePositionX: (prev.imagePositionX ?? 50) - (dx * sensitivity),
      imagePositionY: (prev.imagePositionY ?? 0) - (dy * sensitivity)
    }));
    setDragStart({ x: clientX, y: clientY });
  };

  const handleMouseUp = () => { setIsDragging(false); };

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const scaleStep = 0.1;
    const currentScale = formData.imageScale ?? 1;
    let newScale = e.deltaY < 0 ? Math.min(currentScale + scaleStep, 3) : Math.max(currentScale - scaleStep, 1);
    setFormData(prev => ({ ...prev, imageScale: parseFloat(newScale.toFixed(1)) }));
  };

  // --- 2. NEW CROPPER LOGIC ---

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.addEventListener('load', () => {
            setCropImageSrc(reader.result?.toString() || null);
            setCropPosition({ x: 0, y: 0 });
            setCropScale(1);
            setIsCropperOpen(true);
        });
        reader.readAsDataURL(file);
    }
  };

  const handleCropMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setIsCropDragging(true);
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      setCropDragStart({ x: clientX - cropPosition.x, y: clientY - cropPosition.y });
  };

  const handleCropMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
      if (!isCropDragging) return;
      e.stopPropagation();
      e.preventDefault();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      setCropPosition({
          x: clientX - cropDragStart.x,
          y: clientY - cropDragStart.y
      });
  };

  const handleCropMouseUp = () => { setIsCropDragging(false); };

  const handleConfirmCrop = async () => {
      if (!cropImageRef.current) return;
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      // Set output resolution (e.g. 500x500 for profile pics)
      const outputSize = 500; 
      canvas.width = outputSize;
      canvas.height = outputSize;

      if (ctx) {
          // Draw image with current transform
          // Note: cropPosition is relative to the viewport center in UI, but drawImage needs logic
          // Simple Mapping: The UI viewport is, say, 250px. We map that to 500px canvas.
          
          // Clear background (white)
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, outputSize, outputSize);

          const img = cropImageRef.current;
          
          // Calculate draw parameters
          // We need to scale the movement from UI pixels to Canvas pixels.
          // Assuming UI viewport is roughly 250px (w-64 is 256px), let's say factor is 2.
          const factor = outputSize / 256; 
          
          // Center the image first
          const centerX = outputSize / 2;
          const centerY = outputSize / 2;
          
          const imgWidth = img.naturalWidth * cropScale * factor;
          const imgHeight = img.naturalHeight * cropScale * factor;
          
          const drawX = centerX - (imgWidth / 2) + (cropPosition.x * factor);
          const drawY = centerY - (imgHeight / 2) + (cropPosition.y * factor);

          ctx.drawImage(img, drawX, drawY, imgWidth, imgHeight);

          // Convert to blob and upload
          canvas.toBlob(async (blob) => {
              if (blob) {
                  await uploadToImgBB(blob);
              }
          }, 'image/jpeg', 0.9);
      }
  };

  const uploadToImgBB = async (imageBlob: Blob) => {
      setIsUploading(true);
      try {
          const formDataApi = new FormData();
          formDataApi.append('image', imageBlob, 'profile-crop.jpg');
          const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
              method: 'POST', body: formDataApi
          });
          const result = await response.json();
          if (result.success) {
              setFormData(prev => ({
                  ...prev, 
                  imageUrl: result.data.url,
                  // Reset positioning since we baked it into the crop
                  imagePositionX: 50,
                  imagePositionY: 0,
                  imageScale: 1
              }));
              setIsCropperOpen(false);
          } else {
              alert("Upload failed: " + (result.error?.message || 'Unknown error'));
          }
      } catch (error) {
          console.error("Upload error", error);
          alert("Network error during upload.");
      } finally {
          setIsUploading(false);
      }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[120] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col md:flex-row overflow-hidden animate-in zoom-in-90 duration-200">
        
        {/* Left Side: Image Preview & Adjustment */}
        <div className="md:w-1/2 bg-slate-100 p-6 flex flex-col border-r border-slate-200">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center justify-between">
                <span className="flex items-center"><Move size={18} className="mr-2"/> Image Settings</span>
            </h3>
            
            <div 
                ref={imageContainerRef}
                className="flex-1 flex items-center justify-center mb-6 bg-slate-200 rounded-lg overflow-hidden relative shadow-inner min-h-[300px] select-none"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleMouseDown}
                onTouchMove={handleMouseMove}
                onTouchEnd={handleMouseUp}
                onWheel={handleWheel}
            >
                {formData.imageUrl ? (
                    <div className="relative w-64 h-64 rounded-full md:rounded-lg overflow-hidden bg-white shadow-lg border-4 border-white group cursor-grab active:cursor-grabbing">
                        <img 
                            src={formData.imageUrl} 
                            alt="Preview" 
                            className="w-full h-full object-cover transition-transform duration-75 ease-out pointer-events-none" 
                            style={{
                                objectPosition: `${formData.imagePositionX ?? 50}% ${formData.imagePositionY ?? 0}%`,
                                transform: `scale(${formData.imageScale ?? 1})`
                            }}
                        />
                        {/* Hint Overlay */}
                        <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <Hand className="text-white mb-1" size={24} />
                            <span className="text-white text-[10px] font-bold uppercase tracking-wider text-center px-4">CSS Adjust<br/>Drag / Scroll</span>
                        </div>
                    </div>
                ) : (
                    <div className="text-slate-400 flex flex-col items-center">
                        <ImageIcon size={48} className="mb-2 opacity-50"/>
                        <span>No Image Selected</span>
                    </div>
                )}
            </div>

            {/* Fine Tune Controls */}
            <div className="space-y-4 bg-white p-4 rounded-lg shadow-sm">
                <div className="flex gap-2">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 flex items-center justify-center bg-church-600 text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-church-700 transition"
                    >
                        <Crop size={14} className="mr-2" /> Upload & Crop New
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileSelect}
                    />
                </div>
                
                <hr className="border-slate-100" />
                
                <div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">
                        <span>Fine Tune (CSS)</span>
                        <span>Existing Image</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-slate-500">X-Pos</label>
                            <input 
                                type="range" min="-100" max="200" 
                                value={formData.imagePositionX ?? 50} 
                                onChange={(e) => setFormData({...formData, imagePositionX: Number(e.target.value)})}
                                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500">Y-Pos</label>
                            <input 
                                type="range" min="-100" max="200" 
                                value={formData.imagePositionY ?? 0} 
                                onChange={(e) => setFormData({...formData, imagePositionY: Number(e.target.value)})}
                                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-500"
                            />
                        </div>
                    </div>
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
                className="w-full border border-slate-300 rounded p-2.5 text-xs text-slate-500"
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

      {/* --- CROP MODAL --- */}
      {isCropperOpen && cropImageSrc && (
          <div className="fixed inset-0 bg-black/80 z-[150] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
              <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full flex flex-col overflow-hidden">
                  <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2"><Crop size={18}/> Crop Profile Photo</h3>
                      <button onClick={() => setIsCropperOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                  </div>
                  
                  <div className="p-6 bg-slate-100 flex flex-col items-center">
                      <div 
                          className="relative w-64 h-64 bg-slate-300 rounded-full border-4 border-white shadow-xl overflow-hidden cursor-move touch-none"
                          onMouseDown={handleCropMouseDown}
                          onMouseMove={handleCropMouseMove}
                          onMouseUp={handleCropMouseUp}
                          onMouseLeave={handleCropMouseUp}
                          onTouchStart={handleCropMouseDown}
                          onTouchMove={handleCropMouseMove}
                          onTouchEnd={handleCropMouseUp}
                      >
                          <img 
                              ref={cropImageRef}
                              src={cropImageSrc} 
                              alt="Crop Target" 
                              className="absolute max-w-none origin-center pointer-events-none select-none"
                              style={{
                                  left: '50%',
                                  top: '50%',
                                  transform: `translate(-50%, -50%) translate(${cropPosition.x}px, ${cropPosition.y}px) scale(${cropScale})`
                              }}
                              draggable={false}
                          />
                      </div>
                      
                      <div className="w-full mt-6 space-y-4 px-4">
                          <div className="flex items-center gap-4">
                              <ZoomIn size={16} className="text-slate-500" />
                              <input 
                                  type="range" 
                                  min="0.5" 
                                  max="3" 
                                  step="0.05" 
                                  value={cropScale} 
                                  onChange={(e) => setCropScale(parseFloat(e.target.value))}
                                  className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-church-600"
                              />
                          </div>
                          <div className="flex justify-center">
                              <button onClick={() => { setCropScale(1); setCropPosition({x:0, y:0}); }} className="text-xs text-slate-500 flex items-center gap-1 hover:text-church-600">
                                  <RotateCcw size={12}/> Reset
                              </button>
                          </div>
                      </div>
                  </div>

                  <div className="p-4 bg-white border-t flex justify-end gap-2">
                      <button onClick={() => setIsCropperOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-50 rounded-lg">Cancel</button>
                      <button 
                          onClick={handleConfirmCrop} 
                          disabled={isUploading}
                          className="px-6 py-2 bg-church-600 text-white font-bold rounded-lg hover:bg-church-700 flex items-center gap-2 disabled:opacity-50"
                      >
                          {isUploading ? <Loader className="animate-spin" size={16}/> : <Check size={16}/>} 
                          {isUploading ? 'Uploading...' : 'Save & Use'}
                      </button>
                  </div>
              </div>
          </div>
      )}

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
