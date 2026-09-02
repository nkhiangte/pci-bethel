import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, SwitchCamera, Upload, AlertCircle, CheckCircle2, Sparkles, Volume2, VolumeX, ShieldCheck, RefreshCw } from 'lucide-react';
import { parseScannedQr } from '../../utils/qrHelper';
import { requestCameraPermission } from '../../services/appPermissions';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (scannedText: string, parsed: ReturnType<typeof parseScannedQr>) => void;
  title?: string;
  subtitle?: string;
  expectedType?: 'book' | 'member' | 'any';
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'Scan QR Code / Barcode',
  subtitle = 'Camera hmaah Lehkhabu emaw Borrower QR code dah rawh',
  expectedType = 'any',
}) => {
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [scanFeedback, setScanFeedback] = useState<{ text: string; type: string } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [manualCode, setManualCode] = useState('');

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-reader-container';

  // Play beep sound on successful scan
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch {
      // AudioContext may be blocked or unsupported
    }
  };

  const initScanner = async () => {
    try {
      setScannerError(null);
      setIsRequestingPermission(true);

      // Explicitly request camera permission first
      await requestCameraPermission();

      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameras(devices);
        // Default to back/environment camera if available
        const backCam = devices.find((d) => 
          d.label.toLowerCase().includes('back') || 
          d.label.toLowerCase().includes('rear') || 
          d.label.toLowerCase().includes('environment')
        );
        const defaultCamId = backCam ? backCam.id : devices[0].id;
        setSelectedCameraId(defaultCamId);
        await startScanner(defaultCamId);
      } else {
        setScannerError('Camera hmuh a ni lo. File upload emaw manual input hmang rawh.');
      }
    } catch (err: any) {
      console.error('Error getting cameras:', err);
      setScannerError('Camera access permission pek a ni lo emaw hman theih a ni lo.');
    } finally {
      setIsRequestingPermission(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    // Small delay to ensure modal DOM is mounted
    const timeout = setTimeout(() => {
      initScanner();
    }, 250);

    return () => {
      clearTimeout(timeout);
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = async (cameraId: string) => {
    try {
      await stopScanner();

      const qrCode = new Html5Qrcode(scannerContainerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.CODE_39
        ],
        verbose: false,
      });

      html5QrCodeRef.current = qrCode;

      const config = {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await qrCode.start(
        cameraId,
        config,
        (decodedText) => {
          handleSuccessfulScan(decodedText);
        },
        () => {
          // ignore repetitive frame errors
        }
      );

      setIsScanning(true);
      setScannerError(null);
    } catch (err: any) {
      console.error('Failed to start scanner:', err);
      setIsScanning(false);
      setScannerError('Camera start theih a ni lo: ' + (err?.message || 'Check camera permissions'));
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (err) {
        // ignore cleanup error
      }
      html5QrCodeRef.current = null;
    }
    setIsScanning(false);
  };

  const handleSuccessfulScan = (rawText: string) => {
    const parsed = parseScannedQr(rawText);

    // Provide feedback
    playBeep();
    if (navigator.vibrate) {
      try {
        navigator.vibrate(80);
      } catch {
        // ignore
      }
    }

    setScanFeedback({
      text: parsed.identifier || rawText,
      type: parsed.type,
    });

    // Pause briefly to show visual success confirmation then trigger callback
    setTimeout(() => {
      onScan(rawText, parsed);
      onClose();
    }, 400);
  };

  const handleSwitchCamera = async () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamId = cameras[nextIndex].id;
    setSelectedCameraId(nextCamId);
    await startScanner(nextCamId);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setScannerError(null);
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerContainerId);
      }

      const decodedText = await html5QrCodeRef.current.scanFile(file, true);
      handleSuccessfulScan(decodedText);
    } catch (err: any) {
      console.error('File scan error:', err);
      setScannerError('File-ah QR code hmuh a ni lo. A fiah tawk em check rawh.');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleSuccessfulScan(manualCode.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-church-900 via-church-800 to-church-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Camera className="w-5 h-5 text-church-200" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-snug">{title}</h3>
              <p className="text-xs text-church-200 font-light">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute beep' : 'Enable beep'}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors text-xs"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-300" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scanner Viewport */}
        <div className="p-4 flex flex-col items-center bg-slate-950 relative min-h-[290px] justify-center">
          {/* Scanner element */}
          <div
            id={scannerContainerId}
            className="w-full max-w-sm rounded-xl overflow-hidden shadow-inner bg-black"
            style={{ minHeight: '260px' }}
          />

          {/* Scan overlay feedback */}
          {scanFeedback && (
            <div className="absolute inset-0 bg-emerald-950/85 backdrop-blur-xs flex flex-col items-center justify-center text-white z-20 animate-in zoom-in-95 duration-150">
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-2 animate-bounce" />
              <p className="font-bold text-lg">Scan Hlawhtling!</p>
              <p className="text-xs text-emerald-200 uppercase tracking-widest mt-1">
                {scanFeedback.type}: {scanFeedback.text}
              </p>
            </div>
          )}

          {/* Scanner Controls Floating */}
          <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center space-x-3 px-4 z-10">
            {cameras.length > 1 && (
              <button
                type="button"
                onClick={handleSwitchCamera}
                className="px-3 py-1.5 rounded-full bg-slate-800/90 hover:bg-slate-700 text-white text-xs font-medium flex items-center space-x-1.5 border border-slate-700 shadow-md backdrop-blur-sm"
              >
                <SwitchCamera className="w-3.5 h-3.5 text-church-300" />
                <span>Switch Camera</span>
              </button>
            )}

            <label className="px-3 py-1.5 rounded-full bg-slate-800/90 hover:bg-slate-700 text-white text-xs font-medium flex items-center space-x-1.5 border border-slate-700 shadow-md backdrop-blur-sm cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-amber-300" />
              <span>Scan from Photo</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>
        </div>

        {/* Error message / Permission prompt banner */}
        {scannerError && (
          <div className="p-3.5 bg-amber-50 border-y border-amber-200 text-amber-900 text-xs flex flex-col gap-2">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{scannerError}</p>
                <p className="mt-0.5 text-amber-700">
                  Camera permission pek a ngai a ni. Hmet la phalsak rawh, emaw a hnuai lamah Accession Number / Member ID chhu lut rawh:
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pl-6">
              <button
                type="button"
                disabled={isRequestingPermission}
                onClick={initScanner}
                className="px-3 py-1.5 bg-church-800 hover:bg-church-900 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-xs"
              >
                {isRequestingPermission ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Checking...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Grant Camera Access / Pe Rawh</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Manual Code Input fallback */}
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={
                  expectedType === 'book'
                    ? 'Type Accession No / Book ID (e.g. BTH-001)...'
                    : expectedType === 'member'
                    ? 'Type Member ID / No (e.g. BTH-M001)...'
                    : 'Accession No / Member ID / Barcode...'
                }
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="w-full pl-3 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-church-500 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="px-4 py-2 bg-church-800 hover:bg-church-900 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors flex items-center space-x-1"
            >
              <Sparkles className="w-4 h-4" />
              <span>Submit</span>
            </button>
          </form>
          <p className="text-[11px] text-slate-500 mt-2 text-center">
            Camera hmaah lehkhabu sticker QR code emaw borrower library ID card QR code dah rawh le.
          </p>
        </div>
      </div>
    </div>
  );
};
