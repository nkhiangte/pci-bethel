
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { Calendar, Bell, Upload, Image, FileText, CheckCircle, Shield, Users, ClipboardList, UserCog, Settings, RefreshCw, HeartHandshake } from 'lucide-react';
import { db } from '../services/firebase';
import firebase from 'firebase/compat/app';

const AdminDashboard: React.FC = () => {
  const { isAdmin, currentUser } = useAuth();
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);

  if (!currentUser) return <Navigate to="/login" />;
  if (!isAdmin) return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center">
              <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-700">Access Denied</h2>
              <p className="text-slate-500">You do not have administrative privileges.</p>
              <Link to="/" className="text-church-600 hover:underline mt-4 block">Return Home</Link>
          </div>
      </div>
  );

  const adminActions = [
      { title: 'Manage Contributions', icon: HeartHandshake, link: '/admin/thawhlawm', color: 'bg-emerald-600', desc: 'Verify and track Thawhlawm payments.' },
      { title: 'Manage Events', icon: Calendar, link: '/events', color: 'bg-church-500', desc: 'Add or edit church calendar items.' },
      { title: 'Manage Announcements', icon: Bell, link: '/announcements', color: 'bg-orange-500', desc: 'Post new updates for the congregation.' },
      { title: 'Manage Ministries', icon: Users, link: '/admin/ministries', color: 'bg-blue-500', desc: 'Update fellowship leaders and schedules.' },
      { title: 'Manage Weekly Duties', icon: ClipboardList, link: '/admin/duties', color: 'bg-indigo-500', desc: 'Update ushers, song leaders, etc.' },
      { title: 'Manage Gallery', icon: Image, link: '/gallery', color: 'bg-purple-500', desc: 'Upload photos from recent events.' },
      { title: 'Manage Users', icon: UserCog, link: '/admin/users', color: 'bg-pink-500', desc: 'Manage registered users and admin roles.' },
  ];

  const handleMigrateWeeklyPrograms = async () => {
    if (!db || !db.collection || !window.confirm("This will move all entries titled 'Weekly Program...' from 'Executive Body' to the new 'Weekly Program' folder. Proceed?")) return;
    
    setMaintenanceLoading(true);
    try {
        const snapshot = await db.collection('archives')
            .where('category', '==', 'Rawngbawltu te')
            .where('subCategory', '==', 'Executive Body')
            .get();
            
        const batch = db.batch();
        let count = 0;
        
        snapshot.docs.forEach((doc: any) => {
            const data = doc.data();
            // Check if it looks like a weekly program
            if (data.title && (data.title.toLowerCase().includes('weekly program') || data.description?.includes('WEEKLY DUTY'))) {
                const ref = db.collection('archives').doc(doc.id);
                batch.update(ref, {
                    category: 'Weekly Program',
                    subCategory: firebase.firestore.FieldValue.delete()
                });
                count++;
            }
        });
        
        if (count > 0) {
            await batch.commit();
            alert(`Success! Moved ${count} records to the Weekly Program folder.`);
        } else {
            alert("No matching 'Weekly Program' records found in Executive Body.");
        }
    } catch (e: any) {
        console.error(e);
        alert("Migration failed: " + e.message);
    }
    setMaintenanceLoading(false);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-serif font-bold text-church-900">Admin Dashboard</h1>
                <span className="bg-church-100 text-church-700 px-3 py-1 rounded-full text-sm font-medium">
                    Logged in as {currentUser.displayName || currentUser.email}
                </span>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adminActions.map((action, idx) => (
                    <Link to={action.link} key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition group">
                        <div className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center text-white mb-4 shadow-sm`}>
                            <action.icon size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 group-hover:text-church-600 transition-colors">{action.title}</h3>
                        <p className="text-slate-500 mt-2 text-sm">{action.desc}</p>
                    </Link>
                ))}
            </div>

            <div className="grid md:grid-cols-2 gap-8 mt-12">
                {/* System Maintenance */}
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                        <Settings className="mr-2 text-slate-500" /> System Maintenance
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div>
                                <h4 className="font-bold text-slate-700 text-sm">Migrate Archive Data</h4>
                                <p className="text-xs text-slate-500 mt-1">Move Weekly Programs from Exec. Body to new folder.</p>
                            </div>
                            <button 
                                onClick={handleMigrateWeeklyPrograms} 
                                disabled={maintenanceLoading}
                                className="flex items-center px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700 disabled:opacity-50 transition"
                            >
                                <RefreshCw size={14} className={`mr-2 ${maintenanceLoading ? 'animate-spin' : ''}`} />
                                {maintenanceLoading ? 'Moving...' : 'Migrate'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default AdminDashboard;
