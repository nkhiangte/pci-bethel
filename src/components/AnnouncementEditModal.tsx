import React, { useState, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Announcement } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { X, Save, Loader, Trash2, Type, Youtube, PlusCircle, Upload } from 'lucide-react';

const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    ['link', 'blockquote', 'code-block'],
    ['clean']
  ],
  clipboard: {
    matchVisual: false,
  }
};

const quillFormats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet',
  'link', 'blockquote', 'code-block'
];

const IMGBB_API_KEY = '7939507abc655d09649cc02e47dc9d49';

const getYouTubeId = (url: string | undefined) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

interface AnnouncementEditModalProps {
  isOpen: boolean;
  initialData?: Partial<Announcement>;
  categories: string[];
  onClose: () => void;
  onSave: (data: Partial<Announcement>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const AnnouncementEditModal: React.FC<AnnouncementEditModalProps> = ({
  isOpen,
  initialData,
  categories,
  onClose,
  onSave,
  onDelete
}) => {
  const { t } = useLanguage();
  const [form, setForm] = useState<Partial<Announcement>>({
    title: initialData?.title || '',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    category: initialData?.category || (categories[0] || 'General'),
    content: initialData?.content || '',
    imageUrls: initialData?.imageUrls || (initialData?.imageUrl ? [initialData.imageUrl] : []),
    imageCaptions: initialData?.imageCaptions || [],
    videoUrls: initialData?.videoUrls || (initialData?.videoUrl ? [initialData.videoUrl] : []),
    id: initialData?.id
  });

  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      const newUrls: string[] = [];
      const newCaps: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();
        if (result.success) {
          newUrls.push(result.data.url);
          newCaps.push('');
        } else {
          console.error("Image upload failed for a file:", result.error?.message);
        }
      }

      setForm(prev => ({ 
        ...prev, 
        imageUrls: [...(prev.imageUrls || []), ...newUrls],
        imageCaptions: [...(prev.imageCaptions || []), ...newCaps]
      }));
      
    } catch (error) {
      console.error("Upload error:", error);
      alert("Error connecting to image server.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const updateCaption = (index: number, text: string) => {
    const newCaptions = [...(form.imageCaptions || [])];
    while (newCaptions.length <= index) newCaptions.push('');
    newCaptions[index] = text;
    setForm({ ...form, imageCaptions: newCaptions });
  };

  const removeImageAt = (index: number) => {
    setForm(prev => ({
      ...prev,
      imageUrls: prev.imageUrls?.filter((_, i) => i !== index),
      imageCaptions: prev.imageCaptions?.filter((_, i) => i !== index)
    }));
  };

  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) return;
    try {
      new URL(newImageUrl);
    } catch (e) {
      alert("Please enter a valid URL");
      return;
    }

