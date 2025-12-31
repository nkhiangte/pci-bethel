
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { Calendar, Bell, Upload, Image, FileText, CheckCircle, Shield } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { isAdmin, currentUser } = useAuth();

  if (!currentUser) return <Navigate to="/login" replace />;
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
      { title: 'Manage Events', icon: Calendar, link: '/events', color: 'bg-church-500', desc: 'Add or edit church calendar items.' },
      { title: 'Manage Announcements', icon: Bell, link: '/announcements', color: 'bg-orange-500', desc: 'Post new updates for the congregation.' },
      { title: 'Upload Reports', icon: FileText, link: '/resources', color: 'bg-green-500', desc: 'Upload weekly bulletins and annual reports.' },
      { title: 'Manage Gallery', icon: Image, link: '/gallery', color: 'bg-purple-500', desc: 'Upload photos from recent events.' },
      { title: 'Approve Forms', icon: CheckCircle, link: '#', color: 'bg-teal-500', desc: 'Review membership and prayer requests. (Coming Soon)' },
  ];

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

            {/* Quick Upload Mockup */}
            <div className="mt-12 bg-white p-8 rounded-xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                    <Upload className="mr-2 text-church-500" /> Quick File Upload
                </h3>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center hover:bg-slate-50 transition cursor-pointer">
                    <FileText className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                    <p className="font-medium text-slate-600">Drag and drop weekly bulletin PDF here</p>
                    <p className="text-xs text-slate-400 mt-1">or click to browse files</p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default AdminDashboard;