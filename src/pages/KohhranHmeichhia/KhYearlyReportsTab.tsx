import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { FileText, Loader, Trash2, Upload, AlertCircle, Plus } from 'lucide-react';

interface KhYearlyReportPdf {
  id: string;
  name: string;
  url: string;
  storagePath: string;
  year: number;
  uploadedAt: string;
}

const KhYearlyReportsTab: React.FC = () => {
  const { isAdmin } = useAuth();
  const [reports, setReports] = useState<KhYearlyReportPdf[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewingPdf, setViewingPdf] = useState<KhYearlyReportPdf | null>(null);
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newYear, setNewYear] = useState<number>(new Date().getFullYear());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchReports = async () => {
    if (!db?.collection) return;
    try {
      setLoading(true);
      const snapshot = await db.collection('khYearlyReportsPdfs').get();
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KhYearlyReportPdf));
      docs.sort((a, b) => b.year - a.year);
      setReports(docs);
      if (docs.length > 0 && !viewingPdf) {
        setViewingPdf(docs[0]);
      }
    } catch (e) {
      console.error("Failed to fetch reports", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUploadPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    if (file.type !== 'application/pdf') {
      alert('Only PDF files are allowed.');
      return;
    }

    setUploading(true);

    try {
      const { storage } = await import('../../services/firebase');
      if (!storage) throw new Error('Storage not available');

      const path = `khYearlyReports/${newYear}_${Date.now()}_${file.name}`;
      const ref = storage.ref(path);
      await ref.put(file);
      const url = await ref.getDownloadURL();

      const newPdf = {
        name: file.name,
        url,
        storagePath: path,
        year: newYear,
        uploadedAt: new Date().toISOString()
      };

      await db.collection('khYearlyReportsPdfs').add(newPdf);
      
      setShowUploadModal(false);
      await fetchReports();
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload report.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (report: KhYearlyReportPdf) => {
    if (!window.confirm(`Delete report for year ${report.year}?`)) return;
    try {
      const { storage } = await import('../../services/firebase');
      if (storage && report.storagePath) {
        try {
          await storage.ref(report.storagePath).delete();
        } catch (_) {}
      }
      await db.collection('khYearlyReportsPdfs').doc(report.id).delete();
      if (viewingPdf?.id === report.id) setViewingPdf(null);
      await fetchReports();
    } catch (e) {
      console.error(e);
      alert("Failed to delete report.");
    }
  };

  if (loading) return <div className="p-12 text-center"><Loader className="animate-spin mx-auto text-church-500" /></div>;

  return (
    <div className="animate-in fade-in duration-300">
      
      {showUploadModal && isAdmin && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-xl font-bold mb-4">Upload Yearly Report</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-700 mb-1">Year</label>
              <input 
                type="number" 
                value={newYear} 
                onChange={e => setNewYear(parseInt(e.target.value))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-church-500"
              />
            </div>
            
            <input 
              type="file" 
              accept=".pdf" 
              ref={fileInputRef}
              onChange={handleUploadPdf}
              className="hidden"
            />
            
            <div className="flex gap-2 justify-end">
              <button 
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                disabled={uploading}
              >
                Cancel
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 bg-church-600 text-white font-bold rounded-xl hover:bg-church-700 flex items-center gap-2"
              >
                {uploading ? <Loader size={16} className="animate-spin"/> : <Upload size={16}/>}
                Select PDF
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="w-full lg:w-64 shrink-0 space-y-3">
           <div className="flex items-center justify-between mb-2">
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Yearly Reports</h3>
             {isAdmin && (
               <button 
                 onClick={() => setShowUploadModal(true)}
                 className="p-1.5 bg-church-600 text-white rounded-lg hover:bg-church-700 shadow-sm"
               >
                 <Plus size={14}/>
               </button>
             )}
           </div>

           {reports.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed">
                <p className="text-slate-400 text-sm italic">No reports yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2">
                {reports.map(report => (
                  <div 
                    key={report.id}
                    onClick={() => setViewingPdf(report)}
                    className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                      viewingPdf?.id === report.id 
                        ? 'bg-church-600 border-church-600 text-white shadow-lg shadow-church-200 translate-x-1' 
                        : 'bg-white border-slate-100 text-slate-600 hover:border-church-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FileText size={16} className={viewingPdf?.id === report.id ? 'text-yellow-300' : 'text-church-500'} />
                      <span className="font-bold">{report.year}</span>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(report); }}
                          className={`p-1 rounded ${viewingPdf?.id === report.id ? 'hover:bg-church-500 text-white' : 'hover:bg-red-50 text-red-600'}`}
                        >
                          <Trash2 size={12}/>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
        </div>

        {/* Viewer */}
        <div className="flex-1 min-w-0">
          {!viewingPdf ? (
             <div className="h-96 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-100 shadow-sm text-slate-400">
               <FileText size={48} className="mb-4 opacity-20" />
               <p className="font-bold">Select a report year to view PDF</p>
             </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 h-[80vh] min-h-[600px] overflow-hidden flex flex-col">
               <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                 <h2 className="font-bold text-slate-800 flex items-center gap-2">
                   <FileText size={20} className="text-church-600"/>
                   Yearly Report {viewingPdf.year}
                 </h2>
                 <a 
                   href={viewingPdf.url}
                   target="_blank"
                   rel="noreferrer"
                   className="text-sm font-bold text-church-600 hover:text-church-800"
                 >
                   Open in New Tab
                 </a>
               </div>
               <iframe 
                  src={`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(viewingPdf.url)}`}
                  className="w-full flex-1 border-none"
                  title={viewingPdf.name}
               />
            </div>
          )}
        </div>
      </div>
    
    </div>
  );
};

export default KhYearlyReportsTab;
