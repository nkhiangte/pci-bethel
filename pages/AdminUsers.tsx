
import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { UserProfile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Loader, Shield, ShieldOff, Search, User, Mail, ShieldCheck } from 'lucide-react';

const AdminUsers: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    if (!db || !db.collection) {
        setLoading(false);
        return;
    }
    try {
        const snapshot = await db.collection('users').get();
        const fetchedUsers = snapshot.docs.map((doc: any) => ({ 
            uid: doc.id, // Ensure UID is set from doc ID
            ...doc.data() 
        })) as UserProfile[];
        setUsers(fetchedUsers);
    } catch (error) {
        console.error("Error fetching users:", error);
    }
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, currentRole: string) => {
      if (!db || !db.collection) return;
      
      const newRole = currentRole === 'admin' ? 'member' : 'admin';
      const isMakingAdmin = newRole === 'admin';
      
      if (!window.confirm(`Are you sure you want to ${isMakingAdmin ? 'promote' : 'demote'} this user?`)) return;

      setUpdatingId(userId);
      try {
          // Update both 'role' and 'isAdmin' fields for compatibility with existing AuthContext logic
          await db.collection('users').doc(userId).update({
              role: newRole,
              isAdmin: isMakingAdmin
          });
          
          // Optimistic update
          setUsers(prev => prev.map(u => u.uid === userId ? { ...u, role: newRole, isAdmin: isMakingAdmin } : u));
      } catch (error) {
          console.error("Error updating role:", error);
          alert("Failed to update role.");
      }
      setUpdatingId(null);
  };

  const filteredUsers = users.filter(user => 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin) return <div className="p-10 text-center text-red-500 font-bold">Access Denied</div>;

  return (
      <div className="min-h-screen bg-slate-50 py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <h1 className="text-3xl font-serif font-bold text-church-900 mb-2">User Management</h1>
              <p className="text-slate-600 mb-8">Manage registered members and assign administrative privileges.</p>

              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="relative w-full sm:w-72">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input 
                              type="text" 
                              placeholder="Search users..." 
                              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-church-500 outline-none"
                              value={searchTerm}
                              onChange={e => setSearchTerm(e.target.value)}
                          />
                      </div>
                      <div className="text-sm text-slate-500">
                          Total Users: <span className="font-bold text-slate-900">{users.length}</span>
                      </div>
                  </div>

                  {loading ? (
                      <div className="p-12 text-center"><Loader className="animate-spin h-8 w-8 mx-auto text-church-500" /></div>
                  ) : (
                      <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                              <thead>
                                  <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-bold">
                                      <th className="p-4 border-b">User</th>
                                      <th className="p-4 border-b">Email</th>
                                      <th className="p-4 border-b">Role</th>
                                      <th className="p-4 border-b text-right">Actions</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                  {filteredUsers.map(user => {
                                      const isUserAdmin = user.role === 'admin' || user.isAdmin === true || String(user.isAdmin) === 'true';
                                      const isCurrentUser = user.uid === currentUser?.uid;

                                      return (
                                          <tr key={user.uid} className="hover:bg-slate-50 transition-colors">
                                              <td className="p-4">
                                                  <div className="flex items-center">
                                                      <div className="h-10 w-10 rounded-full bg-church-100 flex items-center justify-center text-church-700 font-bold mr-3">
                                                          {user.displayName ? user.displayName.charAt(0).toUpperCase() : <User size={18} />}
                                                      </div>
                                                      <div>
                                                          <div className="font-bold text-slate-900">{user.displayName || 'Unknown'}</div>
                                                          <div className="text-xs text-slate-400">UID: {user.uid?.substring(0, 8)}...</div>
                                                      </div>
                                                  </div>
                                              </td>
                                              <td className="p-4 text-slate-600">
                                                  <div className="flex items-center">
                                                      <Mail size={14} className="mr-2 text-slate-400" />
                                                      {user.email}
                                                  </div>
                                              </td>
                                              <td className="p-4">
                                                  {isUserAdmin ? (
                                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                          <Shield size={12} className="mr-1" /> Admin
                                                      </span>
                                                  ) : (
                                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                                          Member
                                                      </span>
                                                  )}
                                              </td>
                                              <td className="p-4 text-right">
                                                  <button 
                                                      onClick={() => handleRoleChange(user.uid!, isUserAdmin ? 'admin' : 'member')}
                                                      disabled={isCurrentUser || updatingId === user.uid}
                                                      className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                                                          isCurrentUser 
                                                              ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400'
                                                              : isUserAdmin 
                                                                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                                                  : 'bg-green-50 text-green-600 hover:bg-green-100'
                                                      }`}
                                                  >
                                                      {updatingId === user.uid ? (
                                                          <Loader size={14} className="animate-spin mr-1" />
                                                      ) : isUserAdmin ? (
                                                          <ShieldOff size={14} className="mr-1" />
                                                      ) : (
                                                          <ShieldCheck size={14} className="mr-1" />
                                                      )}
                                                      {isUserAdmin ? 'Revoke Admin' : 'Make Admin'}
                                                  </button>
                                              </td>
                                          </tr>
                                      );
                                  })}
                              </tbody>
                          </table>
                          {filteredUsers.length === 0 && (
                              <div className="p-8 text-center text-slate-500">No users found.</div>
                          )}
                      </div>
                  )}
              </div>
          </div>
      </div>
  );
};

export default AdminUsers;
