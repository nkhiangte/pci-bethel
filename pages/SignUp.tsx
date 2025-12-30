
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../services/firebase';
import { useLanguage } from '../contexts/LanguageContext';
import { UserPlus, Mail, Lock, User, Key, Loader, AlertCircle } from 'lucide-react';
import { UserProfile } from '../types';

const SignUp: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const bgUrl = "https://i.ibb.co/G4kcMqmM/117973144-786352218785464-3747589953800462999-n.jpg";

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
        setError('Authentication service is currently unavailable.');
        return;
    }

    try {
      setError('');
      setLoading(true);
      
      // Create Auth User
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Determine Role based on Secret Code
      // "PCIADMIN" is the hardcoded secret for demonstration
      const role = secretCode === 'PCIADMIN' ? 'admin' : 'member';

      // Update Profile Display Name in Auth
      if (user.updateProfile) {
          await user.updateProfile({ displayName: name });
      }

      // Save User Profile to Firestore
      const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email,
          displayName: name,
          role: role,
          createdAt: new Date().toISOString()
      };

      if (db && db.collection) {
          await db.collection('users').doc(user.uid).set(newProfile);
      }

      navigate('/'); 
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create account.');
    }
    setLoading(false);
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url("${bgUrl}")` }}
    >
      <div className="max-w-md w-full space-y-8 bg-white/95 backdrop-blur-sm p-10 rounded-xl shadow-2xl border border-white/20">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-church-100 text-church-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
            <UserPlus size={24} />
          </div>
          <h2 className="text-3xl font-serif font-bold text-slate-900">{t.auth.signupTitle}</h2>
          <p className="mt-2 text-sm text-slate-600">
            {t.auth.signupSubtitle}
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md flex items-start text-sm border border-red-100">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
          <div className="space-y-4">
             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t.auth.fullName}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-church-500 focus:border-church-500 sm:text-sm transition-shadow"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t.auth.email}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-church-500 focus:border-church-500 sm:text-sm transition-shadow"
                  placeholder="member@bethel.pci"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t.auth.password}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-church-500 focus:border-church-500 sm:text-sm transition-shadow"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t.auth.secretCode}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Key size={18} />
                </div>
                <input
                  type="text"
                  value={secretCode}
                  onChange={(e) => setSecretCode(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-church-500 focus:border-church-500 sm:text-sm transition-shadow"
                  placeholder="Code"
                />
              </div>
              <p className="text-xs text-church-600 mt-1 font-medium">Use code "PCIADMIN" for admin privileges (for testing).</p>
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
                t.auth.signUp
              )}
            </button>
          </div>
          
           <div className="text-center text-sm">
            <span className="text-slate-600">{t.auth.hasAccount} </span>
            <Link to="/login" className="font-medium text-church-600 hover:text-church-500 font-bold">
              {t.auth.signIn}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
