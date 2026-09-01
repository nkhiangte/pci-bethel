import React, { useState, useEffect, useRef } from 'react';
import { X, UserPlus, QrCode, Download, Printer, Share2, CheckCircle2, User, Phone, MapPin, Building, Sparkles, Copy, Check } from 'lucide-react';
import { db } from '../../services/firebase';
import { LibraryMember } from '../../types';
import { generateQrCodeDataUrl, encodeMemberQr } from '../../utils/qrHelper';

interface BorrowerRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegistered?: (newMember: LibraryMember) => void;
  existingMemberCount?: number;
}

export const BorrowerRegistrationModal: React.FC<BorrowerRegistrationModalProps> = ({
  isOpen,
  onClose,
  onRegistered,
  existingMemberCount = 0,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    veng: 'Bethel Veng',
    department: 'KTP',
    gender: 'male' as 'male' | 'female' | 'other',
    notes: '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredMember, setRegisteredMember] = useState<LibraryMember | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  // Generate standard Member ID format: BTH-M001
  const generateMemberNumber = () => {
    const num = (existingMemberCount + 1).toString().padStart(3, '0');
    return `BTH-M${num}`;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Hming ziah a ngai e.');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Phone number ziah a ngai e.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const memberNo = generateMemberNumber();
      const memberId = 'mem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const qrPayload = encodeMemberQr(memberNo, memberId);
      const generatedQrUrl = await generateQrCodeDataUrl(qrPayload, { width: 300 });

      const newMember: LibraryMember = {
        id: memberId,
        memberNo,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        veng: formData.veng.trim() || 'Bethel Veng',
        department: formData.department,
        gender: formData.gender,
        registeredDate: new Date().toISOString().split('T')[0],
        status: 'active',
        qrCode: qrPayload,
        activeLoansCount: 0,
        notes: formData.notes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      if (db && db.collection) {
        await db.collection('library_members').doc(memberId).set(newMember);
      }

      setQrDataUrl(generatedQrUrl);
      setRegisteredMember(newMember);
      if (onRegistered) {
        onRegistered(newMember);
      }
    } catch (err: any) {
      console.error('Registration failed:', err);
      setError(err?.message || 'Inziahluhna a hlawhchham. Khawngaihin try leh rawh.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyId = () => {
    if (!registeredMember) return;
    navigator.clipboard.writeText(registeredMember.memberNo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintCard = () => {
    const printContent = document.getElementById('printable-library-card');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up window a in-block a ni. Allow popups to print library card.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bethel Kohhran Library Card - ${registeredMember?.name}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; display: flex; justify-content: center; }
            .card { width: 340px; border: 2px solid #0f172a; border-radius: 12px; padding: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); background: #ffffff; }
            .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 12px; }
            .church-title { font-size: 14px; font-weight: bold; color: #0f172a; margin: 0; }
            .lib-title { font-size: 12px; color: #475569; margin-top: 2px; }
            .content { display: flex; align-items: center; justify-content: space-between; }
            .details { font-size: 11px; line-height: 1.5; color: #1e293b; }
            .details strong { color: #0f172a; }
            .qr-img { width: 95px; height: 95px; }
            .footer { margin-top: 10px; padding-top: 6px; border-top: 1px dashed #cbd5e1; text-align: center; font-size: 9px; color: #64748b; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadCard = () => {
    if (!qrDataUrl || !registeredMember) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `Bethel_Library_QR_${registeredMember.memberNo}_${registeredMember.name.replace(/\s+/g, '_')}.png`;
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
              <UserPlus className="w-5 h-5 text-church-200" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-snug">
                {registeredMember ? 'Library Card Buatsaih Hlawhtling' : 'Borrower Member Registration'}
              </h3>
              <p className="text-xs text-church-200 font-light">
                {registeredMember
                  ? 'Digital Library ID Card & QR Code a hnuai ami hi save rawh'
                  : 'Library-a lehkhabu hawh theihna turin inziak lut rawh le'}
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

        <div className="p-5 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {!registeredMember ? (
            /* Registration Form */
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name (Hming Pum) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lalhruaitluanga"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-church-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9862300000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-church-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department / Fellowship
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-church-500"
                    >
                      <option value="KTP">Kristian Ṭhalai Pawl (KTP)</option>
                      <option value="Kohhran Hmeichhia">Kohhran Hmeichhia</option>
                      <option value="KPP">Kohhran Pavalai Pawl (KPP)</option>
                      <option value="Sunday School">Sunday School Zirtirtu / Zirlai</option>
                      <option value="Kohhran Puitling">Kohhran Puitling / General</option>
                      <option value="Naupang">Naupang (Sunday School)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Veng / Address
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="e.g. Bethel Veng / Section"
                      value={formData.veng}
                      onChange={(e) => setFormData({ ...formData, veng: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-church-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gender (Mipa / Hmeichhia)
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-church-500"
                  >
                    <option value="male">Mipa</option>
                    <option value="female">Hmeichhia</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  placeholder="e.g. email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-church-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 bg-gradient-to-r from-church-700 to-church-900 hover:from-church-800 hover:to-slate-900 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{saving ? 'Creating Membership Card...' : 'Inziak Lut La, QR Library Card Siam Rawh'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* Digital Library Card Presentation */
            <div className="space-y-5 flex flex-col items-center">
              <div className="w-full flex items-center justify-center">
                <div
                  id="printable-library-card"
                  ref={cardRef}
                  className="w-full max-w-sm bg-gradient-to-br from-slate-900 via-church-950 to-slate-900 text-white rounded-2xl p-5 border-2 border-amber-400/40 shadow-xl relative overflow-hidden"
                >
                  {/* Decorative ambient background */}
                  <div className="absolute -right-8 -top-8 w-28 h-28 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />
                  <div className="absolute -left-8 -bottom-8 w-28 h-28 bg-church-500/15 rounded-full blur-xl pointer-events-none" />

                  {/* Card Header */}
                  <div className="text-center pb-3 mb-3 border-b border-slate-700/80">
                    <div className="flex items-center justify-center space-x-2 mb-1">
                      <img
                        src="https://i.ibb.co/mVw3Ftpw/PCI-logo.png"
                        alt="PCI"
                        className="w-6 h-6 object-contain bg-white rounded-full p-0.5"
                      />
                      <span className="font-bold text-xs tracking-wider uppercase text-amber-300">
                        PCI Champhai Bethel Kohhran
                      </span>
                    </div>
                    <h4 className="font-black text-sm tracking-wide text-white">LIBRARY BORROWER CARD</h4>
                  </div>

                  {/* Card Body */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Member ID</span>
                        <span className="font-mono font-bold text-sm text-amber-300">
                          {registeredMember.memberNo}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Borrower Hming</span>
                        <span className="font-bold text-sm text-white line-clamp-1">
                          {registeredMember.name}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Department</span>
                        <span className="text-slate-300 font-medium text-xs">
                          {registeredMember.department}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Phone</span>
                        <span className="text-slate-300 font-mono text-xs">
                          {registeredMember.phone}
                        </span>
                      </div>
                    </div>

                    {/* QR Code Container */}
                    <div className="bg-white p-2 rounded-xl shadow-md flex flex-col items-center justify-center shrink-0">
                      {qrDataUrl ? (
                        <img
                          src={qrDataUrl}
                          alt="Borrower QR Code"
                          className="w-24 h-24 object-contain"
                        />
                      ) : (
                        <div className="w-24 h-24 flex items-center justify-center bg-slate-100">
                          <QrCode className="w-8 h-8 text-slate-400 animate-spin" />
                        </div>
                      )}
                      <span className="text-[9px] font-mono text-slate-600 mt-1 font-semibold">
                        SCAN TO BORROW
                      </span>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-3 pt-2 border-t border-slate-700/60 text-center flex items-center justify-between text-[10px] text-slate-400">
                    <span>Veng: {registeredMember.veng || 'Bethel Veng'}</span>
                    <span>Date: {registeredMember.registeredDate}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handleDownloadCard}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors border border-slate-300"
                >
                  <Download className="w-4 h-4 text-church-600" />
                  <span>Download QR</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintCard}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors border border-slate-300"
                >
                  <Printer className="w-4 h-4 text-church-600" />
                  <span>Print Card</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyId}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors border border-slate-300 col-span-2 sm:col-span-1"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-church-600" />}
                  <span>{copied ? 'Copied!' : 'Copy ID'}</span>
                </button>
              </div>

              <div className="w-full p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 text-center">
                <p className="font-semibold">Library-ah lehkhabu i hawh dawn apiangin he QR code emaw Member ID hi Librarian hnenah i scan tir thin dawn nia.</p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-church-800 hover:bg-church-900 text-white font-bold rounded-xl text-sm transition-colors"
              >
                A Ṭha e, Ka Zo E
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
