
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import Home from './pages/Home';
import About from './pages/About';
import Events from './pages/Events';
import Announcements from './pages/Announcements';
import Departments from './pages/Departments';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Fellowship from './pages/Fellowship';
import Membership from './pages/Membership';
import Resources from './pages/Resources';
import Giving from './pages/Giving';
import Contact from './pages/Contact';
import Gallery from './pages/Gallery';
import AdminDashboard from './pages/AdminDashboard';
import AdminMinistries from './pages/AdminMinistries';
import AdminDuties from './pages/AdminDuties'; 
import AdminUsers from './pages/AdminUsers'; 
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import SundaySchool from './pages/SundaySchool';
import Statistics from './pages/Statistics';
import Records from './pages/Records';
import Archives from './pages/Archives'; 
import InkhawmChanvo from './pages/InkhawmChanvo';
import UpaBial from './pages/UpaBial'; 
import Articles from './pages/Articles'; 
import Missionaries from './pages/Missionaries'; 
import Thawhlawm from './pages/Thawhlawm';

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <HashRouter>
          <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900">
            <Navbar />
            <div className="w-full bg-slate-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                <div className="rounded-2xl overflow-hidden shadow-sm">
                  <img 
                    src="https://i.ibb.co/V06hg04Q/WEBBAN.png" 
                    alt="Mizoram Synod Champhai Bethel Kohhran Banner" 
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </div>
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/upa-bial" element={<UpaBial />} />
                <Route path="/missionaries" element={<Missionaries />} />
                <Route path="/articles" element={<Articles />} /> 
                <Route path="/about" element={<About />} />
                <Route path="/events" element={<Events />} />
                <Route path="/announcements" element={<Announcements />} />
                <Route path="/committees" element={<Departments />} />
                <Route path="/sundayschool/:departmentId" element={<SundaySchool />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/fellowship/:id" element={<Fellowship />} />
                <Route path="/membership" element={<Membership />} />
                <Route path="/resources" element={<Resources />} />
                <Route path="/giving" element={<Giving />} />
                <Route path="/thawhlawm" element={<Thawhlawm />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/gallery/*" element={<Gallery />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/ministries" element={<AdminMinistries />} />
                <Route path="/admin/duties" element={<AdminDuties />} /> 
                <Route path="/admin/users" element={<AdminUsers />} /> 
                <Route path="/statistics" element={<Statistics />} />
                <Route path="/records" element={<Records />} /> 
                <Route path="/archives" element={<Archives />} />
                <Route path="/inkhawm-chanvo" element={<InkhawmChanvo />} />
              </Routes>
            </main>
            <Chatbot />
            <Footer />
          </div>
        </HashRouter>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;
