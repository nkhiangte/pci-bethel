import React, { useState } from 'react';
import { View } from '../types';
import { MenuIcon, XIcon } from './Icon';

interface HeaderProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = Object.values(View);

  // FIX: Explicitly type NavLink as a React.FC to allow TypeScript to correctly handle React-specific props like `key`.
  const NavLink: React.FC<{ view: View, isMobile?: boolean }> = ({ view, isMobile }) => (
    <button
      onClick={() => {
        setCurrentView(view);
        setIsMenuOpen(false);
      }}
      className={`
        ${isMobile ? 'block w-full text-left px-4 py-3 text-lg' : 'px-4 py-2'}
        ${currentView === view 
          ? 'text-blue-800 font-bold bg-blue-100 rounded-md' 
          : 'text-gray-700 hover:text-blue-800 hover:bg-blue-50 rounded-md'}
        transition-colors duration-300
      `}
    >
      {view}
    </button>
  );

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="text-center md:text-left">
            <h1 className="text-xl md:text-2xl font-bold text-blue-900">
              Presbyterian Church of India
            </h1>
            <p className="text-sm text-gray-600">Champhai Bethel Kohhran</p>
          </div>
          <nav className="hidden lg:flex items-center space-x-2">
            {navItems.map(item => <NavLink key={item} view={item} />)}
          </nav>
          <div className="lg:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-blue-800"
              aria-label="Open menu"
            >
              {isMenuOpen ? <XIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </div>
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200">
          <nav className="flex flex-col p-4 space-y-2">
            {navItems.map(item => <NavLink key={item} view={item} isMobile />)}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
