import React, { useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';
import { ShareModal, ShareData } from './ShareModal';
import { useLanguage } from '../contexts/LanguageContext';
import { extractAtLeastTwoSentences, generateShareMessage } from '../utils/shareUtils';

export interface ShareButtonProps extends ShareData {
  variant?: 'button' | 'icon' | 'outline' | 'inline' | 'floating';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  buttonText?: string;
  showTextOnMobile?: boolean;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  variant = 'button',
  size = 'md',
  className = '',
  buttonText,
  showTextOnMobile = true,
  ...shareData
}) => {
  const { language } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedInline, setCopiedInline] = useState(false);

  const defaultText = buttonText || (language === 'en' ? 'Share' : 'Insem rawlh');

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsModalOpen(true);
  };

  const handleInlineCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const url = shareData.url || window.location.href;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
      setCopiedInline(true);
      setTimeout(() => setCopiedInline(false), 2500);
    } catch {
      setIsModalOpen(true);
    }
  };

  const handleDirectWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const url = shareData.url || window.location.href;
    const excerpt = extractAtLeastTwoSentences(shareData.content || shareData.text);
    const message = generateShareMessage({
      title: shareData.title,
      author: shareData.author,
      excerpt,
      targetUrl: url,
      language,
    });
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  // Size styling
  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-xs font-bold px-3.5 py-2 gap-2',
    lg: 'text-sm font-bold px-4 py-2.5 gap-2.5',
  };

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18,
  };

  // If inline variant requested (e.g. at the end of an article / modal)
  if (variant === 'inline') {
    return (
      <>
        <div className={`bg-gradient-to-br from-slate-50 to-church-50/30 border border-church-100 rounded-2xl p-5 sm:p-6 shadow-xs ${className}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-serif font-bold text-slate-900 flex items-center gap-2">
                <Share2 size={16} className="text-church-600" />
                <span>{language === 'en' ? 'Share this Article' : 'He thuziak hi thehdarh / insem rawh'}</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'en' 
                  ? 'Spread spiritual encouragement to your family, fellowship, and friends.'
                  : 'Kohhran hote, chhungkua leh ṭhiante tan thlarau lam thuchah insem darh rawh le.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Direct WhatsApp Quick Button */}
              <button
                type="button"
                onClick={handleDirectWhatsApp}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#25D366] text-white hover:bg-[#1ebe5b] transition shadow-xs active:scale-95"
              >
                <span>WhatsApp</span>
              </button>

              {/* Direct Quick Copy Button */}
              <button
                type="button"
                onClick={handleInlineCopy}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 transition shadow-2xs active:scale-95"
              >
                {copiedInline ? <Check size={14} className="text-emerald-600 stroke-[3]" /> : <Copy size={14} className="text-slate-500" />}
                <span>{copiedInline ? (language === 'en' ? 'Copied!' : 'Copy ta!') : (language === 'en' ? 'Copy Link' : 'Copy Rawh')}</span>
              </button>

              {/* More Share Options (Opens Modal) */}
              <button
                type="button"
                onClick={handleClick}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-church-600 text-white hover:bg-church-700 transition shadow-xs active:scale-95"
              >
                <Share2 size={14} />
                <span>{language === 'en' ? 'All Share Options' : 'Thehdarhna dangte'}</span>
              </button>
            </div>
          </div>
        </div>

        <ShareModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          data={shareData}
        />
      </>
    );
  }

  // Icon only
  if (variant === 'icon') {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          title={defaultText}
          aria-label={defaultText}
          className={`p-2 rounded-xl text-slate-500 hover:text-church-600 hover:bg-church-50 transition border border-transparent hover:border-church-100 ${className}`}
        >
          <Share2 size={iconSizes[size]} />
        </button>

        <ShareModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          data={shareData}
        />
      </>
    );
  }

  // Outline button
  if (variant === 'outline') {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          className={`inline-flex items-center rounded-xl bg-white text-slate-700 border border-slate-200 hover:border-church-300 hover:text-church-700 hover:bg-church-50/50 transition-all shadow-2xs active:scale-95 ${sizeClasses[size]} ${className}`}
        >
          <Share2 size={iconSizes[size]} className="text-church-600" />
          <span className={showTextOnMobile ? '' : 'hidden sm:inline'}>{defaultText}</span>
        </button>

        <ShareModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          data={shareData}
        />
      </>
    );
  }

  // Default button
  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center rounded-xl bg-church-50 text-church-700 hover:bg-church-100 border border-church-200/80 transition-all shadow-2xs hover:shadow-xs active:scale-95 ${sizeClasses[size]} ${className}`}
      >
        <Share2 size={iconSizes[size]} className="text-church-600" />
        <span className={showTextOnMobile ? '' : 'hidden sm:inline'}>{defaultText}</span>
      </button>

      <ShareModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={shareData}
      />
    </>
  );
};

export default ShareButton;
