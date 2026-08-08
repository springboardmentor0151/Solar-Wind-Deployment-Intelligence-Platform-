import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Users, 
  UserPlus, 
  Edit3, 
  Trash2, 
  ShieldCheck, 
  RefreshCw, 
  UserCheck, 
  UserX,
  Plus
} from 'lucide-react';

export default function UserManagementView({ user: currentUser }) {
  const [usersList, setUsersList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Add User Form States
  const [showAddModal, setShowAddModal] = useState(false);
  const [addUsername, setAddUsername] = useState('');
  const [addFullName, setAddFullName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addRole, setAddRole] = useState('planner');
  const [addIsActive, setAddIsActive] = useState(true);

  // Edit User Form States
  const [editingUser, setEditingUser] = useState(null);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState('planner');
  const [editIsActive, setEditIsActive] = useState(true);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsersList(res.data);
    } catch (e) {
      console.error(e);
      window.showToast("Failed to load user accounts list.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/users', {
        username: addUsername,
        full_name: addFullName,
        email: addEmail,
        password: addPassword,
        role: addRole,
        is_active: addIsActive
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      window.showToast("User account created successfully.", "success");
      setShowAddModal(false);
      
      // Reset fields
      setAddUsername('');
      setAddFullName('');
      setAddEmail('');
      setAddPassword('');
      setAddRole('planner');
      setAddIsActive(true);
      
      fetchUsers();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.detail || err.message || "Failed to create user.";
      window.showToast(`Error: ${msg}`, "error");
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/users/${editingUser.id}`, {
        full_name: editFullName,
        email: editEmail,
        role: editRole,
        is_active: editIsActive,
        ...(editPassword ? { password: editPassword } : {})
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      window.showToast("User account updated successfully.", "success");
      setEditingUser(null);
      setEditPassword('');
      fetchUsers();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.detail || err.message || "Failed to update user.";
      window.showToast(`Error: ${msg}`, "error");
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (id === currentUser.id) {
      window.showToast("Admins cannot delete their own account.", "warning");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete user "${name}"? This action is permanent.`)) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.showToast("User deleted successfully.", "success");
      fetchUsers();
    } catch (err) {
      console.error(err);
      window.showToast("Failed to delete user.", "error");
    }
  };

  const startEdit = (userItem) => {
    setEditingUser(userItem);
    setEditFullName(userItem.full_name || '');
    setEditEmail(userItem.email || '');
    setEditRole(userItem.role || 'planner');
    setEditIsActive(userItem.is_active !== false);
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#111827]/80 border border-slate-800 p-6 rounded-2xl glass gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center">
            <Users className="w-5 h-5 text-indigo-400 mr-2" />
            User Management Console
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Create, update, disable or configure system-wide client/planner roles across the platform.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchUsers}
            className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-lg transition-all shadow-md flex items-center space-x-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Account</span>
          </button>
        </div>
      </div>

      {/* Users Grid/Table */}
      <div className="bg-[#111827]/80 border border-slate-800 rounded-2xl p-6 glass">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-3">Account profile</th>
                <th className="py-3 px-3">Email address</th>
                <th className="py-3 px-3">System Role</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 text-slate-350 font-semibold">
              {usersList.map(u => (
                <tr key={u.id} className="hover:bg-slate-900/20 text-slate-300 transition-colors">
                  <td className="py-3.5 px-3 font-bold flex items-center">
                    <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-[10px] uppercase text-slate-300 mr-3 shrink-0">
                      {u.username.slice(0, 2)}
                    </div>
                    <div>
                      <span className="block text-slate-100">{u.full_name || u.username}</span>
                      <span className="block text-[9.5px] text-slate-500 font-mono">@{u.username}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 font-mono text-[11px] text-slate-400">{u.email}</td>
                  <td className="py-3.5 px-3 capitalize">
                    <span className={`px-2 py-0.5 rounded text-[9.5px] font-black ${
                      u.role === 'admin' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                      u.role === 'manager' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                      u.role === 'analyst' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    {u.is_active !== false ? (
                      <span className="inline-flex items-center text-[10.5px] font-black text-emerald-400">
                        <UserCheck className="w-3.5 h-3.5 mr-1" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[10.5px] font-black text-rose-500 bg-rose-500/5 px-2 py-0.5 rounded border border-rose-500/10">
                        <UserX className="w-3.5 h-3.5 mr-1" /> Disabled
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => startEdit(u)}
                        className="p-1.5 bg-slate-900 border border-slate-800 hover:border-blue-500/20 text-slate-400 hover:text-sky-400 rounded-lg transition-all"
                        title="Edit User"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id, u.full_name || u.username)}
                        className="p-1.5 bg-slate-900 border border-slate-800 hover:border-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-all"
                        title="Delete User"
                        disabled={u.id === currentUser.id}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {usersList.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-550 italic">No users found on the database.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#070a13]/85 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-2xl max-w-md w-full glass space-y-4">
            <div className="flex justify-between items-center border-b border-slate-850 pb-2">
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center">
                <UserPlus className="w-4 h-4 mr-1.5 text-blue-500" />
                Create New Account
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>
            
            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-400 uppercase tracking-widest">Username</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. john_doe"
                  value={addUsername}
                  onChange={(e) => setAddUsername(e.target.value)}
                  className="w-full rounded-lg py-2 px-3 glass-input font-bold placeholder-slate-700"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={addFullName}
                  onChange={(e) => setAddFullName(e.target.value)}
                  className="w-full rounded-lg py-2 px-3 glass-input font-bold placeholder-slate-700"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. john@example.com"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  className="w-full rounded-lg py-2 px-3 glass-input font-bold placeholder-slate-700"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-400 uppercase tracking-widest">Password</label>
                <input
                  type="password"
                  required
                  placeholder="At least 8 chars..."
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  className="w-full rounded-lg py-2 px-3 glass-input font-bold placeholder-slate-700"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-400 uppercase tracking-widest">System Role</label>
                  <select
                    value={addRole}
                    onChange={(e) => setAddRole(e.target.value)}
                    className="w-full rounded-lg py-2 px-3 glass-input font-bold"
                  >
                    <option value="planner">Planner</option>
                    <option value="analyst">Analyst</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-400 uppercase tracking-widest">Status</label>
                  <select
                    value={addIsActive ? "1" : "0"}
                    onChange={(e) => setAddIsActive(e.target.value === "1")}
                    className="w-full rounded-lg py-2 px-3 glass-input font-bold"
                  >
                    <option value="1">Active</option>
                    <option value="0">Disabled</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-bold transition-all shadow"
              >
                Create Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-[#070a13]/85 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-2xl max-w-md w-full glass space-y-4">
            <div className="flex justify-between items-center border-b border-slate-850 pb-2">
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center">
                <Edit3 className="w-4 h-4 mr-1.5 text-indigo-400" />
                Edit Account details
              </h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>
            
            <form onSubmit={handleUpdateUser} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-400 uppercase tracking-widest">Username</label>
                <input
                  type="text"
                  disabled
                  value={editingUser.username}
                  className="w-full rounded-lg py-2 px-3 bg-slate-900 border border-slate-850 text-slate-500 font-bold cursor-not-allowed"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full rounded-lg py-2 px-3 glass-input font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. john@example.com"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full rounded-lg py-2 px-3 glass-input font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-400 uppercase tracking-widest">New Password</label>
                <input
                  type="password"
                  placeholder="Leave blank to keep current..."
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full rounded-lg py-2 px-3 glass-input font-bold"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-400 uppercase tracking-widest">System Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full rounded-lg py-2 px-3 glass-input font-bold"
                    disabled={editingUser.id === currentUser.id}
                  >
                    <option value="planner">Planner</option>
                    <option value="analyst">Analyst</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-400 uppercase tracking-widest">Status</label>
                  <select
                    value={editIsActive ? "1" : "0"}
                    onChange={(e) => setEditIsActive(e.target.value === "1")}
                    className="w-full rounded-lg py-2 px-3 glass-input font-bold"
                    disabled={editingUser.id === currentUser.id}
                  >
                    <option value="1">Active</option>
                    <option value="0">Disabled</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-bold transition-all shadow"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
