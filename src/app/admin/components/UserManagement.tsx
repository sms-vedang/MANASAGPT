'use client';

import { useState, useEffect } from 'react';

interface Shop {
  _id: string;
  name: string;
  category: string;
}

interface User {
  _id: string;
  username: string;
  role: 'admin' | 'shop_owner' | 'data_entry';
  shopId?: Shop;
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'from-red-500/20 to-rose-500/20 border-red-500/30 text-red-300',
  shop_owner: 'from-emerald-500/20 to-green-500/20 border-emerald-500/30 text-emerald-300',
  data_entry: 'from-sky-500/20 to-blue-500/20 border-sky-500/30 text-sky-300',
};

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-red-500/20 text-red-300 border border-red-500/30',
  shop_owner: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  data_entry: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
};

const ROLE_ICONS: Record<string, string> = {
  admin: '👑',
  shop_owner: '🏪',
  data_entry: '✏️',
};

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'shop_owner' as 'admin' | 'shop_owner' | 'data_entry',
    shopId: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, shopsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/shops'),
      ]);
      const usersData = await usersRes.json();
      const shopsData = await shopsRes.json();
      setUsers(Array.isArray(usersData) ? usersData : []);
      setShops(Array.isArray(shopsData) ? shopsData : []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const payload: Record<string, unknown> = {
      username: formData.username,
      password: formData.password,
      role: formData.role,
    };
    if (formData.role === 'shop_owner' && formData.shopId) {
      payload.shopId = formData.shopId;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create user');
        return;
      }

      setSuccess(`User "${formData.username}" created successfully!`);
      setFormData({ username: '', password: '', role: 'shop_owner', shopId: '' });
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccess('User deleted successfully.');
        setDeleteConfirm(null);
        fetchData();
      }
    } catch (err) {
      setError('Failed to delete user.');
    }
  };

  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white">User Management</h2>
          <p className="text-slate-400 mt-1">Create and manage admin, shop owner, and data entry accounts</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(''); setSuccess(''); }}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium transition-all duration-200 shadow-lg shadow-violet-500/20"
        >
          <span className="text-lg">+</span>
          {showForm ? 'Cancel' : 'Create User'}
        </button>
      </div>

      {/* Role Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {(['admin', 'shop_owner', 'data_entry'] as const).map((role) => (
          <div key={role} className={`rounded-xl border p-4 bg-gradient-to-br ${ROLE_COLORS[role]}`}>
            <div className="text-2xl mb-1">{ROLE_ICONS[role]}</div>
            <div className="text-2xl font-bold text-white">{roleCounts[role] || 0}</div>
            <div className="text-sm capitalize">{role.replace('_', ' ')}</div>
          </div>
        ))}
      </div>

      {/* Feedback Messages */}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl px-4 py-3 flex items-center gap-2">
          <span>✅</span> {success}
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl px-4 py-3 flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
            <span>👤</span> Create New User
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="e.g. rameshkirana"
                className="w-full bg-slate-900/60 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Set a strong password"
                className="w-full bg-slate-900/60 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                required
                minLength={4}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'shop_owner' | 'data_entry', shopId: '' })}
                className="w-full bg-slate-900/60 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
              >
                <option value="shop_owner">🏪 Shop Owner</option>
                <option value="data_entry">✏️ Data Entry</option>
                <option value="admin">👑 Admin</option>
              </select>
            </div>
            {formData.role === 'shop_owner' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Assign Shop</label>
                <select
                  value={formData.shopId}
                  onChange={(e) => setFormData({ ...formData, shopId: e.target.value })}
                  className="w-full bg-slate-900/60 border border-slate-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                  required
                >
                  <option value="">-- Select a Shop --</option>
                  {shops.map((shop) => (
                    <option key={shop._id} value={shop._id}>
                      {shop.name} ({shop.category})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium transition shadow-lg shadow-violet-500/25"
              >
                Create User
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-700/50">
          <h3 className="font-semibold text-white">All Users ({users.length})</h3>
        </div>
        {users.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <div className="text-5xl mb-3">👥</div>
            <p className="font-medium">No users found</p>
            <p className="text-sm mt-1">Create the first user to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider bg-slate-900/40">
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Linked Shop</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/40">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-white">{user.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${ROLE_BADGE[user.role]}`}>
                        {ROLE_ICONS[user.role]} {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.shopId ? (
                        <div>
                          <p className="text-white font-medium">{user.shopId.name}</p>
                          <p className="text-xs text-slate-400 capitalize">{user.shopId.category}</p>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {deleteConfirm === user._id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-slate-400">Sure?</span>
                          <button
                            onClick={() => handleDelete(user._id)}
                            className="text-xs bg-red-500/20 text-red-300 border border-red-500/30 px-3 py-1 rounded-lg hover:bg-red-500/30 transition"
                          >
                            Yes, Delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="text-xs bg-slate-700 text-slate-300 px-3 py-1 rounded-lg hover:bg-slate-600 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(user._id)}
                          className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition"
                        >
                          🗑 Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
