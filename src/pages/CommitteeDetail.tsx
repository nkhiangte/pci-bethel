import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Committee, 
  CommitteeMember, 
  CommitteeReport, 
  CommitteeImage,
  GalleryFolder,
  GalleryItem
} from '../types';
import { db, storage } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Users, 
  Calendar, 
  FileText, 
  Image as ImageIcon, 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash, 
  Save, 
  Loader, 
  X, 
  Camera,
  Download,
  ExternalLink,
  PlusCircle,
  FileDown
} from 'lucide-react';

// ─── Sub-components ──────────────────────────────────────────────────────────

interface ImagesPanelProps {
  committee: Committee & { images?: CommitteeImage[] };
  isAdmin: boolean;
  isOfflineMode: boolean;
  galleryFolders: GalleryFolder[];
  galleryItems: GalleryItem[];
  onAdd: (committeeId: string) => void;
  onDelete: (committeeId: string, imageId: string) => void;
}

const ImagesPanel: React.FC<ImagesPanelProps> = ({ 
  committee, 
  isAdmin, 
  isOfflineMode, 
  galleryFolders,
  galleryItems,
  onAdd, 
  onDelete 
}) => {
  const directImages: CommitteeImage[] = (committee as any).images || [];
  
  // Find linked gallery folder
  const linkedFolder = galleryFolders.find(f => f.name.toLowerCase() === committee.name.toLowerCase());
  const linkedImages = linkedFolder 
    ? galleryItems.filter(item => item.folderId === linkedFolder.id)
    : [];

  return (
    <div className="space-y-8">
      {/* Gallery Synced Images */}
      {linkedImages.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-church-600 uppercase tracking-wider">Synced from Gallery</h4>
              <span className="text-[10px] bg-church-100 text-church-700 px-2 py-0.5 rounded-full font-bold">Auto-Sync</span>
            </div>
            <Link 
              to={`/gallery/committees/${linkedFolder?.id}`}
              className="text-xs text-slate-500 hover:text-church-600 underline"
            >
              Manage in Gallery
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {linkedImages.map(img => (
              <div key={img.id} className="group relative aspect-square rounded-xl overflow-hidden bg-slate-200 shadow-sm border border-slate-100">
                <img 
                  src={img.imageUrl} 
                  alt={img.title || 'Gallery Image'} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-x-0 bottom-0 bg-black/60 p-3 translate-y-full group-hover:translate-y-0 transition-transform">
                  <p className="text-xs text-white line-clamp-2 leading-tight font-medium">{img.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Direct Uploads */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            {linkedImages.length > 0 ? 'Direct Committee Uploads' : 'Committee Images'}
          </h4>
          {isAdmin && !isOfflineMode && (
            <button 
              onClick={() => onAdd(committee.id)}
              className="text-xs font-semibold text-church-600 bg-church-100 px-3 py-1.5 rounded-lg hover:bg-church-200 flex items-center gap-1"
            >
              <Plus size={14} /> Add Image
            </button>
          )}
        </div>

        {directImages.length === 0 && linkedImages.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <ImageIcon size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">No images found for this committee.</p>
            {isAdmin && (
              <p className="text-xs text-church-600 mt-2">
                Upload directly here or create a folder named "{committee.name}" in the Gallery.
              </p>
            )}
          </div>
        ) : directImages.length === 0 && linkedImages.length > 0 ? (
          <p className="text-sm text-slate-400 italic text-center py-8 bg-white rounded-xl border border-slate-100">No direct uploads. All images are synced from Gallery.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {directImages.map(img => (
              <div key={img.id} className="group relative aspect-square rounded-xl overflow-hidden bg-slate-200 shadow-sm border border-slate-100">
                <img 
                  src={img.url} 
                  alt={img.caption || 'Committee Image'} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                {img.caption && (
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 p-3 translate-y-full group-hover:translate-y-0 transition-transform">
                    <p className="text-xs text-white line-clamp-2 leading-tight font-medium">{img.caption}</p>
                  </div>
                )}
                {isAdmin && !isOfflineMode && (
                  <button 
                    onClick={() => onDelete(committee.id, img.id)}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
                  >
                    <Trash size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface ReportsPanelProps {
  committee: Committee & { reports?: CommitteeReport[] };
  isAdmin: boolean;
  isOfflineMode: boolean;
  onAdd: (committeeId: string) => void;
  onEdit: (committeeId: string, report: CommitteeReport) => void;
  onDelete: (committeeId: string, reportId: string) => void;
}

const ReportsPanel: React.FC<ReportsPanelProps> = ({ committee, isAdmin, isOfflineMode, onAdd, onEdit, onDelete }) => {
  const reports: CommitteeReport[] = (committee as any).reports || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Reports & Documents</h4>
        {isAdmin && !isOfflineMode && (
          <button 
            onClick={() => onAdd(committee.id)}
            className="text-xs font-semibold text-church-600 bg-church-100 px-3 py-1.5 rounded-lg hover:bg-church-200 flex items-center gap-1"
          >
            <Plus size={14} /> Add Report
          </button>
        )}
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
          <FileText size={48} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm text-slate-500">No reports uploaded yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reports.map(report => (
            <div key={report.id} className="group flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-church-50 text-church-600 rounded-lg">
                  <FileText size={24} />
                </div>
                <div>
                  <h5 className="font-bold text-slate-800">{report.title}</h5>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar size={12} /> {report.date}
                    </span>
                    {report.type && (
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                        {report.type}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a 
                  href={report.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 text-church-600 hover:bg-church-50 rounded-lg transition-colors"
                  title="View/Download"
                >
                  <Download size={18} />
                </a>
                {isAdmin && !isOfflineMode && (
                  <>
                    <button 
                      onClick={() => onEdit(committee.id, report)}
                      className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => onDelete(committee.id, report.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Modals ──────────────────────────────────────────────────────────────────

interface ReportModalProps {
  committeeId: string;
  editingReport: CommitteeReport | null;
  onSave: (committeeId: string, report: CommitteeReport) => Promise<void>;
  onClose: () => void;
  loading: boolean;
}

const ReportModal: React.FC<ReportModalProps> = ({ committeeId, editingReport, onSave, onClose, loading }) => {
  const [title, setTitle] = useState(editingReport?.title || '');
  const [date, setDate] = useState(editingReport?.date || new Date().toISOString().split('T')[0]);
  const [type, setType] = useState(editingReport?.type || 'Monthly');
  const [url, setUrl] = useState(editingReport?.url || '');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || (!url && !file)) {
      alert('Please provide a title and either a file or a URL.');
      return;
    }

    setUploading(true);
    try {
      let finalUrl = url;
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const storagePath = `committees/${committeeId}/reports/${fileName}`;
        const storageRef = storage.ref().child(storagePath);
        await storageRef.put(file);
        finalUrl = await storageRef.getDownloadURL();
      }

      const report: CommitteeReport = {
        id: editingReport?.id || Date.now().toString(),
        title,
        date,
        type,
        url: finalUrl,
        uploadedAt: editingReport?.uploadedAt || new Date().toISOString(),
      };

      await onSave(committeeId, report);
    } catch (error) {
      console.error("Error saving report:", error);
      alert("Failed to save report.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">{editingReport ? 'Edit Report' : 'Add New Report'}</h3>
              <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Report Title</label>
                <input 
                  required 
                  className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-church-500 outline-none" 
                  placeholder="e.g., Finance Report - Oct 2026"
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Date</label>
                  <input 
                    type="date" 
                    required 
                    className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-church-500 outline-none" 
                    value={date} 
                    onChange={e => setDate(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Type</label>
                  <select 
                    className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-church-500 outline-none"
                    value={type}
                    onChange={e => setType(e.target.value)}
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Annual">Annual</option>
                    <option value="Special">Special</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">File Upload</label>
                <input 
                  type="file" 
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm" 
                  onChange={e => setFile(e.target.files?.[0] || null)} 
                />
                <p className="text-[10px] text-slate-400 mt-1">Upload PDF, Word, or Excel document.</p>
              </div>
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-4 text-xs text-slate-400 font-bold uppercase">OR</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">External URL</label>
                <input 
                  className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-church-500 outline-none" 
                  placeholder="https://..."
                  value={url} 
                  onChange={e => setUrl(e.target.value)} 
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 flex justify-end gap-3 px-6">
            <button type="button" onClick={onClose} className="px-6 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
            <button 
              type="submit" 
              disabled={loading || uploading}
              className="px-8 py-2.5 bg-church-600 text-white font-bold rounded-xl hover:bg-church-700 flex items-center gap-2 shadow-lg shadow-church-200 disabled:opacity-50 transition-all"
            >
              {loading || uploading ? <Loader className="animate-spin w-4 h-4" /> : <Save size={18} />}
              Save Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ImageModalProps {
  committeeId: string;
  onSave: (committeeId: string, image: CommitteeImage) => Promise<void>;
  onClose: () => void;
  loading: boolean;
}

const ImageModal: React.FC<ImageModalProps> = ({ committeeId, onSave, onClose, loading }) => {
  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    setFile(selectedFile);
    setImageUrl(''); // Clear URL if file is selected
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalUrl = imageUrl.trim();

    if (!finalUrl && !file) {
      alert('Please select an image or enter an image URL.');
      return;
    }

    setUploading(true);
    try {
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const storagePath = `committees/${committeeId}/images/${fileName}`;
        const storageRef = storage.ref().child(storagePath);
        
        const uploadTask = storageRef.put(file);
        
        finalUrl = await new Promise<string>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            null,
            (error) => reject(error),
            async () => {
              const url = await storageRef.getDownloadURL();
              resolve(url);
            }
          );
        });
      }

      const image: CommitteeImage = {
        id: Date.now().toString(),
        url: finalUrl,
        caption: caption.trim(),
        uploadedAt: new Date().toISOString(),
      };

      await onSave(committeeId, image);
    } catch (error) {
      console.error("Error saving image:", error);
      alert("Failed to save image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">Add Image</h3>
              <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* URL Input */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Image URL</label>
                <div className="flex gap-2">
                  <input 
                    className="flex-1 border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-church-500 outline-none" 
                    placeholder="Paste image URL here..." 
                    value={imageUrl}
                    onChange={e => {
                      setImageUrl(e.target.value);
                      if (e.target.value) {
                        setFile(null);
                        setPreview(e.target.value);
                      }
                    }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Paste a URL from the Gallery or any web image.</p>
              </div>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-4 text-xs text-slate-400 font-bold uppercase">OR</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* File Upload */}
              <div 
                onClick={() => fileRef.current?.click()}
                className="aspect-video border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-church-400 hover:bg-church-50 transition-all overflow-hidden relative"
              >
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera size={32} className="text-slate-400 mb-2" />
                    <p className="text-sm text-slate-500 font-medium">Click to upload image</p>
                  </>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <Loader className="animate-spin text-church-600" size={24} />
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Caption (Optional)</label>
                <input 
                  className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-church-500 outline-none" 
                  placeholder="Enter a brief caption..." 
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 flex justify-end gap-3 px-6">
            <button type="button" onClick={onClose} className="px-6 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
            <button 
              type="submit" 
              disabled={loading || uploading || (!file && !imageUrl.trim())}
              className="px-8 py-2.5 bg-church-600 text-white font-bold rounded-xl hover:bg-church-700 flex items-center gap-2 shadow-lg shadow-church-200 disabled:opacity-50 transition-all"
            >
              {loading || uploading ? <Loader className="animate-spin w-4 h-4" /> : <Save size={18} />}
              {imageUrl.trim() && !file ? 'Link Image' : 'Upload & Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Page Component ──────────────────────────────────────────────────────

const CommitteeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { t } = useLanguage();
  
  const [committee, setCommittee] = useState<Committee | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'activities' | 'images' | 'reports'>('members');

  // Gallery Sync Data
  const [galleryFolders, setGalleryFolders] = useState<GalleryFolder[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);

  // Modals
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<CommitteeMember | null>(null);
  
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<any>(null);
  
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<CommitteeReport | null>(null);
  
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id || !db) return;
    setLoading(true);
    try {
      // Fetch Gallery data for syncing
      const gFoldersSnap = await db.collection('gallery_folders').where('category', '==', 'Committees').get();
      setGalleryFolders(gFoldersSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })));

      const gItemsSnap = await db.collection('gallery').where('category', '==', 'Committees').get();
      setGalleryItems(gItemsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })));

      // Fetch Committee
      const doc = await db.collection('committees').doc(id).get();
      if (doc.exists) {
        const committeeData = { id: doc.id, ...doc.data() } as Committee;
        
        // Fetch subcollections
        const reportsSnap = await db.collection('committees').doc(id).collection('committeeReports').get();
        const reports = reportsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
        
        const imagesSnap = await db.collection('committees').doc(id).collection('committeeImages').get();
        const images = imagesSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
        
        setCommittee({ ...committeeData, reports, images } as any);
      } else {
        navigate('/committees');
      }
    } catch (error) {
      console.error("Error fetching committee:", error);
      setIsOfflineMode(true);
    }
    setLoading(false);
  }, [id, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !id || !editingMember) return;
    setLoading(true);
    try {
      const committeeRef = db.collection('committees').doc(id);
      const doc = await committeeRef.get();
      let members = (doc.data() as any).members || [];
      
      if (editingMember.id) {
        members = members.map((m: any) => m.id === editingMember.id ? editingMember : m);
      } else {
        members.push({ ...editingMember, id: Date.now().toString() });
      }
      
      await committeeRef.update({ members });
      setCommittee(prev => prev ? { ...prev, members } : null);
      setIsMemberModalOpen(false);
    } catch (error) { console.error("Error saving member:", error); }
    setLoading(false);
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!db || !id || !window.confirm("Delete this member?")) return;
    try {
      const committeeRef = db.collection('committees').doc(id);
      const doc = await committeeRef.get();
      const members = ((doc.data() as any).members || []).filter((m: any) => m.id !== memberId);
      await committeeRef.update({ members });
      setCommittee(prev => prev ? { ...prev, members } : null);
    } catch (error) { console.error("Error deleting member:", error); }
  };

  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !id || !editingActivity) return;
    setLoading(true);
    try {
      const committeeRef = db.collection('committees').doc(id);
      const doc = await committeeRef.get();
      let activities = (doc.data() as any).activities || [];
      
      if (editingActivity.id) {
        activities = activities.map((a: any) => a.id === editingActivity.id ? editingActivity : a);
      } else {
        activities.push({ ...editingActivity, id: Date.now().toString() });
      }
      
      await committeeRef.update({ activities });
      setCommittee(prev => prev ? { ...prev, activities } : null);
      setIsActivityModalOpen(false);
    } catch (error) { console.error("Error saving activity:", error); }
    setLoading(false);
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!db || !id || !window.confirm("Delete this activity?")) return;
    try {
      const committeeRef = db.collection('committees').doc(id);
      const doc = await committeeRef.get();
      const activities = ((doc.data() as any).activities || []).filter((a: any) => a.id !== activityId);
      await committeeRef.update({ activities });
      setCommittee(prev => prev ? { ...prev, activities } : null);
    } catch (error) { console.error("Error deleting activity:", error); }
  };

  const handleSaveReport = async (committeeId: string, report: CommitteeReport) => {
    if (!db) return;
    setLoading(true);
    try {
      const reportsRef = db.collection('committees').doc(committeeId).collection('committeeReports');
      await reportsRef.doc(report.id).set(report);
      
      const snap = await reportsRef.get();
      const reports = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      setCommittee(prev => prev ? { ...prev, reports } as any : null);
      setIsReportModalOpen(false);
    } catch (error) { console.error("Error saving report:", error); }
    setLoading(false);
  };

  const handleDeleteReport = async (committeeId: string, reportId: string) => {
    if (!db || !window.confirm("Delete this report?")) return;
    try {
      await db.collection('committees').doc(committeeId).collection('committeeReports').doc(reportId).delete();
      setCommittee(prev => {
        if (!prev) return null;
        const reports = ((prev as any).reports || []).filter((r: any) => r.id !== reportId);
        return { ...prev, reports } as any;
      });
    } catch (error) { console.error("Error deleting report:", error); }
  };

  const handleSaveImage = async (committeeId: string, image: CommitteeImage) => {
    if (!db) return;
    setLoading(true);
    try {
      const imagesRef = db.collection('committees').doc(committeeId).collection('committeeImages');
      await imagesRef.doc(image.id).set(image);
      
      const snap = await imagesRef.get();
      const images = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      setCommittee(prev => prev ? { ...prev, images } as any : null);
      setIsImageModalOpen(false);
    } catch (error) { console.error("Error saving image:", error); }
    setLoading(false);
  };

  const handleDeleteImage = async (committeeId: string, imageId: string) => {
    if (!db || !window.confirm("Delete this image?")) return;
    try {
      await db.collection('committees').doc(committeeId).collection('committeeImages').doc(imageId).delete();
      setCommittee(prev => {
        if (!prev) return null;
        const images = ((prev as any).images || []).filter((img: any) => img.id !== imageId);
        return { ...prev, images } as any;
      });
    } catch (error) { console.error("Error deleting image:", error); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader className="animate-spin text-church-600 w-12 h-12" />
      </div>
    );
  }

  if (!committee) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Banner */}
      <div className="bg-church-900 text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link to="/committees" className="inline-flex items-center text-church-200 hover:text-white mb-6 transition-colors">
            <ArrowLeft size={20} className="mr-2" /> Back to Committees
          </Link>
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl">
              <Users size={40} className="text-church-200" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight">{committee.name}</h1>
              <p className="text-church-200 mt-2 max-w-2xl text-lg">{committee.description || 'Dedicated to serving the church and community.'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 pb-20">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Tabs Navigation */}
          <div className="flex border-b border-slate-100 px-8 pt-4 gap-8 overflow-x-auto scrollbar-hide">
            {(
              [
                { key: 'members', label: 'Committee Members', icon: Users },
                { key: 'activities', label: 'Activities', icon: Calendar },
                { key: 'images', label: 'Gallery', icon: ImageIcon },
                { key: 'reports', label: 'Reports', icon: FileText },
              ] as const
            ).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`whitespace-nowrap pb-4 text-sm font-bold flex items-center gap-2 border-b-4 transition-all ${
                  activeTab === key
                    ? 'border-church-600 text-church-700'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>

          <div className="p-8 md:p-12">
            {/* Members Tab */}
            {activeTab === 'members' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-bold text-slate-800">Committee Members</h3>
                  {isAdmin && (
                    <button 
                      onClick={() => { setEditingMember({ name: '', role: '', phone: '' }); setIsMemberModalOpen(true); }}
                      className="flex items-center gap-2 px-4 py-2 bg-church-600 text-white rounded-xl hover:bg-church-700 transition-all shadow-lg shadow-church-100"
                    >
                      <PlusCircle size={18} /> Add Member
                    </button>
                  )}
                </div>
                
                {!committee.members || committee.members.length === 0 ? (
                  <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <Users size={48} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500">No members listed for this committee.</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {committee.members.map((member) => (
                      <div key={member.id} className="group p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all relative">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-lg font-bold text-slate-800">{member.name}</h4>
                            <p className="text-church-600 font-medium text-sm mt-1">{member.role}</p>
                            {member.phone && (
                              <p className="text-slate-500 text-xs mt-2 flex items-center gap-1">
                                <span className="opacity-50">📞</span> {member.phone}
                              </p>
                            )}
                          </div>
                          {isAdmin && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setEditingMember(member); setIsMemberModalOpen(true); }} className="p-2 text-church-600 hover:bg-church-50 rounded-lg"><Edit size={16} /></button>
                              <button onClick={() => handleDeleteMember(member.id!)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash size={16} /></button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Activities Tab */}
            {activeTab === 'activities' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-bold text-slate-800">Recent Activities</h3>
                  {isAdmin && (
                    <button 
                      onClick={() => { setEditingActivity({ title: '', description: '', date: '' }); setIsActivityModalOpen(true); }}
                      className="flex items-center gap-2 px-4 py-2 bg-church-600 text-white rounded-xl hover:bg-church-700 transition-all shadow-lg shadow-church-100"
                    >
                      <PlusCircle size={18} /> Add Activity
                    </button>
                  )}
                </div>

                {!(committee as any).activities || (committee as any).activities.length === 0 ? (
                  <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <Calendar size={48} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500">No activities recorded yet.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {(committee as any).activities.map((activity: any) => (
                      <div key={activity.id} className="group p-8 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center gap-6">
                        <div className="flex-shrink-0 w-16 h-16 bg-church-50 text-church-600 rounded-2xl flex flex-col items-center justify-center">
                          <span className="text-xs font-bold uppercase">{activity.date ? activity.date.split(' ')[0] : 'TBA'}</span>
                          <span className="text-xl font-black">{activity.date ? activity.date.split(' ')[1] : ''}</span>
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xl font-bold text-slate-800">{activity.title}</h4>
                            <span className="text-sm text-slate-400 font-medium">{activity.date}</span>
                          </div>
                          <p className="text-slate-600 mt-2 leading-relaxed">{activity.description}</p>
                        </div>
                        {isAdmin && (
                          <div className="flex md:flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingActivity(activity); setIsActivityModalOpen(true); }} className="p-2 text-church-600 hover:bg-church-50 rounded-lg"><Edit size={18} /></button>
                            <button onClick={() => handleDeleteActivity(activity.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash size={18} /></button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Images Tab */}
            {activeTab === 'images' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <ImagesPanel 
                  committee={committee as any}
                  isAdmin={isAdmin}
                  isOfflineMode={isOfflineMode}
                  galleryFolders={galleryFolders}
                  galleryItems={galleryItems}
                  onAdd={() => setIsImageModalOpen(true)}
                  onDelete={handleDeleteImage}
                />
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <ReportsPanel
                  committee={committee as any}
                  isAdmin={isAdmin}
                  isOfflineMode={isOfflineMode}
                  onAdd={() => { setEditingReport(null); setIsReportModalOpen(true); }}
                  onEdit={(cid, report) => { setEditingReport(report); setIsReportModalOpen(true); }}
                  onDelete={handleDeleteReport}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <form onSubmit={handleSaveMember}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-800">{editingMember?.id ? 'Edit Member' : 'Add Member'}</h3>
                  <button type="button" onClick={() => setIsMemberModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                    <input required className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-church-500 outline-none" value={editingMember?.name || ''} onChange={e => setEditingMember({...editingMember!, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Role</label>
                    <input required className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-church-500 outline-none" value={editingMember?.role || ''} onChange={e => setEditingMember({...editingMember!, role: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Phone (Optional)</label>
                    <input className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-church-500 outline-none" value={editingMember?.phone || ''} onChange={e => setEditingMember({...editingMember!, phone: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-slate-50 flex justify-end gap-3 px-6">
                <button type="button" onClick={() => setIsMemberModalOpen(false)} className="px-6 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={loading} className="px-8 py-2.5 bg-church-600 text-white font-bold rounded-xl hover:bg-church-700 flex items-center gap-2 shadow-lg shadow-church-200 disabled:opacity-50 transition-all">
                  {loading ? <Loader className="animate-spin w-4 h-4" /> : <Save size={18} />} Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isActivityModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <form onSubmit={handleSaveActivity}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-800">{editingActivity?.id ? 'Edit Activity' : 'Add Activity'}</h3>
                  <button type="button" onClick={() => setIsActivityModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Title</label>
                    <input required className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-church-500 outline-none" value={editingActivity?.title || ''} onChange={e => setEditingActivity({...editingActivity!, title: e.target.value})} placeholder="e.g., Annual Retreat" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Date (Optional)</label>
                    <input type="text" className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-church-500 outline-none" value={editingActivity?.date || ''} onChange={e => setEditingActivity({...editingActivity!, date: e.target.value})} placeholder="e.g., October 15, 2026" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                    <textarea required className="w-full border border-slate-300 rounded-xl p-3 h-32 focus:ring-2 focus:ring-church-500 outline-none" value={editingActivity?.description || ''} onChange={e => setEditingActivity({...editingActivity!, description: e.target.value})} placeholder="Details about the activity..."></textarea>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-slate-50 flex justify-end gap-3 px-6">
                <button type="button" onClick={() => setIsActivityModalOpen(false)} className="px-6 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" disabled={loading} className="px-8 py-2.5 bg-church-600 text-white font-bold rounded-xl hover:bg-church-700 flex items-center gap-2 shadow-lg shadow-church-200 disabled:opacity-50 transition-all">
                  {loading ? <Loader className="animate-spin w-4 h-4" /> : <Save size={18} />} Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isReportModalOpen && (
        <ReportModal
          committeeId={id!}
          editingReport={editingReport}
          onSave={handleSaveReport}
          onClose={() => setIsReportModalOpen(false)}
          loading={loading}
        />
      )}

      {isImageModalOpen && (
        <ImageModal 
          committeeId={id!}
          onSave={handleSaveImage}
          onClose={() => setIsImageModalOpen(false)}
          loading={loading}
        />
      )}
    </div>
  );
};

export default CommitteeDetail;
