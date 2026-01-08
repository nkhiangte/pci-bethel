
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../services/firebase';
import { useLanguage } from '../contexts/LanguageContext';
import { Lock, Mail, Loader, AlertCircle } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const bgUrl = "https://i.ibb.co/G4kcMqmM/117973144-786352218785464-3747589953800462999-n.jpg";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
        setError('Authentication service is currently unavailable.');
        return;
    }

    try {
      setError('');
      setLoading(true);
      await auth.signInWithEmailAndPassword(email, password);
      // Determine navigation based on role is handled in AuthContext or individual pages, 
      // but generic login goes to Home or Profile
      navigate('/'); 
    } catch (err: any) {
      console.error(err);
      setError('Failed to log in. Please check your credentials.');
    }
    setLoading(false);
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url("${bgUrl}")` }}
    >
      {/* Increased opacity to 0.98 and removed backdrop-blur for text clarity */}
      <div className="max-w-md w-full space-y-8 bg-white/98 p-10 rounded-xl shadow-2xl border border-white/20">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-church-100 text-church-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
            <Lock size={24} />
          </div>
          <h2 className="text-3xl font-serif font-bold text-slate-900">{t.auth.loginTitle}</h2>
          <p className="mt-2 text-sm text-slate-600">
            {t.auth.loginSubtitle}
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md flex items-start text-sm border border-red-100">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                {t.auth.email}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-church-500 focus:border-church-500 sm:text-sm transition-shadow"
                  placeholder="member@bethel.pci"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                {t.auth.password}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-church-500 focus:border-church-500 sm:text-sm transition-shadow"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-church-500 hover:bg-church-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-church-500 transition-all shadow-md hover:shadow-lg disabled:opacity-70"
            >
              {loading ? (
                <Loader className="animate-spin h-5 w-5" />
              ) : (
                t.auth.signIn
              )}
            </button>
          </div>

          <div className="text-center text-sm">
            <span className="text-slate-600">{t.auth.noAccount} </span>
            <Link to="/signup" className="font-medium text-church-600 hover:text-church-500 font-bold">
              {t.auth.signUp}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
