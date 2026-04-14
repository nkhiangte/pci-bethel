import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import Home from './pages/Home';
import About from './pages/About';
import Events from './pages/Events';
import Calendar from './pages/Calendar';
import Announcements from './pages/Announcements';
import Departments from './pages/Departments';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Fellowship from './pages/Fellowship';
import KtpLayout from './pages/KTP/KtpLayout';
import KtpLeaders from './pages/KTP/KtpLeaders';
import KtpSubCommittees from './pages/KTP/KtpSubCommittees';
import KtpBudget from './pages/KTP/KtpBudget';
import KtpMembers from './pages/KTP/KtpMembers';
import KtpHistory from './pages/KTP/KtpHistory';
import KtpHistoryOverview from './pages/KTP/KtpHistoryOverview';
import KtpMinutesArchives from './pages/KTP/KtpMinutesArchives';
import KtpYearlyReports from './pages/KTP/KtpYearlyReports';
import KtpGallery from './pages/KTP/KtpGallery';
import KtpProductions from './pages/KTP/KtpProductions';
import KtpWhosWho from './pages/KTP/KtpWhosWho';
import KppLayout from './pages/KPP/KppLayout';
import KppLeaders from './pages/KPP/KppLeaders';
import KppMembers from './pages/KPP/KppMembers';
import KppGallery from './pages/KPP/KppGallery';
import KhLayout from './pages/KohhranHmeichhia/KhLayout';
import KhLeaders from './pages/KohhranHmeichhia/KhLeaders';
import KhMembers from './pages/KohhranHmeichhia/KhMembers';
import KhGallery from './pages/KohhranHmeichhia/KhGallery';
import KhReports from './pages/KohhranHmeichhia/KhReports';
import Contact from './pages/Contact';
import Gallery from './pages/Gallery';
import AdminDashboard from './pages/AdminDashboard';
import AdminMinistries from './pages/AdminMinistries';
import AdminDuties from './pages/AdminDuties'; 
import AdminUsers from './pages/AdminUsers'; 
import AdminThawhlawm from './pages/AdminThawhlawm';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import SundaySchool from './pages/SundaySchool';
import SundaySchoolDashboard from './pages/SundaySchoolDashboard';
import Statistics from './pages/Statistics';
import Records from './pages/Records';
import Archives from './pages/Archives'; 
import InkhawmChanvo from './pages/InkhawmChanvo';
import UpaBial from './pages/UpaBial'; 
import Articles from './pages/Articles'; 
import Missionaries from './pages/Missionaries'; 
import Thawhlawm from './pages/Thawhlawm';
import CommitteeDetail from './pages/CommitteeDetail';
import Directory from './pages/Directory';

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ErrorBoundary>
          <HashRouter>
          <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900">

            {/* Banner is the background of the navbar — fixed so it never moves on scroll */}
            <div
              className="sticky top-0 z-50"
              style={{
                backgroundImage: 'url(https://i.ibb.co/V06hg04Q/WEBBAN.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center top',
                backgroundRepeat: 'no-repeat',
              }}
            >
              <Navbar />
            </div>

            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/upa-bial" element={<UpaBial />} />
                <Route path="/missionaries" element={<Missionaries />} />
                <Route path="/articles" element={<Articles />} /> 
                <Route path="/about" element={<About />} />
                <Route path="/events" element={<Events />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/announcements" element={<Announcements />} />
                <Route path="/committees" element={<Departments />} />
                <Route path="/committees/:id" element={<CommitteeDetail />} />
                <Route path="/sundayschool/dashboard" element={<SundaySchoolDashboard />} />
                <Route path="/sundayschool/:departmentId/:section?" element={<SundaySchool />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/fellowship/:id" element={<Fellowship />} />
          
          {/* KTP Routes */}
          <Route path="/ktp" element={<KtpLayout />}>
            <Route index element={<Navigate to="/ktp/leaders" replace />} />
            <Route path="leaders" element={<KtpLeaders />} />
            <Route path="sub-committees" element={<KtpSubCommittees />} />
            <Route path="project-budget" element={<KtpBudget />} />
            <Route path="members" element={<KtpMembers />} />
            <Route path="history" element={<KtpHistory />}>
              <Route index element={<KtpHistoryOverview />} />
              <Route path="minutes" element={<KtpMinutesArchives />} />
              <Route path="yearly-reports" element={<KtpYearlyReports />} />
            </Route>
            <Route path="gallery" element={<KtpGallery />} />
            <Route path="gallery/:folderId" element={<KtpGallery />} />
            <Route path="productions" element={<KtpProductions />} />
            <Route path="productions/:folderId" element={<KtpProductions />} />
            <Route path="whoswho" element={<KtpWhosWho />} />
          </Route>

          {/* KPP Routes */}
          <Route path="/kpp" element={<KppLayout />}>
            <Route index element={<Navigate to="/kpp/leaders" replace />} />
            <Route path="leaders" element={<KppLeaders />} />
            <Route path="members" element={<KppMembers />} />
            <Route path="gallery" element={<KppGallery />} />
          </Route>

          {/* Kohhran Hmeichhia Routes */}
          <Route path="/kohhran-hmeichhia" element={<KhLayout />}>
            <Route index element={<Navigate to="/kohhran-hmeichhia/leaders" replace />} />
            <Route path="leaders" element={<KhLeaders />} />
            <Route path="members" element={<KhMembers />} />
            <Route path="reports" element={<KhReports />} />
            <Route path="gallery" element={<KhGallery />} />
          </Route>
                <Route path="/contact" element={<Contact />} />
                <Route path="/gallery/*" element={<Gallery />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/ministries" element={<AdminMinistries />} />
                <Route path="/admin/duties" element={<AdminDuties />} /> 
                <Route path="/admin/users" element={<AdminUsers />} /> 
                <Route path="/admin/thawhlawm" element={<AdminThawhlawm />} /> 
                <Route path="/statistics" element={<Statistics />} />
                <Route path="/records" element={<Records />} /> 
                <Route path="/directory" element={<Directory />} /> 
                <Route path="/archives" element={<Archives />} />
                <Route path="/inkhawm-chanvo" element={<InkhawmChanvo />} />
                <Route path="/thawhlawm" element={<Thawhlawm />} />
              </Routes>
            </main>
            <Chatbot />
            <Footer />
          </div>
        </HashRouter>
      </ErrorBoundary>
    </AuthProvider>
  </LanguageProvider>
  );
};

export default App;
