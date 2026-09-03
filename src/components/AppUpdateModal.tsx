import React, { useEffect, useState } from 'react';
import { Sparkles, Download, X } from 'lucide-react';

interface VersionInfo {
  version: string;
  minVersion: string;
  title: string;
  message: string;
  playStoreUrl: string;
}

const CURRENT_VERSION = '2.5.0';

export const AppUpdateModal: React.FC = () => {
  const [updateInfo, setUpdateInfo] = useState<VersionInfo | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Fetch version info from public/version.json with cache busting
    fetch(`/version.json?t=${Date.now()}`)
      .then((res) => res.json())
      .then((data: VersionInfo) => {
        if (data && data.version) {
          if (compareVersions(data.version, CURRENT_VERSION) > 0) {
            setUpdateInfo(data);
            setIsOpen(true);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to check for updates:', err);
      });
  }, []);

  const compareVersions = (v1: string, v2: string): number => {
    const p1 = v1.split('.').map(Number);
    const p2 = v2.split('.').map(Number);
    for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
      const n1 = p1[i] || 0;
      const n2 = p2[i] || 0;
      if (n1 > n2) return 1;
      if (n1 < n2) return -1;
    }
    return 0;
  };

  if (!isOpen || !updateInfo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-church-200 overflow-hidden text-slate-900">
        {/* Header gradient banner */}
        <div className="bg-gradient-to-r from-church-800 to-church-600 p-6 text-white text-center relative">
          <div className="absolute top-3 right-3">
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-md">
            <Sparkles size={24} className="text-church-200" />
          </div>
          <h3 className="text-xl font-bold">{updateInfo.title}</h3>
          <p className="text-church-100 text-sm mt-1">
            New Version {updateInfo.version} is available (Current: {CURRENT_VERSION})
          </p>
        </div>

        {/* Body content */}
        <div className="p-6 space-y-4">
          <p className="text-slate-700 text-sm leading-relaxed">
            {updateInfo.message}
          </p>

          <div className="bg-church-50 p-4 rounded-xl border border-church-200/60 text-xs text-church-800 space-y-1">
            <div className="font-semibold">What's improved:</div>
            <ul className="list-disc list-inside space-y-0.5 text-slate-600">
              <li>Performance enhancements and bug fixes</li>
              <li>Updated layouts and church announcements</li>
            </ul>
          </div>

          {/* Action buttons */}
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors"
            >
              Later
            </button>
            <a
              href={updateInfo.playStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 px-4 rounded-xl bg-church-700 hover:bg-church-800 text-white font-medium text-sm flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transition-all"
            >
              <Download size={16} />
              <span>Update Now</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
