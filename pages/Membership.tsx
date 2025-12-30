
import React, { useState } from 'react';
import { UserPlus, Droplets, HeartHandshake, FileText, Send } from 'lucide-react';

const Membership: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'register' | 'baptism' | 'marriage' | 'prayer'>('register');

  const tabs = [
    { id: 'register', label: 'New Member', icon: UserPlus },
    { id: 'baptism', label: 'Baptism', icon: Droplets },
    { id: 'marriage', label: 'Marriage', icon: HeartHandshake },
    { id: 'prayer', label: 'Prayer Request', icon: Send },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Form submitted! (This feature would connect to the church database)");
  };

  return (
    <div className="py-12 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-serif font-bold text-church-900 mb-8 text-center">Membership Services</h1>
        
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-2 mb-8 flex flex-wrap gap-2 justify-center">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-church-500 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <tab.icon size={16} className="mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* New Member Form */}
            {activeTab === 'register' && (
              <>
                <div className="border-b border-slate-100 pb-4 mb-4">
                   <h2 className="text-2xl font-bold text-slate-800">New Member Registration</h2>
                   <p className="text-slate-500 text-sm">Welcome to Bethel! Please fill out your details.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                    <input type="text" className="w-full border border-slate-300 rounded-lg p-3" placeholder="Lal..." required />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Date of Birth</label>
                    <input type="date" className="w-full border border-slate-300 rounded-lg p-3" required />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Phone Number</label>
                    <input type="tel" className="w-full border border-slate-300 rounded-lg p-3" placeholder="+91..." required />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Previous Church (If any)</label>
                    <input type="text" className="w-full border border-slate-300 rounded-lg p-3" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Current Address (Veng)</label>
                    <textarea className="w-full border border-slate-300 rounded-lg p-3 h-24" placeholder="House No, Veng..." required></textarea>
                  </div>
                </div>
              </>
            )}

            {/* Baptism Form */}
            {activeTab === 'baptism' && (
              <>
                <div className="border-b border-slate-100 pb-4 mb-4">
                   <h2 className="text-2xl font-bold text-slate-800">Baptism Request</h2>
                   <p className="text-slate-500 text-sm">For infants or new believers.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Candidate Name</label>
                    <input type="text" className="w-full border border-slate-300 rounded-lg p-3" required />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Date of Birth</label>
                    <input type="date" className="w-full border border-slate-300 rounded-lg p-3" required />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Father's Name</label>
                    <input type="text" className="w-full border border-slate-300 rounded-lg p-3" required />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Mother's Name</label>
                    <input type="text" className="w-full border border-slate-300 rounded-lg p-3" required />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Preferred Date (Sunday)</label>
                    <input type="date" className="w-full border border-slate-300 rounded-lg p-3" />
                  </div>
                </div>
              </>
            )}

            {/* Marriage Form */}
            {activeTab === 'marriage' && (
              <>
                <div className="border-b border-slate-100 pb-4 mb-4">
                   <h2 className="text-2xl font-bold text-slate-800">Marriage Blessing Request</h2>
                   <p className="text-slate-500 text-sm">Submit details for wedding arrangements.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Groom's Name</label>
                    <input type="text" className="w-full border border-slate-300 rounded-lg p-3" required />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Bride's Name</label>
                    <input type="text" className="w-full border border-slate-300 rounded-lg p-3" required />
                  </div>
                   <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Proposed Date</label>
                    <input type="date" className="w-full border border-slate-300 rounded-lg p-3" required />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Contact Number</label>
                    <input type="tel" className="w-full border border-slate-300 rounded-lg p-3" required />
                  </div>
                </div>
              </>
            )}

            {/* Prayer Request */}
            {activeTab === 'prayer' && (
              <>
                <div className="border-b border-slate-100 pb-4 mb-4">
                   <h2 className="text-2xl font-bold text-slate-800">Prayer Request</h2>
                   <p className="text-slate-500 text-sm">Let us pray with you.</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Your Name (Optional)</label>
                    <input type="text" className="w-full border border-slate-300 rounded-lg p-3" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Prayer Request</label>
                    <textarea className="w-full border border-slate-300 rounded-lg p-3 h-32" placeholder="Share your burden..." required></textarea>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="private" className="mr-2" />
                    <label htmlFor="private" className="text-sm text-slate-600">Keep confidential (Pastors only)</label>
                  </div>
                </div>
              </>
            )}

            <button type="submit" className="w-full py-3 bg-church-600 text-white font-bold rounded-lg hover:bg-church-700 transition">
              Submit Request
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Membership;
