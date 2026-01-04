
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Worship from './pages/Worship';
import Media from './pages/Media';
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
import Statistics from './pages/Statistics';
import Records from '@/pages/Records'; // Import the new page
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <HashRouter>
          <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900">
            <Navbar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/worship" element={<Worship />} />
                <Route path="/media" element={<Media />} />
                <Route path="/events" element={<Events />} />
                <Route path="/announcements" element={<Announcements />} />
                <Route path="/committees" element={<Departments />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/fellowship/:id" element={<Fellowship />} />
                <Route path="/membership" element={<Membership />} />
                <Route path="/resources" element={<Resources />} />
                <Route path="/giving" element={<Giving />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/gallery/*" element={<Gallery />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/statistics" element={<Statistics />} />
                <Route path="/records" element={<Records />} /> {/* Add new route */}
              </Routes>
            </main>
            <Footer />
          </div>
        </HashRouter>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;