
import React from 'react';
import { Heart, CreditCard, Building, QrCode } from 'lucide-react';

const Giving: React.FC = () => {
  return (
    <div className="py-12 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif font-bold text-church-900 mb-4">Online Giving</h1>
          <p className="max-w-2xl mx-auto text-slate-600">
            "Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver." — 2 Corinthians 9:7
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Bank Transfer */}
          <div className="bg-white p-8 rounded-xl shadow-lg border-t-4 border-church-500">
             <div className="flex items-center mb-6">
                <Building className="text-church-600 mr-3" size={28} />
                <h2 className="text-2xl font-bold text-slate-800">Bank Transfer</h2>
             </div>
             <div className="space-y-4 text-slate-700">
                <div className="bg-slate-50 p-4 rounded border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Account Name</p>
                    <p className="font-mono text-lg font-bold">PCI Champhai Bethel</p>
                </div>
                <div className="bg-slate-50 p-4 rounded border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Account Number</p>
                    <p className="font-mono text-lg font-bold">1234 5678 9012</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Bank</p>
                        <p className="font-bold">SBI Champhai</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">IFSC Code</p>
                        <p className="font-mono font-bold">SBIN0001234</p>
                    </div>
                </div>
             </div>
          </div>

          {/* UPI / QR */}
          <div className="bg-white p-8 rounded-xl shadow-lg border-t-4 border-teal-500">
             <div className="flex items-center mb-6">
                <QrCode className="text-teal-600 mr-3" size={28} />
                <h2 className="text-2xl font-bold text-slate-800">UPI / GPay</h2>
             </div>
             <div className="flex flex-col items-center justify-center space-y-6">
                <div className="bg-white p-4 rounded-lg shadow-inner border border-slate-200">
                    {/* Placeholder QR */}
                    <img 
                        src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=bethelchurch@sbi&pn=PCI%20Champhai%20Bethel" 
                        alt="Donation QR Code" 
                        className="w-48 h-48"
                    />
                </div>
                <div className="text-center">
                    <p className="text-sm text-slate-500 mb-1">Scan with GPay, PhonePe, or Paytm</p>
                    <p className="font-mono font-bold text-lg text-slate-800">bethelchurch@sbi</p>
                </div>
             </div>
          </div>
        </div>

        <div className="mt-12 text-center text-sm text-slate-500">
            <p>For specific mission giving or special projects, please mention the purpose in the transaction remarks.</p>
        </div>

      </div>
    </div>
  );
};

export default Giving;
