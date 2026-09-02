import React from 'react';
import { X, Smartphone, Globe, ExternalLink, Calculator, ShieldCheck, HeartHandshake, CheckCircle2 } from 'lucide-react';
import { 
  PATHIAN_RAM_WEB_URL, 
  PATHIAN_RAM_PLAYSTORE_URL, 
  isMobileDevice, 
  isAndroidDevice 
} from '../utils/pathianRamLauncher';

interface PathianRamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PathianRamModal: React.FC<PathianRamModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const isMobile = isMobileDevice();
  const isAndroid = isAndroidDevice();

  const handleOpenPlayStore = () => {
    window.open(PATHIAN_RAM_PLAYSTORE_URL, '_blank', 'noopener,noreferrer');
  };

  const handleOpenWebApp = () => {
    window.open(PATHIAN_RAM_WEB_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-church-900 via-church-800 to-church-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-3 bg-amber-500/20 border border-amber-400/40 rounded-xl text-amber-300">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 bg-amber-900/40 px-2 py-0.5 rounded-md">
                Finance Committee & Thawhlawm
              </span>
              <h2 className="text-2xl font-serif font-bold text-white leading-tight mt-0.5">
                Pathian Ram (PTR) Portal
              </h2>
            </div>
          </div>
          <p className="text-xs text-church-200 mt-2 leading-relaxed">
            Champhai Bethel Kohhran Tithe / Thawhlawm chhutna leh Finance Committee tana buatsaih portal a ni. A hnuaia hmanrua hi thlang rawh le:
          </p>
        </div>

        {/* Action Options */}
        <div className="p-6 space-y-4 bg-slate-50/50">
          {/* Option 1: Mobile App / Google Play */}
          <div className={`p-4 rounded-xl border transition-all ${
            isMobile || isAndroid 
              ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-400/20' 
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start space-x-3">
                <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs mt-0.5 shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      Android Mobile App (Google Play)
                    </h3>
                    {(isMobile || isAndroid) && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full">
                        Recommended for Mobile
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Mobile phone-a awlsam taka hman theih turin Google Play Store atangin download emaw hawng rawh le.
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono mt-1">
                    com.champhaibethel.app
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Google Play Store verified</span>
              </span>
              <button
                type="button"
                onClick={handleOpenPlayStore}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center space-x-1.5 shadow-xs transition-colors"
              >
                <Smartphone className="w-4 h-4" />
                <span>Open Google Play</span>
                <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
              </button>
            </div>
          </div>

          {/* Option 2: Web Calculator / Browser Portal */}
          <div className={`p-4 rounded-xl border transition-all ${
            !isMobile && !isAndroid
              ? 'bg-church-50/60 border-church-300 ring-2 ring-church-400/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start space-x-3">
                <div className="p-2.5 bg-church-800 text-white rounded-xl shadow-xs mt-0.5 shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      Web Calculator (Online Portal)
                    </h3>
                    {!isMobile && !isAndroid && (
                      <span className="px-2 py-0.5 bg-church-100 text-church-800 text-[10px] font-extrabold rounded-full">
                        Recommended for Desktop
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Computer browser emaw mobile web atanga direct-a calculation tihna portal.
                  </p>
                  <p className="text-[11px] text-church-700 font-mono mt-1">
                    https://bethelptr.vercel.app
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-church-600" />
                <span>Online Web Vercel Portal</span>
              </span>
              <button
                type="button"
                onClick={handleOpenWebApp}
                className="px-4 py-2 bg-church-800 hover:bg-church-900 text-white font-bold rounded-lg text-xs flex items-center space-x-1.5 shadow-xs transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span>Open Web App</span>
                <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-[11px] text-slate-500">
            <HeartHandshake className="w-4 h-4 text-church-600" />
            <span>Bethel Presbyterian Kohhran Finance Ministry</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-xs transition-colors"
          >
            Close / Khâr rawh
          </button>
        </div>
      </div>
    </div>
  );
};
