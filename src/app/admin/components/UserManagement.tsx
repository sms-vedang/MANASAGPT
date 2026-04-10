'use client';

import { useState, useEffect } from 'react';

interface Shop {
  _id: string;
  name: string;
  category: string;
  address: string;
}

interface User {
  _id: string;
  username: string;
  role: 'admin' | 'shop_owner' | 'data_entry';
  shopId?: Shop;
}

const ROLE_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  admin: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', text: '#f87171', glow: 'rgba(239,68,68,0.15)' },
  shop_owner: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', text: '#34d399', glow: 'rgba(16,185,129,0.15)' },
  data_entry: { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', text: '#93c5fd', glow: 'rgba(59,130,246,0.15)' },
};

const ROLE_ICONS: Record<string, string> = {
  admin: '👑', shop_owner: '🏪', data_entry: '✏️',
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin', shop_owner: 'Shop Owner', data_entry: 'Data Entry',
};

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '', password: '', role: 'shop_owner' as 'admin' | 'shop_owner' | 'data_entry', shopId: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, shopsRes] = await Promise.all([fetch('/api/users'), fetch('/api/shops')]);
      const usersData = await usersRes.json();
      const shopsData = await shopsRes.json();
      setUsers(Array.isArray(usersData) ? usersData : []);
      setShops(Array.isArray(shopsData) ? shopsData : []);
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setSaving(true);

    const payload: Record<string, unknown> = {
      username: formData.username.trim(),
      role: formData.role,
    };
    if (formData.password) payload.password = formData.password;
    if (formData.role === 'shop_owner' && formData.shopId) payload.shopId = formData.shopId;
    if (formData.role !== 'shop_owner') payload.shopId = null;

    try {
      const url = editingUser ? `/api/users/${editingUser._id}` : '/api/users';
      const method = editingUser ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to save user'); return; }
      setSuccess(editingUser ? `User "${formData.username}" updated!` : `User "${formData.username}" created!`);
      resetForm();
      setShowForm(false);
      fetchData();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) { setSuccess('User deleted.'); setDeleteConfirm(null); fetchData(); }
      else setError('Failed to delete user.');
    } catch { setError('Failed to delete user.'); }
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      role: user.role,
      shopId: user.shopId?._id || '',
    });
    setShowForm(true);
    setError(''); setSuccess('');
  };

  const resetForm = () => {
    setFormData({ username: '', password: '', role: 'shop_owner', shopId: '' });
    setEditingUser(null);
  };

  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || u.username.toLowerCase().includes(q) || (u.shopId?.name?.toLowerCase().includes(q) || false);
    const matchRole = !filterRole || u.role === filterRole;
    return matchSearch && matchRole;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, flexDirection: 'column', gap: 12 }}>
        <div style={{ width: 44, height: 44, border: '3px solid rgba(139,92,246,0.2)', borderTop: '3px solid #7c3aed', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#64748b', fontSize: 14 }}>Loading users...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Role Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {(['admin', 'shop_owner', 'data_entry'] as const).map(role => {
          const c = ROLE_COLORS[role];
          return (
            <div key={role} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 18, padding: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 28 }}>{ROLE_ICONS[role]}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: c.text }}>{roleCounts[role] || 0}</div>
              <div style={{ color: c.text, fontSize: 12, fontWeight: 600, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{ROLE_LABELS[role]}</div>
            </div>
          );
        })}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 800, margin: 0 }}>User Management</h2>
          <p style={{ color: '#475569', fontSize: 13, margin: '4px 0 0' }}>Create and manage admin, shop owner, and data entry accounts</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); if (!showForm) resetForm(); setError(''); setSuccess(''); }}
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          {showForm && !editingUser ? '✕ Cancel' : '＋ Create User'}
        </button>
      </div>

      {/* Feedback */}
      {success && (
        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, padding: '12px 16px', color: '#34d399', fontSize: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
          ✅ {success}
        </div>
      )}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '12px 16px', color: '#f87171', fontSize: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 20, padding: 28, backdropFilter: 'blur(12px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ color: '#e2e8f0', fontSize: 17, fontWeight: 700, margin: 0 }}>
              {editingUser ? `✏️ Editing: ${editingUser.username}` : '👤 Create New User'}
            </h3>
            <button onClick={() => { setShowForm(false); resetForm(); }} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8', cursor: 'pointer', borderRadius: 8, padding: '6px 12px', fontSize: 16 }}>✕</button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
            {/* Username */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={lbl}>Username *</label>
              <input
                value={formData.username}
                onChange={e => setFormData(p => ({ ...p, username: e.target.value }))}
                style={inp}
                placeholder="e.g. ramesh_kirana"
                required
                autoComplete="off"
              />
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={lbl}>{editingUser ? 'New Password (leave blank to keep)' : 'Password *'}</label>
              <input
                type="password"
                value={formData.password}
                onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                style={inp}
                placeholder={editingUser ? 'Leave blank to keep unchanged' : 'Set a strong password'}
                required={!editingUser}
                minLength={editingUser ? 0 : 4}
                autoComplete="new-password"
              />
            </div>

            {/* Role */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={lbl}>Role *</label>
              <select
                value={formData.role}
                onChange={e => setFormData(p => ({ ...p, role: e.target.value as typeof p.role, shopId: '' }))}
                style={sel}
              >
                <option value="shop_owner">🏪 Shop Owner</option>
                <option value="data_entry">✏️ Data Entry</option>
                <option value="admin">👑 Admin</option>
              </select>
            </div>

            {/* Shop Assignment */}
            {formData.role === 'shop_owner' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={lbl}>Assign to Shop {editingUser ? '' : '*'}</label>
                <select
                  value={formData.shopId}
                  onChange={e => setFormData(p => ({ ...p, shopId: e.target.value }))}
                  style={sel}
                  required={!editingUser}
                >
                  <option value="">-- Select a Shop --</option>
                  {shops.map(shop => (
                    <option key={shop._id} value={shop._id}>
                      {shop.name} ({shop.category})
                    </option>
                  ))}
                </select>
                {shops.length === 0 && (
                  <span style={{ color: '#f59e0b', fontSize: 11 }}>⚠️ No shops found. Create a shop first.</span>
                )}
              </div>
            )}

            {/* Role info box */}
            <div style={{ gridColumn: '1 / -1', background: ROLE_COLORS[formData.role].bg, border: `1px solid ${ROLE_COLORS[formData.role].border}`, borderRadius: 14, padding: '12px 16px' }}>
              <p style={{ color: ROLE_COLORS[formData.role].text, fontSize: 13, fontWeight: 600, margin: '0 0 4px' }}>
                {ROLE_ICONS[formData.role]} {ROLE_LABELS[formData.role]} Role
              </p>
              <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>
                {formData.role === 'admin' && 'Full access to all admin panel features, shop, user, and AI management.'}
                {formData.role === 'shop_owner' && 'Can manage their linked shop profile, products, and view incoming orders.'}
                {formData.role === 'data_entry' && 'Can add and update city knowledge, places, and basic content. No shop or user management.'}
              </p>
            </div>

            {/* Actions */}
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="submit"
                disabled={saving}
                style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}
              >
                {saving ? '⏳ Saving...' : editingUser ? '💾 Update User' : '✅ Create User'}
              </button>
              {editingUser && (
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#94a3b8', padding: '10px 20px', fontSize: 14, cursor: 'pointer' }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          style={{ ...inp, flex: 1, minWidth: 180, maxWidth: 320 }}
          placeholder="🔍 Search by username or shop..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <select style={{ ...sel, minWidth: 160 }} value={filterRole} onChange={e => setFilterRole(e.target.value)}>
          <option value="">All Roles</option>
          <option value="admin">👑 Admin</option>
          <option value="shop_owner">🏪 Shop Owner</option>
          <option value="data_entry">✏️ Data Entry</option>
        </select>
        <span style={{ color: '#475569', fontSize: 13 }}>
          Showing {filteredUsers.length} of {users.length} users
        </span>
      </div>

      {/* Users List */}
      <div style={{ background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 15, margin: 0 }}>All Users ({filteredUsers.length})</h3>
        </div>

        {filteredUsers.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
            <p style={{ color: '#475569', fontSize: 15, margin: 0 }}>
              {users.length === 0 ? 'No users yet. Create the first user to get started.' : 'No users match your search.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {filteredUsers.map((user, idx) => {
              const c = ROLE_COLORS[user.role];
              return (
                <div
                  key={user._id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
                    borderBottom: idx < filteredUsers.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                    background: `linear-gradient(135deg, #7c3aed, #4f46e5)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: 17,
                  }}>
                    {user.username.charAt(0).toUpperCase()}
                  </div>

                  {/* User info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 15 }}>{user.username}</span>
                      <span style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                        {ROLE_ICONS[user.role]} {ROLE_LABELS[user.role]}
                      </span>
                    </div>
                    {user.shopId ? (
                      <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>
                        🏪 {user.shopId.name} <span style={{ color: '#334155' }}>· {user.shopId.category}</span>
                      </p>
                    ) : (
                      <p style={{ color: '#334155', fontSize: 12, margin: '4px 0 0' }}>
                        {user.role === 'shop_owner' ? '⚠️ No shop linked' : 'No shop linked'}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => startEdit(user)}
                      style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: '#c4b5fd', borderRadius: 10, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                    >
                      ✏️ Edit
                    </button>
                    {deleteConfirm === user._id ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => handleDelete(user._id)}
                          style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', borderRadius: 10, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                        >
                          Yes, Delete
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8', borderRadius: 10, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(user._id)}
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', borderRadius: 10, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                      >
                        🗑 Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Shop-Owner linkage guidance */}
      <div style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 16, padding: 20 }}>
        <p style={{ color: '#7c3aed', fontWeight: 700, fontSize: 13, margin: '0 0 8px' }}>💡 How Shop Owner Accounts Work</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {[
            { step: '1', text: 'Create a shop first in Shop Management tab' },
            { step: '2', text: 'Create user with "Shop Owner" role' },
            { step: '3', text: 'Assign the shop to that user in the form' },
            { step: '4', text: 'Shop owner can log in and manage their shop' },
          ].map(item => (
            <div key={item.step} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ background: 'rgba(139,92,246,0.2)', color: '#c4b5fd', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{item.step}</span>
              <p style={{ color: '#64748b', fontSize: 13, margin: 0, lineHeight: 1.5 }}>{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const lbl: React.CSSProperties = { color: '#94a3b8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' };
const inp: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
const sel: React.CSSProperties = { width: '100%', background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', cursor: 'pointer' };
