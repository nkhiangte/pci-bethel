
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, ChevronDown, ChevronUp, Shield, ExternalLink, Calculator } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../services/firebase';
import { PathianRamModal } from './PathianRamModal';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string[]>([]);
  const [pathianRamModalOpen, setPathianRamModalOpen] = useState(false);
  const location = useLocation();
  const { t } = useLanguage();
  const { currentUser, userProfile, isAdmin } = useAuth();

  const navLinks = [
    { name: 'Home', path: '/' },
    { 
      name: 'About', 
      path: '#',
      children: [
        { name: 'About Us', path: '/about' },
        { name: 'History', path: '/about' },
        { name: 'Committees', path: '/committees' },
        { name: 'Missionaries', path: '/missionaries' },
        { name: 'Archives', path: '/archives' },
      ]
    },
    { 
      name: 'Rawngbawlna', 
      path: '#',
      children: [
        { name: 'Upa Bial', path: '/upa-bial' },
        { 
          name: 'Fellowships', 
          path: '#',
          children: [
            { name: 'Kohhran Hmeichhia', path: '/kohhran-hmeichhia' },
            { name: 'Kristian Ṭhalai Pawl (KTP)', path: '/ktp' },
            { name: 'Kohhran Pavalai Pawl (KPP)', path: '/kpp' },
          ]
        },
        { 
          name: 'Sunday School', 
          path: '#',
          children: [
            { name: 'Dashboard', path: '/sundayschool/dashboard' },
            { name: 'Weekly Report', path: '/sundayschool/report' },
            { name: 'Puitling', path: '/sundayschool/puitling' },
            { name: 'Senior', path: '/sundayschool/senior' },
            { name: 'Sacrament', path: '/sundayschool/sacrament' },
            { name: 'Intermediate', path: '/sundayschool/intermediate' },
            { name: 'Junior', path: '/sundayschool/junior' },
            { name: 'Primary', path: '/sundayschool/primary' },
            { name: 'Beginner', path: '/sundayschool/beginner' },
          ]
        },
        { name: 'Pathian Ram', path: '#', isPathianRam: true },
      ]
    },
    { 
      name: 'Worship', 
      path: '#',
      children: [
        { name: 'Hriattirna', path: '/announcements' },
        { name: 'Calendar', path: '/calendar' },
        { name: 'Inkhawm Chanvo', path: '/inkhawm-chanvo' },
      ]
    },
    { 
      name: 'Resources', 
      path: '#',
      children: [
        { name: 'Bethel Bulletin', path: '/bethel' },
        { name: 'Library', path: '/library' },
        { name: 'Records', path: '/records' },
        { name: 'Gallery', path: '/gallery' },
      ]
    },
    { name: 'Directory', path: '/directory' },
  ];

  const isActive = (path: string) => location.pathname === path;
  const isParentActive = (children: any[]) => children.some(child => location.pathname.startsWith(child.path) || (child.path.includes('?') && location.pathname + location.search === child.path));

  const toggleMobileMenu = (name: string) => {
    setMobileExpanded(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
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
        <div className="flex items-center justify-between min-h-[5rem] py-2">
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
            <div className="ml-10 flex items-center flex-wrap gap-x-2 gap-y-2">
              {navLinks.map((link) => (
                <div key={link.name} className="relative group z-10 hover:z-30 h-full flex items-center">
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
                      <div className="absolute left-0 top-full pt-2 w-56 hidden group-hover:block animate-in fade-in slide-in-from-top-1 duration-200 z-40">
                        <div className="rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none py-1 overflow-hidden">
                          {link.children.map((child) => (
                            child.children ? (
                              <div key={child.name} className="relative group/sub">
                                <div className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center justify-between cursor-pointer font-medium">
                                  <span>{child.name}</span>
                                  <span className="text-xs">&gt;</span>
                                </div>
                                <div className="absolute left-full top-0 w-56 hidden group-hover/sub:block shadow-lg bg-white ring-1 ring-black ring-opacity-5 py-1 z-50 rounded-md">
                                  {child.children.map((subChild) => (
                                    <Link
                                      key={subChild.path}
                                      to={subChild.path}
                                      className={`block px-4 py-2 text-sm ${
                                        isActive(subChild.path)
                                          ? 'bg-church-50 text-church-700 font-bold'
                                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                                      }`}
                                    >
                                      {subChild.name}
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            ) : child.isPathianRam ? (
                              <button
                                key={child.name}
                                type="button"
                                onClick={() => setPathianRamModalOpen(true)}
                                className="w-full text-left px-4 py-2 text-sm text-amber-700 hover:bg-slate-100 flex items-center space-x-2 font-medium"
                              >
                                <Calculator size={14} />
                                <span>{child.name}</span>
                              </button>
                            ) : child.isSignIn && currentUser ? null : (
                              <Link
                                key={child.name}
                                to={child.path}
                                className={`block px-4 py-2 text-sm ${
                                  isActive(child.path) || (child.path.includes('?') && location.pathname + location.search === child.path)
                                    ? 'bg-church-50 text-church-700 font-bold'
                                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                              >
                                {child.name}
                              </Link>
                            )
                          ))}
                        </div>
                      </div>
                    </>
                  ) : link.isPathianRam ? (
                    <button
                      type="button"
                      onClick={() => setPathianRamModalOpen(true)}
                      className="px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 text-amber-300 hover:bg-church-800 hover:text-amber-200 flex items-center space-x-1"
                    >
                      <Calculator size={14} className="mr-1 text-amber-400" />
                      <span>{link.name}</span>
                    </button>
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
                   <Shield size={14} className="mr-1" /> {t.nav.admin}
                 </Link>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
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
                         mobileExpanded.includes(link.name) ? 'bg-church-800 text-white' : 'text-slate-300 hover:bg-church-800 hover:text-white'
                      }`}
                    >
                      {link.name}
                      {mobileExpanded.includes(link.name) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    
                    {mobileExpanded.includes(link.name) && (
                      <div className="pl-4 space-y-1 border-l-2 border-church-700 ml-2 mt-1 animate-in slide-in-from-top-1 duration-200">
                        {link.children.map((child) => (
                          <div key={child.name}>
                            {child.children ? (
                              <>
                                <button
                                  onClick={() => toggleMobileMenu(child.name)}
                                  className="w-full flex justify-between items-center px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-church-800 hover:text-white"
                                >
                                  <span>{child.name}</span>
                                  {mobileExpanded.includes(child.name) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>
                                {mobileExpanded.includes(child.name) && (
                                  <div className="pl-4 space-y-1 border-l-2 border-church-700 ml-2 mt-1">
                                    {child.children.map((subChild) => (
                                      <Link
                                        key={subChild.path}
                                        to={subChild.path}
                                        onClick={() => setIsOpen(false)}
                                        className={`block px-3 py-1.5 rounded-md text-sm font-medium ${
                                          isActive(subChild.path)
                                            ? 'bg-church-800 text-white'
                                            : 'text-slate-400 hover:bg-church-800 hover:text-white'
                                        }`}
                                      >
                                        {subChild.name}
                                      </Link>
                                    ))}
                                  </div>
                                )}
                              </>
                            ) : child.isPathianRam ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsOpen(false);
                                  setPathianRamModalOpen(true);
                                }}
                                className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-amber-300 hover:bg-church-800 flex items-center space-x-2"
                              >
                                <Calculator size={14} className="text-amber-400" />
                                <span>{child.name}</span>
                              </button>
                            ) : child.isSignIn && currentUser ? null : (
                              <Link
                                key={child.name}
                                to={child.path}
                                onClick={() => setIsOpen(false)}
                                className={`block px-3 py-2 rounded-md text-sm font-medium ${
                                  isActive(child.path)
                                    ? 'bg-church-800 text-white'
                                    : 'text-slate-300 hover:bg-church-800 hover:text-white'
                                }`}
                              >
                                {child.name}
                              </Link>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : link.isPathianRam ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setPathianRamModalOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-amber-300 hover:bg-church-800 hover:text-amber-200 flex items-center justify-between"
                  >
                    <span className="flex items-center space-x-2">
                      <Calculator size={18} className="text-amber-400" />
                      <span>{link.name}</span>
                    </span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold border border-amber-500/30">
                      Tithe Portal
                    </span>
                  </button>
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
                {t.nav.adminDashboard}
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

      {/* Pathian Ram Launcher Modal */}
      <PathianRamModal 
        isOpen={pathianRamModalOpen} 
        onClose={() => setPathianRamModalOpen(false)} 
      />
    </nav>
  );
};

export default Navbar;