    setForm(prev => ({
      ...prev,
      imageUrls: [...(prev.imageUrls || []), newImageUrl.trim()],
      imageCaptions: [...(prev.imageCaptions || []), '']
    }));
    setNewImageUrl('');
  };

  const handleAddVideo = () => {
    if (!newVideoUrl.trim()) return;
    const vidId = getYouTubeId(newVideoUrl);
    if (!vidId) {
      alert(t.announcements.validation.video);
      return;
    }
    setForm(prev => ({
      ...prev,
      videoUrls: [...(prev.videoUrls || []), newVideoUrl.trim()]
    }));
    setNewVideoUrl('');
  };

  const removeVideoAt = (index: number) => {
    setForm(prev => ({
      ...prev,
      videoUrls: prev.videoUrls?.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!form.title?.trim()) {
      alert("Please enter a title");
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (error) {
      console.error("Error saving announcement:", error);
      alert(t.announcements.validation.saveFail);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!form.id || !onDelete) return;
    setSaving(true);
    try {
      await onDelete(form.id);
      onClose();
    } catch (error) {
      console.error("Error deleting announcement:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-church-50">
          <h3 className="text-xl font-bold text-church-900">
            {form.id ? t.announcements.editAnnouncement : t.announcements.newAnnouncement}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">{t.announcements.form.title}</label>
            <input 
              className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-church-500 transition" 
              value={form.title || ''} 
              onChange={e => setForm({...form, title: e.target.value})}
              placeholder={t.announcements.form.placeholders.title}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">{t.announcements.form.date}</label>
              <input 
                type="date"
                className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-church-500 transition" 
                value={form.date || ''} 
                onChange={e => setForm({...form, date: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">{t.announcements.form.category}</label>
              <select 
                className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-church-500 transition" 
                value={form.category} 
                onChange={e => setForm({...form, category: e.target.value})}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'General' ? t.announcements.categories.general :
                     cat === 'Sunna' ? t.announcements.categories.sunna :
                     cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Videos Section */}
          <div className="space-y-3 p-4 bg-red-50/50 rounded-xl border border-red-100">
            <label className="block text-sm font-bold text-red-900 flex items-center gap-2">
              <Youtube size={18} className="text-red-500" /> {t.announcements.form.videos}
            </label>
            
            <div className="space-y-2">
              {form.videoUrls?.map((url, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-red-100 shadow-sm">
                  <div className="w-10 h-7 shrink-0 bg-slate-900 rounded overflow-hidden">
                    <img src={`https://img.youtube.com/vi/${getYouTubeId(url)}/0.jpg`} className="w-full h-full object-cover" alt="Thumb" />
                  </div>
                  <span className="flex-1 text-[11px] font-mono text-slate-500 truncate">{url}</span>
                  <button onClick={() => removeVideoAt(idx)} className="p-1.5 text-red-500 hover:bg-red-50 rounded">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input 
                className="flex-1 border border-red-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-red-400" 
                value={newVideoUrl} 
                onChange={e => setNewVideoUrl(e.target.value)}
                placeholder={t.announcements.form.placeholders.video}
                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddVideo())}
              />
              <button 
                type="button"
                onClick={handleAddVideo}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs font-bold transition shadow-sm flex items-center gap-2 shrink-0"
              >
                <PlusCircle size={16} /> {t.announcements.form.addLink}
              </button>
            </div>
          </div>
          
          {/* Images Section */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-700">{t.announcements.form.pictures}</label>
            
            <div className="grid grid-cols-1 gap-4 mb-3">
              {form.imageUrls?.map((url, index) => (
                <div key={index} className="flex gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-white">
                    <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <button 
                      type="button"
                      onClick={() => removeImageAt(index)} 
                      className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-lg"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <Type size={12} /> {t.announcements.form.placeholders.caption} {index + 1}
                    </div>
                    <textarea 
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-church-400 outline-none resize-none h-14"
                      placeholder={t.announcements.form.placeholders.caption}
                      value={form.imageCaptions?.[index] || ''}
                      onChange={(e) => updateCaption(index, e.target.value)}
                    />
                  </div>
                </div>
              ))}
              
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <input 
                    className="flex-1 border border-slate-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-church-500" 
                    value={newImageUrl} 
                    onChange={e => setNewImageUrl(e.target.value)}
                    placeholder={t.announcements.form.placeholders.imageUrl}
                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddImageUrl())}
                  />
                  <button 
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-4 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 text-xs font-bold transition shadow-sm flex items-center gap-2 shrink-0"
                  >
                    <PlusCircle size={16} /> {t.announcements.form.addUrl}
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200"></span></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold tracking-widest">or</span></div>
                </div>

                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="h-16 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:text-church-600 hover:border-church-300 transition bg-slate-50"
                >
                  {uploadingImage ? (
                    <Loader className="animate-spin" size={24} />
                  ) : (
                    <>
                      <Upload size={20} className="mb-1" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{t.announcements.form.addPhotos}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleImageUpload} 
              className="hidden" 
              accept="image/*"
              multiple
            />
            
            {uploadingImage && (
              <p className="text-[10px] text-church-600 font-bold uppercase tracking-widest animate-pulse">Uploading to ImgBB...</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">{t.announcements.form.content}</label>
            <div className="bg-white rounded-lg border border-slate-300">
              <ReactQuill 
                theme="snow" 
                value={form.content || ''} 
                onChange={(content) => setForm(prev => ({ ...prev, content }))}
                placeholder={t.announcements.form.placeholders.content}
                modules={quillModules}
                formats={quillFormats}
                className="h-64 mb-12"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            {form.id && onDelete && (
              <button 
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 font-bold text-xs transition"
              >
                {t.announcements.deleteConfirm}
              </button>
            )}
          </div>
          <div className="flex space-x-3">
            <button 
              type="button"
              onClick={onClose} 
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-white font-medium transition text-sm"
            >
              {t.announcements.cancel}
            </button>
            <button 
              type="button"
              onClick={handleSubmit} 
              disabled={saving}
              className="px-6 py-2 bg-church-600 text-white rounded-lg hover:bg-church-700 font-bold transition shadow-sm text-sm flex items-center gap-2"
            >
              {saving ? <Loader className="animate-spin" size={16} /> : <Save size={16} />}
              {t.announcements.savePost}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Popup */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h4 className="text-lg font-bold text-slate-900 mb-2">{t.announcements.deleteTitle}</h4>
            <p className="text-sm text-slate-600 mb-6">{t.announcements.deleteSub}</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg text-xs"
              >
                {t.announcements.cancel}
              </button>
              <button 
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 text-xs"
              >
                {t.announcements.deleteConfirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementEditModal;
