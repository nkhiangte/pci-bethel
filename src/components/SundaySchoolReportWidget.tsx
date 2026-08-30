import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SSWeeklyReport, SSReportSegment } from '../types';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { 
  Calendar, 
  Users, 
  Sparkles, 
  TrendingUp, 
  ArrowRight, 
  BookOpen, 
  ChevronDown, 
  Edit, 
  Loader2 
} from 'lucide-react';
import { getMizoDayName, parseLocalDate } from '../hooks/useWeeklyEvents';

interface ReportSegmentTableProps {
  title: string;
  subtitle?: string;
  segment: SSReportSegment;
  theme: 'slate' | 'emerald';
}

const ReportSegmentTable: React.FC<ReportSegmentTableProps> = ({
  title,
  subtitle,
  segment,
  theme
}) => {
  const isEmerald = theme === 'emerald';
  const headerBg = isEmerald ? 'bg-emerald-800' : 'bg-slate-800';
  const headerBadge = isEmerald ? 'bg-emerald-700/60 text-emerald-100 border-emerald-600' : 'bg-slate-700/60 text-slate-200 border-slate-600';
  const textTheme = isEmerald ? 'text-emerald-950' : 'text-slate-950';
  const accentBg = isEmerald ? 'bg-emerald-50/70' : 'bg-slate-50/70';
  const totalBg = isEmerald ? 'bg-emerald-100/60' : 'bg-slate-100/70';
  const iconColor = isEmerald ? 'text-emerald-300' : 'text-slate-300';

  const zirtirtuKal = segment?.zirtirtu?.kal || 0;
  const zirtirtuKallo = segment?.zirtirtu?.kallo || 0;
  const zirtuKal = segment?.zirtu?.kal || 0;
  const zirtuKallo = segment?.zirtu?.kallo || 0;
  const chhimtu = segment?.chhimtu || 0;
  const thawhlawm = segment?.thawhlawm || 0;

  const totalKal = zirtirtuKal + zirtuKal + chhimtu;
  const totalKallo = zirtirtuKallo + zirtuKallo;
  const grandTotal = totalKal + totalKallo;

  return (
    <div className={`overflow-hidden rounded-2xl border ${isEmerald ? 'border-emerald-200 shadow-sm' : 'border-slate-200 shadow-sm'}`}>
      <div className={`${headerBg} px-4 md:px-6 py-3.5 flex items-center justify-between text-white`}>
        <div className="flex items-center gap-2.5">
          {isEmerald ? <Sparkles size={18} className={iconColor} /> : <Users size={18} className={iconColor} />}
          <div>
            <h4 className="text-xs md:text-sm font-black uppercase tracking-wider text-white">{title}</h4>
            {subtitle && <p className="text-[10px] text-slate-300 font-medium">{subtitle}</p>}
          </div>
        </div>
        <span className={`text-[9px] md:text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${headerBadge}`}>
          Department
        </span>
      </div>

      <div className="overflow-x-auto bg-white">
        <table className="w-full text-left min-w-[320px]">
          <thead>
            <tr className="bg-slate-900 text-white text-[11px] md:text-xs font-black uppercase tracking-wider border-b border-slate-800">
              <th className="px-4 md:px-6 py-3.5 text-white font-black">Hming / Role</th>
              <th className="px-3 md:px-5 py-3.5 text-center text-white font-black">Kal</th>
              <th className="px-3 md:px-5 py-3.5 text-center text-white font-black">Kal lo</th>
              <th className="px-3 md:px-5 py-3.5 text-center text-white font-black">Total</th>
              <th className="px-4 md:px-6 py-3.5 text-right text-white font-black">Thawhlawm</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            <tr className="hover:bg-slate-50/50 transition-colors">
              <td className={`px-4 md:px-6 py-3.5 font-bold ${textTheme}`}>Zirtirtu</td>
              <td className={`px-3 md:px-5 py-3.5 text-center font-black ${textTheme}`}>{zirtirtuKal}</td>
              <td className="px-3 md:px-5 py-3.5 text-center text-slate-400 font-bold">{zirtirtuKallo}</td>
              <td className="px-3 md:px-5 py-3.5 text-center font-black text-slate-600">{zirtirtuKal + zirtirtuKallo}</td>
              <td className="px-4 md:px-6 py-3.5 text-right text-slate-400 font-mono text-xs">-</td>
            </tr>
            <tr className={`${accentBg} hover:bg-slate-100/40 transition-colors`}>
              <td className={`px-4 md:px-6 py-3.5 font-bold ${textTheme}`}>Zirtu</td>
              <td className={`px-3 md:px-5 py-3.5 text-center font-black ${textTheme}`}>{zirtuKal}</td>
              <td className="px-3 md:px-5 py-3.5 text-center text-slate-400 font-bold">{zirtuKallo}</td>
              <td className="px-3 md:px-5 py-3.5 text-center font-black text-slate-600">{zirtuKal + zirtuKallo}</td>
              <td className="px-4 md:px-6 py-3.5 text-right text-slate-400 font-mono text-xs">-</td>
            </tr>
            <tr className="hover:bg-slate-50/50 transition-colors">
              <td className={`px-4 md:px-6 py-3.5 font-bold ${textTheme}`}>Chhimtu</td>
              <td className={`px-3 md:px-5 py-3.5 text-center font-black ${textTheme}`}>{chhimtu}</td>
              <td className="px-3 md:px-5 py-3.5 text-center text-slate-400 font-bold">-</td>
              <td className="px-3 md:px-5 py-3.5 text-center font-black text-slate-600">{chhimtu}</td>
              <td className="px-4 md:px-6 py-3.5 text-right text-slate-400 font-mono text-xs">-</td>
            </tr>
            <tr className={`${totalBg} font-black border-t-2 border-slate-200`}>
              <td className={`px-4 md:px-6 py-4 text-xs font-black uppercase tracking-wider ${textTheme}`}>Department Total</td>
              <td className={`px-3 md:px-5 py-4 text-center text-lg md:text-xl font-black ${textTheme}`}>{totalKal}</td>
              <td className="px-3 md:px-5 py-4 text-center text-sm md:text-base text-slate-500 font-bold">{totalKallo}</td>
              <td className={`px-3 md:px-5 py-4 text-center text-lg md:text-xl font-black ${textTheme}`}>{grandTotal}</td>
              <td className={`px-4 md:px-6 py-4 text-right ${textTheme}`}>
                <span className="font-mono text-base md:text-lg font-black text-church-700">₹ {thawhlawm.toLocaleString()}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SundaySchoolReportWidget: React.FC = () => {
  const { isAdmin } = useAuth();
  const [reports, setReports] = useState<SSWeeklyReport[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchReports = async () => {
      if (!db || !db.collection) {
        setLoading(false);
        return;
      }
      try {
        const snapshot = await db.collection('sundaySchoolWeeklyReports')
          .orderBy('date', 'desc')
          .limit(10)
          .get();

        if (!snapshot.empty) {
          const fetchedReports = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data()
          })) as SSWeeklyReport[];
          setReports(fetchedReports);
        }
      } catch (error) {
        console.error('Error fetching Sunday School weekly reports for homepage:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  if (loading) {
    return (
      <section className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
        <div className="flex items-center justify-center py-12 text-slate-400 gap-3">
          <Loader2 className="animate-spin text-church-500" size={24} />
          <span className="text-sm font-bold">Loading Sunday School Report...</span>
        </div>
      </section>
    );
  }

  if (reports.length === 0) {
    return (
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-serif font-bold text-slate-900">Sunday School Weekly Report</h2>
            {isAdmin && (
              <Link
                to="/sundayschool/report"
                className="p-2 bg-church-50 text-church-600 rounded-full hover:bg-church-100 transition shadow-sm"
                title="Manage Sunday School Reports"
              >
                <Edit size={18} />
              </Link>
            )}
          </div>
          <Link
            to="/sundayschool/report"
            className="text-sm font-bold text-church-600 hover:text-church-700 flex items-center"
          >
            Sunday School Reports <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>

        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-10 text-center shadow-sm">
          <BookOpen className="mx-auto text-slate-300 mb-3" size={40} />
          <p className="text-slate-500 font-medium">Sunday School Weekly Report tarlan tur a la awm rih lo.</p>
          <Link
            to="/sundayschool"
            className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-church-50 text-church-700 rounded-xl font-bold text-xs hover:bg-church-100 transition"
          >
            Visit Sunday School Department <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    );
  }

  const currentReport = reports[selectedIndex] || reports[0];

  const puitlingKal = (currentReport.puitling?.zirtirtu?.kal || 0) + (currentReport.puitling?.zirtu?.kal || 0) + (currentReport.puitling?.chhimtu || 0);
  const naupangKal = (currentReport.naupang?.zirtirtu?.kal || 0) + (currentReport.naupang?.zirtu?.kal || 0) + (currentReport.naupang?.chhimtu || 0);
  const totalAttendance = puitlingKal + naupangKal;

  const puitlingKallo = (currentReport.puitling?.zirtirtu?.kallo || 0) + (currentReport.puitling?.zirtu?.kallo || 0);
  const naupangKallo = (currentReport.naupang?.zirtirtu?.kallo || 0) + (currentReport.naupang?.zirtu?.kallo || 0);
  const totalAbsent = puitlingKallo + naupangKallo;

  const totalThawhlawm = (currentReport.puitling?.thawhlawm || 0) + (currentReport.naupang?.thawhlawm || 0);

  const dateObj = currentReport.date ? parseLocalDate(currentReport.date) : new Date();
  const formattedDate = `${getMizoDayName(dateObj)}, ${dateObj.getDate()} ${dateObj.toLocaleString('default', { month: 'long', year: 'numeric' })}`;

  return (
    <section>
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-church-100 text-church-700 flex items-center justify-center font-bold">
            <BookOpen size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-serif font-bold text-slate-900">Sunday School Weekly Report</h2>
              {isAdmin && (
                <Link
                  to="/sundayschool/report"
                  className="p-1.5 bg-church-50 text-church-600 rounded-full hover:bg-church-100 transition shadow-sm"
                  title="Edit in Sunday School"
                >
                  <Edit size={16} />
                </Link>
              )}
            </div>
            <p className="text-slate-500 text-xs font-medium">Naupang leh Puitling Sunday School inkhawm leh thawhlawm report</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Week Selector if multiple reports */}
          {reports.length > 1 && (
            <div className="relative">
              <select
                value={selectedIndex}
                onChange={(e) => setSelectedIndex(Number(e.target.value))}
                className="appearance-none bg-white border border-slate-200 text-slate-700 text-xs font-bold py-2 pl-3 pr-8 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-church-500 cursor-pointer"
              >
                {reports.map((r, idx) => (
                  <option key={r.id || idx} value={idx}>
                    {new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    {idx === 0 ? ' (Latest)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          )}

          <Link
            to="/sundayschool/report"
            className="text-xs font-bold text-church-600 hover:text-church-700 flex items-center shrink-0"
          >
            View All Reports <ArrowRight size={14} className="ml-1" />
          </Link>
        </div>
      </div>

      {/* Main Report Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Date Banner */}
        <div className="bg-slate-900 text-white px-6 py-4 md:px-8 md:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-church-600 rounded-xl shadow">
              <Calendar size={18} className="text-white" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-church-300 block">Report Date</span>
              <span className="font-serif font-black text-lg md:text-xl text-white">
                {formattedDate}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-white/10 text-church-200 rounded-full text-[10px] font-black uppercase tracking-wider border border-white/10">
              Sunday School Record
            </span>
          </div>
        </div>

        {/* Tables Grid */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Puitling Sunday School Table */}
            <div>
              <ReportSegmentTable
                title="Puitling Sunday School"
                subtitle="Adult Department"
                segment={currentReport.puitling}
                theme="slate"
              />
            </div>

            {/* Naupang Sunday School Table */}
            <div>
              <ReportSegmentTable
                title="Naupang Sunday School"
                subtitle="Children Department"
                segment={currentReport.naupang}
                theme="emerald"
              />
            </div>
          </div>

          {/* Grand Summary Bar */}
          <div className="bg-gradient-to-br from-church-900 to-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3.5 bg-church-600 rounded-2xl text-white shadow-lg shrink-0">
                  <TrendingUp size={28} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-church-300 uppercase tracking-[0.25em]">Kohhran Pum Record</h4>
                  <p className="text-xl md:text-2xl font-serif font-black text-white">Grand Total Summary</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                  <p className="text-[9px] font-black text-church-200 uppercase tracking-wider mb-1">Inkhawm Zat (Kal)</p>
                  <p className="text-2xl md:text-3xl font-black text-white">{totalAttendance}</p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-wider mb-1">Kal lo Zat</p>
                  <p className="text-2xl md:text-3xl font-black text-slate-200">{totalAbsent}</p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10 col-span-2 sm:col-span-1">
                  <p className="text-[9px] font-black text-church-200 uppercase tracking-wider mb-1">Total Thawhlawm</p>
                  <p className="text-2xl md:text-3xl font-black font-mono text-church-300">₹ {totalThawhlawm.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SundaySchoolReportWidget;
