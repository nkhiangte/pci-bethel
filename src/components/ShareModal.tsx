import React, { useState } from 'react';
import { X, Copy, Check, Share2, Mail, ExternalLink, MessageCircle, FileText, Smartphone } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useLanguage } from '../contexts/LanguageContext';
import {
  extractFirstImage,
  extractAtLeastTwoSentences,
  generateShareMessage,
  getPublicShareUrl,
  performNativeShare,
  DEFAULT_CHURCH_LOGO
} from '../utils/shareUtils';

export interface ShareData {
  title: string;
  url?: string;
  text?: string;
  content?: string;
  imageUrl?: string;
  image?: string;
  imageUrls?: string[];
  images?: string[];
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
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen) return null;

  // Guarantee clean public production URL (e.g. https://www.cpibethel.com/...)
  const targetUrl = getPublicShareUrl(data.url);
  const shareTitle = data.title || "Champhai Bethel Kohhran";

  // 1. Extract thumbnail: embedded image if present on the article, otherwise use church logo
  const { url: thumbnailUrl, isLogo: isChurchLogo } = extractFirstImage(data);

  // 2. Extract at least two sentences of the article
  const shareExcerpt = extractAtLeastTwoSentences(data.content || data.text);

  // 3. Generate standardized share text with 2 sentences and read more link
  const fullShareMessage = generateShareMessage({
    title: shareTitle,
    author: data.author,
    excerpt: shareExcerpt,
    targetUrl,
    language,
  });

  const copyToClipboard = async (text: string, isTextOnly: boolean) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      if (isTextOnly) {
        setCopiedText(true);
        setTimeout(() => setCopiedText(false), 2500);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleCopyLink = () => copyToClipboard(targetUrl, false);
  const handleCopyFullMessage = () => copyToClipboard(fullShareMessage, true);

  const handleWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullShareMessage)}`;
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      window.location.href = url;
    }
  };

  const handleFacebook = () => {
    const quote = `${shareTitle}\n\n${shareExcerpt}\n\nRead more: ${targetUrl}`;
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(targetUrl)}&quote=${encodeURIComponent(quote)}`;
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500');
  };

  const handleTwitter = () => {
    const tweetSnippet = shareExcerpt.length > 140 ? `${shareExcerpt.slice(0, 140)}...` : shareExcerpt;
    const tweetText = `${shareTitle}\n\n"${tweetSnippet}"\n\nRead more:`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(targetUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=450');
  };

  const handleTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(targetUrl)}&text=${encodeURIComponent(fullShareMessage)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`${shareTitle} - Champhai Bethel Kohhran`);
    const body = encodeURIComponent(fullShareMessage);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleNativeShare = async () => {
    const success = await performNativeShare({
      title: shareTitle,
      text: fullShareMessage,
      url: targetUrl,
      dialogTitle: shareTitle,
    });
    if (!success) {
      handleCopyFullMessage();
    }
  };

  const isNativeApp = Capacitor.isNativePlatform();

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden text-slate-800 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Article Summary & Thumbnail */}
        <div className="bg-gradient-to-br from-church-950 via-church-900 to-church-850 text-white p-5 sm:p-6 shrink-0 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-church-200 backdrop-blur-sm border border-white/10 shadow-xs">
                <Share2 size={18} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-serif font-bold text-white leading-tight">
                  {language === 'en' ? 'Share Article' : 'Thuziak Thehdarh / Insem'}
                </h3>
                <p className="text-xs text-church-200/80 mt-0.5">
                  {language === 'en' ? 'Choose where you want to share' : 'Social media leh chhungte hnenah insem rawh'}
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

          {/* Target Article Summary with Thumbnail */}
          <div className="p-3 sm:p-3.5 bg-white/10 rounded-2xl border border-white/15 backdrop-blur-md">
            <div className="flex items-start gap-3">
              {/* Thumbnail (embedded article image or church logo) */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 bg-white/15 border border-white/20 flex items-center justify-center shadow-inner">
                <img
                  src={thumbnailUrl}
                  alt={data.title}
                  className={`w-full h-full ${isChurchLogo ? 'object-contain p-2' : 'object-cover'} transition-transform duration-300 hover:scale-105`}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== DEFAULT_CHURCH_LOGO) {
                      target.src = DEFAULT_CHURCH_LOGO;
                      target.className = 'w-full h-full object-contain p-2';
                    }
                  }}
                />
                <span className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs text-[8.5px] text-center text-white/95 py-0.5 font-medium truncate px-1">
                  {isChurchLogo ? (language === 'en' ? 'Church Logo' : 'Kohhran Logo') : (language === 'en' ? 'Article Image' : 'Thuziak Thlalak')}
                </span>
              </div>

              {/* Title & Metadata */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  {data.category && (
                    <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-church-500/80 text-white">
                      {data.category}
                    </span>
                  )}
                  {data.date && (
                    <span className="text-[10px] text-church-200/80">
                      {data.date}
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-white line-clamp-2 leading-snug">
                  {shareTitle}
                </h4>

                {data.author && (
                  <p className="text-[11px] text-church-200/90 mt-0.5 truncate">
                    By {data.author}
                  </p>
                )}
              </div>
            </div>

            {/* Two Sentences Excerpt Preview */}
            {shareExcerpt && (
              <div className="mt-2.5 pt-2.5 border-t border-white/10 text-xs text-church-100/95 leading-relaxed bg-black/20 px-3 py-2 rounded-xl">
                <p className="italic line-clamp-2">
                  "{shareExcerpt}"
                </p>
                <div className="mt-1 flex items-center justify-between text-[10px] text-church-200/90 not-italic font-medium">
                  <span className="text-emerald-300 flex items-center gap-1">
                    <Check size={11} className="stroke-[3]" />
                    {language === 'en' ? '2 sentences included' : 'Thuziak thu tawi telh a ni'}
                  </span>
                  <span className="underline opacity-90 truncate max-w-[170px]">
                    {language === 'en' ? 'Read more & link added' : 'Chhiar zawmna link nen'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Share Options Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* Social Media Grid */}
          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2.5">
              {language === 'en' ? 'Direct Social Media Sharing' : 'Social Media Thehdarhna'}
            </label>
            <div className="grid grid-cols-4 gap-2.5 sm:gap-3 text-center">
              {/* WhatsApp */}
              <button
                type="button"
                onClick={handleWhatsApp}
                className="flex flex-col items-center gap-2 p-2.5 sm:p-3 rounded-2xl bg-emerald-50/80 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/70 transition-all hover:scale-105 active:scale-95 group shadow-2xs"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shadow-sm group-hover:shadow-md transition">
                  <WhatsAppIcon className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-800">WhatsApp</span>
              </button>

              {/* Facebook */}
              <button
                type="button"
                onClick={handleFacebook}
                className="flex flex-col items-center gap-2 p-2.5 sm:p-3 rounded-2xl bg-blue-50/80 hover:bg-blue-100 text-blue-700 border border-blue-200/70 transition-all hover:scale-105 active:scale-95 group shadow-2xs"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#1877F2] text-white flex items-center justify-center shadow-sm group-hover:shadow-md transition">
                  <FacebookIcon className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-800">Facebook</span>
              </button>

              {/* X / Twitter */}
              <button
                type="button"
                onClick={handleTwitter}
                className="flex flex-col items-center gap-2 p-2.5 sm:p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all hover:scale-105 active:scale-95 group shadow-2xs"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-black text-white flex items-center justify-center shadow-sm group-hover:shadow-md transition">
                  <XTwitterIcon className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">X (Twitter)</span>
              </button>

              {/* Telegram */}
              <button
                type="button"
                onClick={handleTelegram}
                className="flex flex-col items-center gap-2 p-2.5 sm:p-3 rounded-2xl bg-sky-50/80 hover:bg-sky-100 text-sky-700 border border-sky-200/70 transition-all hover:scale-105 active:scale-95 group shadow-2xs"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#229ED9] text-white flex items-center justify-center shadow-sm group-hover:shadow-md transition">
                  <TelegramIcon className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-800">Telegram</span>
              </button>
            </div>
          </div>

          {/* Secondary Actions: Native Share / Email */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleNativeShare}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-church-50 hover:bg-church-100 text-church-800 border border-church-200 text-xs font-bold transition shadow-2xs active:scale-95"
            >
              {isNativeApp ? (
                <Smartphone size={16} className="text-church-600" />
              ) : (
                <Share2 size={16} className="text-church-600" />
              )}
              <span>
                {isNativeApp
                  ? (language === 'en' ? 'Android Share Sheet (All Apps)' : 'Phone Share Menu (App dang zawng zawng)')
                  : (language === 'en' ? 'More Apps (System Share)' : 'App dang zawng zawng')}
              </span>
            </button>
            <button
              type="button"
              onClick={handleEmail}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 text-xs font-bold transition shadow-2xs active:scale-95"
            >
              <Mail size={16} className="text-slate-500" />
              <span>Email</span>
            </button>
          </div>

          {/* Copy Options: Copy Full Message & Copy Link */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            {/* Quick Action: Copy Full Share Text (Two sentences + Read more + Link) */}
            <button
              type="button"
              onClick={handleCopyFullMessage}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-xs border ${
                copiedText
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-md'
                  : 'bg-church-600 text-white hover:bg-church-700 border-church-700'
              }`}
            >
              <div className="flex items-center gap-2">
                {copiedText ? <Check size={16} className="stroke-[3]" /> : <FileText size={16} />}
                <span>
                  {copiedText
                    ? (language === 'en' ? 'Full Share Text Copied!' : 'Thuziak leh Link copy ta!')
                    : (language === 'en' ? 'Copy Full Share Text (Title + 2 Sentences + Link)' : 'Thuziak leh Link Copy Rawh')}
                </span>
              </div>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md font-mono">
                {copiedText ? 'Copied' : 'WhatsApp Ready'}
              </span>
            </button>

            {/* Direct Link Input & Copy Link Button */}
            <div>
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                {isNativeApp 
                  ? (language === 'en' ? 'Play Store App Link' : 'Play Store App Link') 
                  : (language === 'en' ? 'Or Copy Direct Link Only' : 'Emaw Link Chauh Copy Rawh')}
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
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs shrink-0 ${
                    copiedLink
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                  }`}
                >
                  {copiedLink ? (
                    <>
                      <Check size={14} className="stroke-[3]" />
                      <span>{language === 'en' ? 'Copied' : 'Copy ta'}</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>{language === 'en' ? 'Copy' : 'Copy'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;

