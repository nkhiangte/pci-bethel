
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Youtube, MapPin, Phone, Mail, Lock, LogOut, MessageCircle } from 'lucide-react';
import ProtectedContact from './ProtectedContact';
import { CHURCH_NAME } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { auth, db } from '../services/firebase';

const INITIAL_CONTACT_DATA = {
  addressLine1: "Bethel Veng, Champhai",
  addressLine2: "Mizoram 796321",
  phone: "+91 98620 12345",
  email: "office@bethelkohhran.pci"
};

const Footer: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [contactData, setContactData] = useState(INITIAL_CONTACT_DATA);

  useEffect(() => {
    const fetchContactData = async () => {
      if (db && db.collection) {
        try {
          const doc = await db.collection('settings').doc('contact').get();
          if (doc.exists) {
            setContactData((prev) => ({ ...prev, ...doc.data() }));
          }
        } catch (error) {
          console.error("Error fetching contact info:", error);
        }
      }
    };
    fetchContactData();
  }, []);

  const handleLogout = async () => {
    try {
      if (auth) {
        await auth.signOut();
      }
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <footer className="bg-church-900 text-slate-300 pt-12 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Column 1: Info */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">{CHURCH_NAME}</h3>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-white transition"><Facebook size={20} /></a>
              <a href="#" className="hover:text-white transition"><Youtube size={20} /></a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">{t.footer.quickLinks}</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#/about" className="hover:text-white">{t.nav.about}</a></li>
              <li><a href="#/contact" className="hover:text-white">{t.nav.contact}</a></li>
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">{t.footer.contactUs}</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start">
                <MapPin size={18} className="mr-2 mt-0.5 flex-shrink-0" />
                <span>{contactData.addressLine1},<br/>{contactData.addressLine2}</span>
              </div>
              <div className="flex items-center gap-3">
                <ProtectedContact 
                  phone={contactData.phone} 
                  name={CHURCH_NAME} 
                  variant="full"
                  className="bg-transparent border-none p-0 text-slate-300 hover:text-white"
                />
              </div>
              <div className="flex items-center">
                <Mail size={18} className="mr-2 flex-shrink-0" />
                <span>{contactData.email}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-700 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-slate-400">
          <p>&copy; {new Date().getFullYear()} {CHURCH_NAME}. {t.footer.rightsReserved}</p>
          <div className="mt-4 md:mt-0 flex items-center gap-4">
            <Link to="/privacy" className="hover:text-white transition">
              Privacy Policy
            </Link>
            <span className="text-slate-600">|</span>
            {currentUser ? (
              <button onClick={handleLogout} className="flex items-center hover:text-white transition">
                <LogOut size={12} className="mr-1" /> {t.auth.logout}
              </button>
            ) : (
              <Link to="/login" className="flex items-center hover:text-white transition">
                <Lock size={12} className="mr-1" /> {t.auth.signIn}
              </Link>
            )}
          </div>
        </div>

        {/* Added Property Section - Updated colors for visibility */}
        <div className="mt-6 pt-6 border-t border-church-800 text-center">
            <p className="text-xs text-church-200 font-medium uppercase tracking-wider">Property of Bethel Presbyterian Kohhran</p>
            <p className="text-[10px] text-church-300 mt-1">Archives & Library Committee</p>
            <p className="text-xs text-white mt-2 font-medium">
              Powered by <ProtectedContact phone="9612447703" name="PrisMark" variant="text-only" className="inline underline decoration-white/50 hover:text-church-200" />
            </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
