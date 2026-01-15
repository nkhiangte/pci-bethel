
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Globe, User, LogOut, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../services/firebase';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const { currentUser, userProfile, isAdmin } = useAuth();

  const navLinks = [
    { name: t.nav.home, path: '/' },
    { name: t.nav.upaBial, path: '/upa-bial' },
    { name: t.nav.missionaries, path: '/missionaries' }, // Added Missionaries
    { name: t.nav.articles, path: '/articles' },
    { name: t.nav.about, path: '/about' },
    { name: t.nav.events, path: '/events' },
    { name: t.nav.announcements, path: '/announcements' },
    { name: t.nav.departments, path: '/committees' },
    { name: t.nav.chanvo, path: '/inkhawm-chanvo' },
    { 
      name: t.nav.sundaySchool, 
      path: '#',
      children: [
        { name: t.sundaySchool.preBeginner, path: '/sundayschool/pre-beginner' },
        { name: t.sundaySchool.beginner, path: '/sundayschool/beginner' },
        { name: t.sundaySchool.primary, path: '/sundayschool/primary' },
        { name: t.sundaySchool.junior, path: '/sundayschool/junior' },
        { name: t.sundaySchool.intermediate, path: '/sundayschool/intermediate' },
        { name: t.sundaySchool.sacrament, path: '/sundayschool/sacrament' },
        { name: t.sundaySchool.senior, path: '/sundayschool/senior' },
        { name: t.sundaySchool.puitling, path: '/sundayschool/puitling' },
      ]
    },
    { 
      name: t.nav.fellowships, 
      path: '#',
      children: [
        { name: 'Kohhran Hmeichhia (KPVM)', path: '/fellowship/kpvm' },
        { name: 'Kristian Ṭhalai Pawl (KTP)', path: '/fellowship/ktp' },
        { name: 'Kohhran Pavalai Pawl', path: '/fellowship/pavlai' },
      ]
    },
    { 
      name: t.nav.members, 
      path: '#',
      children: [
        { name: 'Membership Forms', path: '/membership' },
        { name: t.nav.resources, path: '/resources' },
        { name: t.nav.giving, path: '/giving' },
      ]
    },
    { name: t.nav.records, path: '/records' },
    { name: t.nav.archives, path: '/archives' },
    { name: t.nav.gallery, path: '/gallery' },
    { name: t.nav.contact, path: '/contact' },
  ];

  const isActive = (path: string) => location.pathname === path;
  const isParentActive = (children: any[]) => children.some(child => location.pathname.startsWith(child.path));


  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'mizo' : 'en');
  };

  const toggleMobileMenu = (name: string) => {
    setMobileExpanded(prev => prev === name ? null : name);
  };

  const handleLogout = async () => {
    try {
      if (auth) {
        await auth.signOut();
      }
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // User provided specific logo URL
  const logoUrl = "https://i.ibb.co/mVw3Ftpw/PCI-logo.png";

  return (
    <nav className="bg-church-900 text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <img 
                src={logoUrl} 
                alt="PCI Logo" 
                className="h-10 w-10 object-contain drop-shadow-sm bg-white rounded-full p-0.5" 
                onError={(e) => {
                  e.currentTarget.src = "https://via.placeholder.com/40";
                  e.currentTarget.onerror = null;
                }}
              />
              <span className="font-bold text-xl leading-tight tracking-tight text-white">Champhai Bethel Kohhran</span>
            </Link>
          </div>
          
          <div className="hidden lg:block">
            <div className="ml-10 flex items-baseline flex-wrap gap-x-2">
              {navLinks.map((link) => (
                <div key={link.name} className="relative group z-50 h-full flex items-center">
                  {link.children ? (
                    <>
                      <button
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center ${
                          isParentActive(link.children)
                            ? 'text-white bg-church-800'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        {link.name}
                        <ChevronDown size={14} className="ml-1" />
                      </button>
                      
                      {/* Dropdown Menu with Gap Bridge (pt-2 instead of mt-2) */}
                      <div className="absolute left-0 top-full pt-2 w-56 hidden group-hover:block animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none py-1 overflow-hidden">
                          {link.children.map((child) => (
                            <Link
                              key={child.path}
                              to={child.path}
                              className={`block px-4 py-2 text-sm ${
                                isActive(child.path)
                                  ? 'bg-church-50 text-church-700 font-bold'
                                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                              }`}
                            >
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <Link
                      to={link.path}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                        isActive(link.path)
                          ? 'bg-church-800 text-white'
                          : 'text-slate-300 hover:bg-church-800 hover:text-white'
                      }`}
                    >
                      {link.name}
                    </Link>
                  )}
                </div>
              ))}
              
              {/* Admin Link (Only for admins) */}
              {isAdmin && (
                 <Link
                   to="/admin"
                   className="px-3 py-2 rounded-md text-sm font-medium text-red-400 hover:bg-church-800 flex items-center"
                 >
                   <Shield size={14} className="mr-1" /> Admin
                 </Link>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
             {/* Language Switcher Desktop/Mobile */}
            <button 
              onClick={toggleLanguage}
              className="flex items-center space-x-1 px-3 py-1 bg-church-800 rounded-full hover:bg-church-700 transition text-sm font-medium border border-church-700"
            >
              <Globe size={14} />
              <span>{language === 'en' ? 'EN' : 'MZ'}</span>
            </button>

            <div className="hidden lg:block">
              {currentUser ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-church-100 flex items-center">
                    <User size={14} className="mr-1" />
                    {userProfile?.displayName || t.auth.welcome}
                  </span>
                  <button 
                    onClick={handleLogout}
                    className="p-1.5 bg-church-800 rounded-full hover:bg-red-900 transition"
                    title={t.auth.logout}
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <Link to="/login" className="text-sm font-medium text-church-300 hover:text-white transition">
                  {t.auth.signIn}
                </Link>
              )}
            </div>

            <div className="-mr-2 flex lg:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-church-800 focus:outline-none"
              >
                <span className="sr-only">Open main menu</span>
                {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="lg:hidden bg-church-900 pb-4">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <div key={link.name}>
                {link.children ? (
                  <>
                    <button
                      onClick={() => toggleMobileMenu(link.name)}
                      className={`w-full flex justify-between items-center px-3 py-2 rounded-md text-base font-medium transition-colors ${
                         mobileExpanded === link.name ? 'bg-church-800 text-white' : 'text-slate-300 hover:bg-church-800 hover:text-white'
                      }`}
                    >
                      {link.name}
                      {mobileExpanded === link.name ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    
                    {mobileExpanded === link.name && (
                      <div className="pl-4 space-y-1 border-l-2 border-church-700 ml-2 mt-1 animate-in slide-in-from-top-1 duration-200">
                        {link.children.map((child) => (
                          <Link
                            key={child.path}
                            to={child.path}
                            onClick={() => setIsOpen(false)}
                            className={`block px-3 py-2 rounded-md text-sm font-medium ${
                              isActive(child.path)
                                ? 'bg-church-800 text-white'
                                : 'text-slate-400 hover:bg-church-800 hover:text-white'
                            }`}
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      isActive(link.path)
                        ? 'bg-church-800 text-white'
                        : 'text-slate-300 hover:bg-church-800 hover:text-white'
                    }`}
                  >
                    {link.name}
                  </Link>
                )}
              </div>
            ))}
            
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-orange-400 hover:bg-church-800"
              >
                Admin Dashboard
              </Link>
            )}

            <div className="border-t border-church-800 mt-4 pt-4 px-3">
              {currentUser ? (
                 <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-medium">{userProfile?.displayName || 'User'}</span>
                    <button onClick={handleLogout} className="text-sm text-red-300 hover:text-red-100">{t.auth.logout}</button>
                 </div>
              ) : (
                 <Link to="/login" className="block text-center w-full py-2 bg-church-700 rounded text-white" onClick={() => setIsOpen(false)}>
                   {t.auth.signIn}
                 </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
