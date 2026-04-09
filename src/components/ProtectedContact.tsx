import React, { useState } from 'react';
import { Phone, MessageCircle, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProtectedContactProps {
  phone: string;
  name?: string;
  className?: string;
  variant?: 'full' | 'icon-only' | 'text-only';
}

/**
 * ProtectedContact component hides phone numbers from web scrapers
 * by requiring a user interaction (click) to reveal the actual number
 * and the clickable links.
 */
export const ProtectedContact: React.FC<ProtectedContactProps> = ({ 
  phone, 
  name = 'Contact',
  className = '',
  variant = 'full'
}) => {
  const [revealed, setRevealed] = useState(false);

  // Simple obfuscation: the number is stored in state/props but not rendered as a link
  // until the user interacts.
  const cleanPhone = phone.replace(/\D/g, '');
  const formattedPhone = phone.trim();

  const handleReveal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setRevealed(true);
  };

  if (variant === 'icon-only') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <AnimatePresence mode="wait">
          {!revealed ? (
            <motion.button
              key="reveal-btn"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={handleReveal}
              className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors flex items-center justify-center"
              title="Show contact options"
            >
              <Eye size={18} />
            </motion.button>
          ) : (
            <motion.div
              key="contact-links"
              initial={{ x: 10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex items-center gap-2"
            >
              <a 
                href={`tel:${cleanPhone}`}
                className="p-2 bg-church-50 text-church-600 rounded-full hover:bg-church-100 transition-colors"
                title={`Call ${name}`}
              >
                <Phone size={18} />
              </a>
              <a 
                href={`https://wa.me/91${cleanPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition-colors"
                title={`WhatsApp ${name}`}
              >
                <MessageCircle size={18} />
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (variant === 'text-only') {
    return (
      <span className={className}>
        {!revealed ? (
          <button 
            onClick={handleReveal}
            className="text-church-600 hover:underline font-medium inline-flex items-center gap-1"
          >
            <Eye size={12} /> Show Number
          </button>
        ) : (
          <a href={`tel:${cleanPhone}`} className="hover:underline">
            {formattedPhone}
          </a>
        )}
      </span>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {!revealed ? (
        <button
          onClick={handleReveal}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-bold text-sm"
        >
          <Eye size={16} /> Show Contact Info
        </button>
      ) : (
        <div className="flex items-center gap-3">
          <a 
            href={`tel:${cleanPhone}`}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-church-600 text-white rounded-xl hover:bg-church-700 transition-all font-bold text-sm shadow-sm"
          >
            <Phone size={16} /> Call
          </a>
          <a 
            href={`https://wa.me/91${cleanPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-bold text-sm shadow-sm"
          >
            <MessageCircle size={16} /> WhatsApp
          </a>
        </div>
      )}
    </div>
  );
};

export default ProtectedContact;
