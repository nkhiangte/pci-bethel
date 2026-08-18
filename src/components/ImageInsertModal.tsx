import React, { useState, useRef } from 'react';
import { 
  X, Image as ImageIcon, Upload, Link as LinkIcon, 
  Check, Loader, Sparkles, AlignCenter, AlignLeft, AlignRight, Maximize2 
} from 'lucide-react';
import { uploadImageToHosting } from '../utils/imageUtils';

interface ImageInsertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertImage: (htmlSnippet: string) => void;
}

export const ImageInsertModal: React.FC<ImageInsertModalProps> = ({
  isOpen,
  onClose,
  onInsertImage
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [altText, setAltText] = useState('');
  const [alignment, setAlignment] = useState<'center' | 'full' | 'left' | 'right'>('center');
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    setIsUploading(true);
    try {
      const uploadedUrl = await uploadImageToHosting(file);
      setImageUrl(uploadedUrl);
      setPreviewUrl(uploadedUrl);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleInsert = () => {
    const finalUrl = imageUrl || previewUrl;
    if (!finalUrl) return;

    let style = '';
    let containerClass = 'my-6';

    if (alignment === 'full') {
      style = 'width: 100%; height: auto; display: block; border-radius: 1rem; margin: 1.5rem 0;';
    } else if (alignment === 'center') {
      style = 'max-width: 85%; height: auto; display: block; margin: 1.5rem auto; border-radius: 1rem;';
      containerClass = 'my-6 text-center';
    } else if (alignment === 'left') {
      style = 'max-width: 45%; height: auto; float: left; margin: 0.5rem 1.5rem 1rem 0; border-radius: 0.75rem;';
      containerClass = 'my-4 overflow-hidden';
    } else if (alignment === 'right') {
      style = 'max-width: 45%; height: auto; float: right; margin: 0.5rem 0 1rem 1.5rem; border-radius: 0.75rem;';
      containerClass = 'my-4 overflow-hidden';
    }

    const alt = altText.trim() || caption.trim() || 'Church Photograph';
    
    let htmlSnippet = `<div class="${containerClass}" style="clear: both;">`;
    htmlSnippet += `<img src="${finalUrl}" alt="${alt}" style="${style} box-shadow: 0 4px 14px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;" class="church-inserted-image" />`;
    if (caption.trim()) {
      htmlSnippet += `<p class="text-xs text-slate-500 italic mt-2 text-center" style="font-size: 0.85rem; color: #64748b; font-style: italic; text-align: center; margin-top: 0.5rem;">${caption.trim()}</p>`;
    }
    htmlSnippet += `</div><p><br/></p>`;

    onInsertImage(htmlSnippet);
    onClose();
    // Reset
    setImageUrl('');
    setPreviewUrl('');
    setCaption('');
    setAltText('');
  };

  return (
    <div className="fixed inset-0 z-[160] bg-black/75 flex items-center justify-center p-3 sm:p-5 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-church-500/20 border border-church-400/30 text-church-300 flex items-center justify-center">
              <ImageIcon size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Insert Image in Content</h3>
              <p className="text-xs text-slate-300">Place an image at your exact cursor position or in a paragraph</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'upload' ? 'bg-white text-church-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Upload size={14} />
              <span>Upload from Device</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'url' ? 'bg-white text-church-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LinkIcon size={14} />
              <span>Image Web Link</span>
            </button>
          </div>

          {/* Upload Section */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/*" 
                onChange={handleFileChange} 
                className="hidden" 
              />

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-church-500 bg-slate-50 hover:bg-church-50/50 p-6 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition text-center group"
              >
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <Loader size={28} className="animate-spin text-church-600" />
                    <p className="text-xs font-bold text-church-700">Uploading & Optimizing image...</p>
                  </div>
                ) : previewUrl ? (
                  <div className="relative group max-h-48 overflow-hidden rounded-xl">
                    <img src={previewUrl} alt="Preview" className="max-h-44 object-contain rounded-lg" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition rounded-lg">
                      Click to change photo
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-white text-church-600 shadow-xs flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <Upload size={22} />
                    </div>
                    <p className="text-xs font-bold text-slate-700">Click to browse or drag photo here</p>
                    <p className="text-[11px] text-slate-400 mt-1">PNG, JPG, WebP, GIF up to 10MB</p>
                  </>
                )}
              </div>
              <p className="text-[11px] text-slate-400 italic text-center">
                💡 Tip: You can also copy any screenshot (Ctrl+C) and press <strong>Ctrl+V</strong> right inside the editor!
              </p>
            </div>
          )}

          {/* URL Section */}
          {activeTab === 'url' && (
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">
                Image Web Link (URL)
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={e => {
                  setImageUrl(e.target.value);
                  setPreviewUrl(e.target.value);
                }}
                placeholder="https://example.com/photo.jpg"
                className="w-full border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-church-500 outline-none text-xs font-medium text-slate-800"
              />
              {previewUrl && (
                <div className="mt-3 p-2 bg-slate-50 rounded-xl border border-slate-200 flex justify-center">
                  <img src={previewUrl} alt="Preview" className="max-h-32 object-contain rounded-lg" />
                </div>
              )}
            </div>
          )}

          {/* Caption & Alignment */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">
                Caption / Description (Optional)
              </label>
              <input
                type="text"
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="e.g. Biak In Sak Hnathawh Lai (2014)"
                className="w-full border border-slate-200 px-3 py-2 rounded-xl focus:ring-2 focus:ring-church-500 outline-none text-xs font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">
                Layout / Alignment
              </label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setAlignment('center')}
                  className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                    alignment === 'center' ? 'border-church-500 bg-church-50 text-church-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <AlignCenter size={16} />
                  <span>Center</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAlignment('full')}
                  className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                    alignment === 'full' ? 'border-church-500 bg-church-50 text-church-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Maximize2 size={16} />
                  <span>Full Width</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAlignment('left')}
                  className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                    alignment === 'left' ? 'border-church-500 bg-church-50 text-church-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <AlignLeft size={16} />
                  <span>Left Wrap</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAlignment('right')}
                  className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                    alignment === 'right' ? 'border-church-500 bg-church-50 text-church-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <AlignRight size={16} />
                  <span>Right Wrap</span>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 font-bold hover:bg-white rounded-xl border border-slate-200 text-xs transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={(!imageUrl && !previewUrl) || isUploading}
            onClick={handleInsert}
            className="px-5 py-2 bg-church-600 hover:bg-church-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition"
          >
            <Check size={16} />
            <span>Insert Image</span>
          </button>
        </div>

      </div>
    </div>
  );
};
