
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Heart, Globe, Coffee, Home, Users, ArrowLeft, Calendar, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const CATEGORIES = [
  { id: 'pathian-ram', title: 'Pathian Ram', icon: Heart, color: 'bg-blue-600', description: 'General Fund & Tithes' },
  { id: 'ramthar', title: 'Ramthar', icon: Globe, color: 'bg-green-600', description: 'Mission Fund' },
  { id: 'refreshment', title: 'Refreshment', icon: Coffee, color: 'bg-orange-500', description: 'Tea & Snacks Ministry' },
  { id: 'building', title: 'Building', icon: Home, color: 'bg-purple-600', description: 'Church Building Fund' },
  { id: 'masihi-sangati', title: 'Masihi Sangati', icon: Users, color: 'bg-pink-600', description: 'Masihi Sangati Ministry' },
];

// Mock data generator for demo purposes
const generateMockData = (category: string) => {
  return Array.from({ length: 15 }).map((_, i) => ({
    id: `${category}-${i}`,
    name: `Member ${i + 1}`,
    amount: (Math.floor(Math.random() * 50) + 1) * 100,
    date: '2025-01-05',
    receiptNo: `R-${1000 + i}`
  }));
};

const Thawhlawm: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category');
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('January 2025');

  const handleCategoryClick = (id: string) => {
    setSearchParams({ category: id });
  };

  const handleBack = () => {
    setSearchParams({});
    setSearchTerm('');
  };

  const currentCategory = CATEGORIES.find(c => c.id === activeCategory);
  
  // In a real app, this would fetch from Firebase based on category and month
  const records = activeCategory ? generateMockData(activeCategory) : [];
  const filteredRecords = records.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalAmount = filteredRecords.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-serif font-bold text-church-900 mb-2">Thawhlawm Thawhna</h1>
          <p className="text-slate-600">Contribution Records & Reports</p>
        </div>

        {!activeCategory ? (
          /* Landing View: Categories */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:border-church-200 hover:-translate-y-1 transition-all duration-300 text-left group flex flex-col h-full"
              >
                <div className={`w-14 h-14 ${cat.color} rounded-xl flex items-center justify-center text-white mb-6 shadow-md group-hover:scale-110 transition-transform`}>
                  <cat.icon size={28} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2 group-hover:text-church-700 transition-colors">{cat.title}</h3>
                <p className="text-slate-500 text-sm mt-auto">{cat.description}</p>
              </button>
            ))}
          </div>
        ) : (
          /* Detail View */
          <div className="animate-in fade-in zoom-in duration-200">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div className="flex items-center">
                <button 
                  onClick={handleBack}
                  className="p-2 mr-4 bg-white border border-slate-200 rounded-full text-slate-500 hover:text-church-600 hover:border-church-300 transition-all shadow-sm group"
                >
                  <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                </button>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${currentCategory?.color} text-white`}>
                        {currentCategory && <currentCategory.icon size={20} />}
                    </div>
                    {currentCategory?.title}
                  </h2>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                 <div className="relative">
                    <select 
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="appearance-none bg-white border border-slate-200 pl-10 pr-10 py-2.5 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-church-500 cursor-pointer shadow-sm w-full"
                    >
                        <option>January 2025</option>
                        <option>December 2024</option>
                        <option>November 2024</option>
                    </select>
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                 </div>
                 
                 <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search name..." 
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-church-500 outline-none shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                 </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                {/* Summary Header */}
                <div className="bg-slate-50 p-6 border-b border-slate-200 flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Collection</p>
                        <p className="text-2xl font-black text-church-900">₹ {totalAmount.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Month</p>
                        <p className="text-lg font-bold text-slate-800">{selectedMonth}</p>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Receipt No</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4 text-right">Amount (₹)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredRecords.length > 0 ? (
                                filteredRecords.map((record) => (
                                    <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">{record.name}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500 font-mono">{record.receiptNo}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500">{record.date}</td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-700">
                                            {record.amount.toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                                        No records found for "{searchTerm}".
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {filteredRecords.length > 0 && (
                            <tfoot className="bg-slate-50 font-bold text-slate-800">
                                <tr>
                                    <td colSpan={3} className="px-6 py-4 text-right">Total</td>
                                    <td className="px-6 py-4 text-right">{totalAmount.toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
            
            <p className="text-center text-xs text-slate-400 mt-8">
                * Note: These records are updated periodically. For discrepancies, please contact the Finance Committee.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Thawhlawm;
