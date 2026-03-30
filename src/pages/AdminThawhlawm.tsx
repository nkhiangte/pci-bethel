
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import { 
  Search, CheckCircle2, XCircle, Eye, Loader, 
  Calendar, DollarSign, Filter, ChevronDown, 
  ArrowLeft, Download, Database
} from 'lucide-react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';

interface Contribution {
  id: string;
  name: string;
  bial: string;
  month: string;
  year: string;
  totalAmount: number;
  category: string;
  status: 'pending' | 'verified' | 'rejected';
  screenshotUrl: string;
  timestamp: string;
  amounts: {
    pathianRam: number;
    ramthar: number;
    tualchhung: number;
  };
}

const AdminThawhlawm: React.FC = () => {
  const { isAdmin } = useAuth();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchContributions();
  }, []);

  const fetchContributions = async () => {
    setLoading(true);
    if (!db || !db.collection) {
        setLoading(false);
        return;
    }

    try {
      const snapshot = await db.collection('thawhlawm').orderBy('timestamp', 'desc').get();
      const data = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as Contribution[];
      setContributions(data);
    } catch (error) {
      console.error("Error fetching contributions:", error);
    }
    setLoading(false);
  };

  const handleStatusUpdate = async (id: string, newStatus: 'verified' | 'rejected') => {
    if (!db || !db.collection) return;
    setProcessingId(id);
    try {
        await db.collection('thawhlawm').doc(id).update({ status: newStatus });
        setContributions(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
    } catch (error) {
        console.error("Error updating status:", error);
        alert("Failed to update status.");
    }
    setProcessingId(null);
  };

  const handleExport = () => {
    const dataToExport = filteredContributions.map(c => ({
        Date: new Date(c.timestamp).toLocaleDateString(),
        Name: c.name,
        Bial: c.bial,
        Month: `${c.month} ${c.year}`,
        Category: c.category,
        'Pathian Ram': c.amounts?.pathianRam || 0,
        'Ramthar': c.amounts?.ramthar || 0,
        'Tualchhung': c.amounts?.tualchhung || 0,
        'Total Amount': c.totalAmount,
        Status: c.status
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contributions");
    XLSX.writeFile(wb, `Contributions_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredContributions = contributions.filter(c => {
      const matchesSearch = 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.bial.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = statusFilter === 'all' || c.status === statusFilter;
      return matchesSearch && matchesFilter;
  });

  if (!isAdmin) return <div className="p-10 text-center text-red-500 font-bold">Access Denied</div>;

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <Link to="/admin" className="flex items-center text-slate-500 hover:text-church-600 mb-2 transition">
                    <ArrowLeft size={16} className="mr-1"/> Back to Dashboard
                </Link>
                <h1 className="text-3xl font-serif font-bold text-church-900">Manage Contributions</h1>
                <p className="text-slate-600 text-sm">Verify and track online Thawhlawm payments.</p>
            </div>
            <button 
                onClick={handleExport}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition shadow-sm font-bold text-sm"
            >
                <Download size={16} /> Export to Excel
            </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto flex-1">
                <div className="bg-white text-slate-600 px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm whitespace-nowrap border border-slate-200 w-full sm:w-auto justify-center sm:justify-start ring-1 ring-slate-100">
                    <div className="bg-church-50 p-1.5 rounded-md">
                        <Database size={14} className="text-church-600" />
                    </div>
                    <span>{filteredContributions.length} Records</span>
                </div>
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by Name or Bial..." 
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-church-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
                {['all', 'pending', 'verified', 'rejected'].map(status => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold capitalize whitespace-nowrap transition ${
                            statusFilter === status 
                            ? 'bg-church-600 text-white shadow-md' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        {status}
                    </button>
                ))}
            </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-900 text-white text-xs uppercase font-bold tracking-wider">
                        <tr>
                            <th className="p-4">Date</th>
                            <th className="p-4">Name / Bial</th>
                            <th className="p-4">Category / Period</th>
                            <th className="p-4 text-right">Amount</th>
                            <th className="p-4 text-center">Proof</th>
                            <th className="p-4 text-center">Status</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        {loading ? (
                            <tr><td colSpan={7} className="p-8 text-center"><Loader className="animate-spin mx-auto text-church-600"/></td></tr>
                        ) : filteredContributions.length === 0 ? (
                            <tr><td colSpan={7} className="p-8 text-center text-slate-500 italic">No records found.</td></tr>
                        ) : (
                            filteredContributions.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 transition">
                                    <td className="p-4 text-slate-500 whitespace-nowrap">
                                        {new Date(item.timestamp).toLocaleDateString()}
                                        <div className="text-xs">{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-900">{item.name}</div>
                                        <div className="text-xs text-slate-500 bg-slate-100 inline-block px-1.5 py-0.5 rounded mt-1">{item.bial}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-medium capitalize text-church-700">{item.category?.replace('-', ' ')}</div>
                                        <div className="text-xs text-slate-500">{item.month} {item.year}</div>
                                    </td>
                                    <td className="p-4 text-right font-mono font-bold text-slate-800">
                                        ₹{item.totalAmount.toLocaleString()}
                                    </td>
                                    <td className="p-4 text-center">
                                        {item.screenshotUrl && (
                                            <button 
                                                onClick={() => setSelectedImage(item.screenshotUrl)}
                                                className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                                                title="View Screenshot"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        )}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                                            item.status === 'verified' ? 'bg-green-100 text-green-700' :
                                            item.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        {processingId === item.id ? (
                                            <Loader size={16} className="animate-spin ml-auto text-slate-400"/>
                                        ) : (
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => handleStatusUpdate(item.id, 'verified')}
                                                    className={`p-1.5 rounded-lg transition ${item.status === 'verified' ? 'text-slate-300 cursor-not-allowed' : 'text-green-600 hover:bg-green-50'}`}
                                                    disabled={item.status === 'verified'}
                                                    title="Verify Payment"
                                                >
                                                    <CheckCircle2 size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleStatusUpdate(item.id, 'rejected')}
                                                    className={`p-1.5 rounded-lg transition ${item.status === 'rejected' ? 'text-slate-300 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'}`}
                                                    disabled={item.status === 'rejected'}
                                                    title="Reject Payment"
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Screenshot Modal */}
        {selectedImage && (
            <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setSelectedImage(null)}>
                <div className="relative max-w-lg w-full bg-white p-2 rounded-xl" onClick={e => e.stopPropagation()}>
                    <button 
                        onClick={() => setSelectedImage(null)}
                        className="absolute -top-12 right-0 text-white hover:text-slate-300 transition"
                    >
                        Close <span className="ml-2 bg-white/20 px-2 rounded">ESC</span>
                    </button>
                    <img src={selectedImage} alt="Payment Proof" className="w-full h-auto rounded-lg" />
                    <div className="text-center mt-2">
                        <a href={selectedImage} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">Open Original</a>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default AdminThawhlawm;
