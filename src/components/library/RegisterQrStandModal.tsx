import React, { useState, useEffect } from 'react';
import { X, QrCode, Printer, Download, Sparkles, Smartphone, Share2 } from 'lucide-react';
import { generateQrCodeDataUrl } from '../../utils/qrHelper';

interface RegisterQrStandModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RegisterQrStandModal: React.FC<RegisterQrStandModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [registrationQrUrl, setRegistrationQrUrl] = useState<string>('');
  const registrationUrl = `${window.location.origin}/library?action=register`;

  useEffect(() => {
    if (isOpen) {
      generateQrCodeDataUrl(registrationUrl, {
        width: 400,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' },
      }).then((url) => {
        setRegistrationQrUrl(url);
      });
    }
  }, [isOpen, registrationUrl]);

  const handlePrintPoster = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Allow popups to print poster.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Church Library Registration Stand - PCI Champhai Bethel</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; padding: 20px; background: #fff; }
            .poster { border: 3px solid #0f172a; border-radius: 16px; padding: 40px 20px; max-width: 550px; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
            .church-header { font-size: 16px; font-weight: bold; color: #475569; letter-spacing: 1px; text-transform: uppercase; }
            .main-title { font-size: 28px; font-weight: 900; color: #0f172a; margin: 8px 0 4px; }
            .sub-title { font-size: 16px; color: #334155; margin-bottom: 24px; }
            .qr-container { background: #f8fafc; border: 2px dashed #94a3b8; border-radius: 12px; padding: 20px; display: inline-block; margin: 0 auto 20px; }
            .qr-img { width: 260px; height: 260px; display: block; }
            .instructions { font-size: 14px; font-weight: 600; color: #0f172a; line-height: 1.6; max-width: 400px; margin: 0 auto; }
            .step { margin: 6px 0; color: #475569; font-size: 12px; }
            .footer { margin-top: 30px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="poster">
            <div class="church-header">PCI Champhai Bethel Kohhran</div>
            <div class="main-title">CHURCH LIBRARY</div>
            <div class="sub-title">Lehkhabu hawh theihna turin inziak lut rawh le</div>
            
            <div class="qr-container">
              <img src="${registrationQrUrl}" class="qr-img" alt="Scan to Register" />
            </div>

            <div class="instructions">
              I phone Camera-in he QR Code hi scan la, i hming leh phone number ziah luh hnuah Digital Library Card i dawng nghal ang.
            </div>

            <div class="footer">
              Champhai Bethel Kohhran Library Management System • Powered by PCI Digital
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadQr = () => {
    if (!registrationQrUrl) return;
    const a = document.createElement('a');
    a.href = registrationQrUrl;
    a.download = 'Bethel_Library_Registration_QR_Poster.png';
    a.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-church-900 via-church-800 to-church-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Smartphone className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-snug">Scan to Register QR Poster</h3>
              <p className="text-xs text-church-200 font-light">
                Church member-te tana mahni phone atanga registration QR code
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center text-center space-y-4">
          <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl shadow-inner max-w-xs flex flex-col items-center">
            <div className="flex items-center space-x-2 mb-2">
              <img
                src="https://i.ibb.co/mVw3Ftpw/PCI-logo.png"
                alt="PCI"
                className="w-5 h-5 object-contain"
              />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                PCI Champhai Bethel
              </span>
            </div>

            <h4 className="font-extrabold text-sm text-slate-900 mb-1">
              BORROWER REGISTRATION
            </h4>
            <p className="text-[11px] text-slate-500 mb-3">
              Scan with your phone camera to register
            </p>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              {registrationQrUrl ? (
                <img
                  src={registrationQrUrl}
                  alt="Registration QR Code"
                  className="w-48 h-48 object-contain"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center">
                  <QrCode className="w-10 h-10 text-slate-400 animate-spin" />
                </div>
              )}
            </div>

            <span className="text-[10px] font-mono text-slate-400 mt-2">
              {registrationUrl}
            </span>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 max-w-sm">
            <p className="font-semibold">
              He QR code hi Library counter-ah print chhuah emaw tablet-ah tarlan a ni thei a, church member-ten an phone camera hmanga an scan-in borrower registration form an dawng nghal ang.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold"
          >
            Close
          </button>

          <div className="flex space-x-2">
            <button
              type="button"
              onClick={handleDownloadQr}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 flex items-center space-x-1.5"
            >
              <Download className="w-3.5 h-3.5 text-church-600" />
              <span>Download Image</span>
            </button>

            <button
              type="button"
              onClick={handlePrintPoster}
              className="px-5 py-2 bg-gradient-to-r from-church-700 to-church-900 hover:from-church-800 hover:to-slate-900 text-white font-bold rounded-lg text-xs shadow-md transition-all flex items-center space-x-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-amber-300" />
              <span>Print A4 Poster</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
