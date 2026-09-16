import React, { useState } from 'react';
import { X, Copy, Check, Share2, Mail, ExternalLink, MessageCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export interface ShareData {
  title: string;
  url?: string;
  text?: string;
  author?: string;
  date?: string;
  category?: string;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ShareData;
}

// Crisp official vector icons
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 012.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 01-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.24-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.71 4.3 3.79.6.26 1.07.41 1.44.53.61.19 1.16.17 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.3z" />
  </svg>
);

const FacebookIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const XTwitterIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const TelegramIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
  </svg>
);

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, data }) => {
  const { language } = useLanguage();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const targetUrl = data.url || window.location.href;
  const shareTitle = data.title || "Champhai Bethel Kohhran";
  const shareSnippet = data.text ? data.text.slice(0, 140) + '...' : '';

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(targetUrl);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = targetUrl;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleWhatsApp = () => {
    const text = `*${shareTitle}*${data.author ? `\n_By ${data.author}_` : ''}\n\n${targetUrl}\n\nChamphai Bethel Kohhran`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(targetUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500');
  };

  const handleTwitter = () => {
    const text = `${shareTitle} - Champhai Bethel Kohhran`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(targetUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=450');
  };

  const handleTelegram = () => {
    const text = `${shareTitle} - Champhai Bethel Kohhran`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(targetUrl)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`${shareTitle} - Champhai Bethel Kohhran`);
    const body = encodeURIComponent(`${shareTitle}\n\n${shareSnippet}\n\nChhiar chhunzawmna link:\n${targetUrl}\n\nChamphai Bethel Kohhran`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: data.text || shareTitle,
          url: targetUrl,
        });
      } catch (err) {
        if ((err as Error)?.name !== 'AbortError') {
          console.error("Native share error:", err);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-church-900 via-church-800 to-church-950 text-white p-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-church-200 backdrop-blur-sm border border-white/10">
                <Share2 size={18} />
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-white leading-tight">
                  {language === 'en' ? 'Share Article' : 'Thuziak Thehdarh / Insem'}
                </h3>
                <p className="text-xs text-church-200/80 mt-0.5">
                  {language === 'en' ? 'Choose where you want to share' : 'Khawiah nge i thehdarh duh thlang rawh'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Target Article Summary */}
          <div className="mt-4 p-3.5 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-md">
            {data.category && (
              <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-church-500/80 text-white mb-1.5">
                {data.category}
              </span>
            )}
            <p className="text-sm font-bold text-white line-clamp-2 leading-snug">
              {data.title}
            </p>
            {(data.author || data.date) && (
              <p className="text-[11px] text-church-200/90 mt-1 flex items-center gap-2">
                {data.author && <span>By {data.author}</span>}
                {data.author && data.date && <span>•</span>}
                {data.date && <span>{data.date}</span>}
              </p>
            )}
          </div>
        </div>

        {/* Share Options Grid */}
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-3">
              {language === 'en' ? 'Share to Social Media & Chat' : 'Social Media & Message-a thehdarhna'}
            </label>
            <div className="grid grid-cols-4 gap-3 text-center">
              {/* WhatsApp */}
              <button
                type="button"
                onClick={handleWhatsApp}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/70 transition-all hover:scale-105 active:scale-95 group shadow-2xs"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shadow-sm group-hover:shadow-md transition">
                  <WhatsAppIcon className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-800">WhatsApp</span>
              </button>

              {/* Facebook */}
              <button
                type="button"
                onClick={handleFacebook}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/70 transition-all hover:scale-105 active:scale-95 group shadow-2xs"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#1877F2] text-white flex items-center justify-center shadow-sm group-hover:shadow-md transition">
                  <FacebookIcon className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-800">Facebook</span>
              </button>

              {/* X / Twitter */}
              <button
                type="button"
                onClick={handleTwitter}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all hover:scale-105 active:scale-95 group shadow-2xs"
              >
                <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shadow-sm group-hover:shadow-md transition">
                  <XTwitterIcon className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">X (Twitter)</span>
              </button>

              {/* Telegram */}
              <button
                type="button"
                onClick={handleTelegram}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200/70 transition-all hover:scale-105 active:scale-95 group shadow-2xs"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#229ED9] text-white flex items-center justify-center shadow-sm group-hover:shadow-md transition">
                  <TelegramIcon className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-800">Telegram</span>
              </button>
            </div>
          </div>

          {/* Secondary Actions: Native Share / Email */}
          <div className="flex gap-2">
            {hasNativeShare && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-church-50 text-church-800 hover:bg-church-100 border border-church-200 text-xs font-bold transition shadow-2xs"
              >
                <Share2 size={16} className="text-church-600" />
                <span>{language === 'en' ? 'More Apps (System Share)' : 'App dang zawng zawng'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleEmail}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 text-xs font-bold transition shadow-2xs ${hasNativeShare ? '' : 'w-full'}`}
            >
              <Mail size={16} className="text-slate-500" />
              <span>Email</span>
            </button>
          </div>

          {/* Copy Link Section */}
          <div className="pt-4 border-t border-slate-100">
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
              {language === 'en' ? 'Copy Article Link' : 'Thuziak Link Copy-na'}
            </label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-2xl focus-within:ring-2 focus-within:ring-church-500 focus-within:border-church-500 transition">
              <input
                type="text"
                readOnly
                value={targetUrl}
                className="w-full bg-transparent px-3 py-1.5 text-xs text-slate-600 font-mono outline-none truncate select-all"
                onFocus={(e) => e.target.select()}
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 ${
                  copied
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-church-600 text-white hover:bg-church-700'
                }`}
              >
                {copied ? (
                  <>
                    <Check size={14} className="stroke-[3]" />
                    <span>{language === 'en' ? 'Copied!' : 'Copy ta!'}</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>{language === 'en' ? 'Copy Link' : 'Copy Rawh'}</span>
                  </>
                )}
              </button>
            </div>
            {copied && (
              <p className="text-[11px] text-emerald-600 font-medium mt-1.5 flex items-center gap-1">
                <Check size={12} className="stroke-[3]" />
                <span>{language === 'en' ? 'Link copied! You can paste and share it anywhere.' : 'Link copy a ni ta! WhatsApp emaw khawiah pawh paste theih a ni e.'}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
