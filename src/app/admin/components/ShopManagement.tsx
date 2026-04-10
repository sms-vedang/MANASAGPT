'use client';

import { useState, useEffect } from 'react';

interface HomeDelivery {
  enabled: boolean;
  minOrderAmount: number;
  deliveryCharge: number;
  freeDeliveryAbove: number;
  deliveryRadiusKm: number;
  estimatedTimeMinutes: number;
  deliveryNote: string;
}

interface Shop {
  _id: string;
  name: string;
  category: string;
  address: string;
  phone: string;
  whatsapp?: string;
  website?: string;
  rating: number;
  tags: string[];
  sponsored: boolean;
  priorityScore: number;
  verified: boolean;
  isOpen: boolean;
  openingHours?: string;
  description?: string;
  homeDelivery: HomeDelivery;
}

const emptyForm = {
  name: '',
  category: '',
  address: '',
  phone: '',
  whatsapp: '',
  website: '',
  rating: 0,
  tags: '',
  sponsored: false,
  priorityScore: 0,
  verified: false,
  isOpen: true,
  openingHours: '',
  description: '',
  homeDelivery: {
    enabled: false,
    minOrderAmount: 0,
    deliveryCharge: 0,
    freeDeliveryAbove: 0,
    deliveryRadiusKm: 0,
    estimatedTimeMinutes: 30,
    deliveryNote: '',
  },
};

const CATEGORIES = [
  'Grocery', 'Pharmacy / Medical', 'Clothing', 'Electronics',
  'Restaurant / Food', 'Bakery / Sweets', 'Stationery', 'Hardware',
  'Vegetables & Fruits', 'Dairy', 'Mobile Recharge', 'Salon / Beauty',
  'Automobile', 'Other',
];

export default function ShopManagement() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDelivery, setFilterDelivery] = useState<'all' | 'delivery' | 'no-delivery'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [expandedShop, setExpandedShop] = useState<string | null>(null);
  const [activeFormTab, setActiveFormTab] = useState<'basic' | 'delivery' | 'settings'>('basic');

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      const res = await fetch('/api/shops');
      const data = await res.json();
      setShops(Array.isArray(data) ? data : []);
    } catch {
      setMessage('❌ Failed to load shops');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (shop: Shop) => {
    setEditingShop(shop);
    setFormData({
      name: shop.name,
      category: shop.category,
      address: shop.address,
      phone: shop.phone,
      whatsapp: shop.whatsapp || '',
      website: shop.website || '',
      rating: shop.rating,
      tags: shop.tags.join(', '),
      sponsored: shop.sponsored,
      priorityScore: shop.priorityScore,
      verified: shop.verified,
      isOpen: shop.isOpen ?? true,
      openingHours: shop.openingHours || '',
      description: shop.description || '',
      homeDelivery: shop.homeDelivery || emptyForm.homeDelivery,
    });
    setActiveFormTab('basic');
    setShowForm(true);
    setMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    const payload = {
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
    };
    try {
      const url = editingShop ? `/api/shops/${editingShop._id}` : '/api/shops';
      const method = editingShop ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setMessage(editingShop ? '✅ Shop updated successfully!' : '✅ Shop created successfully!');
        fetchShops();
        if (!editingShop) { resetForm(); setShowForm(false); }
      } else {
        const d = await res.json();
        setMessage(`❌ ${d.error || 'Failed to save shop'}`);
      }
    } catch {
      setMessage('❌ Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/shops/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage('✅ Shop deleted.');
        setDeleteConfirm(null);
        fetchShops();
      }
    } catch {
      setMessage('❌ Failed to delete shop.');
    }
  };

  const quickToggle = async (id: string, field: string, value: boolean) => {
    try {
      await fetch(`/api/shops/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      fetchShops();
    } catch { /* silent */ }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingShop(null);
  };

  const filteredShops = shops.filter(shop => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || shop.name.toLowerCase().includes(q) || shop.category.toLowerCase().includes(q) || shop.address.toLowerCase().includes(q);
    const matchCategory = !filterCategory || shop.category === filterCategory;
    const matchDelivery =
      filterDelivery === 'all' ? true :
      filterDelivery === 'delivery' ? shop.homeDelivery?.enabled :
      !shop.homeDelivery?.enabled;
    return matchSearch && matchCategory && matchDelivery;
  });

  const stats = {
    total: shops.length,
    verified: shops.filter(s => s.verified).length,
    sponsored: shops.filter(s => s.sponsored).length,
    delivery: shops.filter(s => s.homeDelivery?.enabled).length,
    open: shops.filter(s => s.isOpen !== false).length,
  };

  const setHD = (field: keyof typeof emptyForm.homeDelivery, value: boolean | number | string) => {
    setFormData(prev => ({ ...prev, homeDelivery: { ...prev.homeDelivery, [field]: value } }));
  };

  if (loading) {
    return (
      <div style={s.loader}>
        <div style={s.spinnerPurple} />
        <p style={{ color: '#94a3b8', marginTop: 12, fontSize: 14 }}>Loading shops...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Stats row */}
      <div style={s.statsRow}>
        {[
          { label: 'Total Shops', value: stats.total, icon: '🏪', color: '#7c3aed' },
          { label: 'Verified', value: stats.verified, icon: '✅', color: '#10b981' },
          { label: 'Sponsored', value: stats.sponsored, icon: '⭐', color: '#f59e0b' },
          { label: 'Home Delivery', value: stats.delivery, icon: '🛵', color: '#3b82f6' },
          { label: 'Currently Open', value: stats.open, icon: '🟢', color: '#06b6d4' },
        ].map(stat => (
          <div key={stat.label} style={{ ...s.statCard, borderColor: `${stat.color}30` }}>
            <div style={{ fontSize: 22 }}>{stat.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Header + Controls */}
      <div style={s.headerRow}>
        <div>
          <h2 style={s.pageTitle}>Shop Management</h2>
          <p style={s.pageSubtitle}>Manage all shops, home delivery settings, and owner assignments</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); resetForm(); setMessage(''); setActiveFormTab('basic'); }} style={s.primaryBtn}>
          {showForm && !editingShop ? '✕ Cancel' : '＋ Add Shop'}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div style={{ ...s.messageBanner, borderColor: message.startsWith('✅') ? '#10b98140' : '#ef444440', background: message.startsWith('✅') ? '#10b98112' : '#ef444412', color: message.startsWith('✅') ? '#34d399' : '#f87171' }}>
          {message}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div style={s.formCard}>
          <div style={s.formHeader}>
            <h3 style={s.formTitle}>{editingShop ? `✏️ Editing: ${editingShop.name}` : '➕ Add New Shop'}</h3>
            <button onClick={() => { setShowForm(false); resetForm(); }} style={s.closeBtn}>✕</button>
          </div>

          {/* Form Tabs */}
          <div style={s.tabRow}>
            {(['basic', 'delivery', 'settings'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveFormTab(tab)} style={{ ...s.tabBtn, ...(activeFormTab === tab ? s.tabBtnActive : {}) }}>
                {tab === 'basic' ? '🏪 Basic Info' : tab === 'delivery' ? '🛵 Home Delivery' : '⚙️ Settings'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Basic Info Tab */}
            {activeFormTab === 'basic' && (
              <div style={s.formGrid}>
                <FormField label="Shop Name *">
                  <input style={s.input} value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required placeholder="e.g. Ramesh Kirana Store" />
                </FormField>
                <FormField label="Category *">
                  <select style={s.select} value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))} required>
                    <option value="">-- Select Category --</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </FormField>
                <FormField label="Phone *">
                  <input style={s.input} value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} required placeholder="9876543210" />
                </FormField>
                <FormField label="WhatsApp Number">
                  <input style={s.input} value={formData.whatsapp} onChange={e => setFormData(p => ({ ...p, whatsapp: e.target.value }))} placeholder="9876543210 (optional)" />
                </FormField>
                <FormField label="Address *" span2>
                  <textarea style={{ ...s.input, minHeight: 80, resize: 'vertical' }} value={formData.address} onChange={e => setFormData(p => ({ ...p, address: e.target.value }))} required placeholder="Full address with landmark" />
                </FormField>
                <FormField label="Description" span2>
                  <textarea style={{ ...s.input, minHeight: 70, resize: 'vertical' }} value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="Short description about the shop..." />
                </FormField>
                <FormField label="Website / Social Link">
                  <input style={s.input} value={formData.website} onChange={e => setFormData(p => ({ ...p, website: e.target.value }))} placeholder="https://..." />
                </FormField>
                <FormField label="Opening Hours">
                  <input style={s.input} value={formData.openingHours} onChange={e => setFormData(p => ({ ...p, openingHours: e.target.value }))} placeholder="e.g. 9 AM – 9 PM, Mon–Sat" />
                </FormField>
                <FormField label="Tags (comma separated)" span2>
                  <input style={s.input} value={formData.tags} onChange={e => setFormData(p => ({ ...p, tags: e.target.value }))} placeholder="grocery, fresh produce, daily needs" />
                </FormField>
              </div>
            )}

            {/* Home Delivery Tab */}
            {activeFormTab === 'delivery' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Enable Toggle */}
                <div style={s.toggleCard}>
                  <div>
                    <p style={s.toggleTitle}>🛵 Home Delivery</p>
                    <p style={s.toggleDesc}>Enable home delivery for this shop. Customers will be able to order for delivery.</p>
                  </div>
                  <label style={s.toggleSwitch}>
                    <input type="checkbox" checked={formData.homeDelivery.enabled} onChange={e => setHD('enabled', e.target.checked)} style={{ display: 'none' }} />
                    <div style={{ ...s.toggleTrack, background: formData.homeDelivery.enabled ? '#7c3aed' : '#1e293b' }}>
                      <div style={{ ...s.toggleThumb, transform: formData.homeDelivery.enabled ? 'translateX(24px)' : 'translateX(2px)' }} />
                    </div>
                  </label>
                </div>

                {formData.homeDelivery.enabled && (
                  <div style={s.formGrid}>
                    <FormField label="Minimum Order Amount (₹) *">
                      <input type="number" style={s.input} min="0" value={formData.homeDelivery.minOrderAmount} onChange={e => setHD('minOrderAmount', Number(e.target.value))} placeholder="e.g. 200" />
                      <span style={s.fieldHint}>Orders below this amount won't qualify for delivery</span>
                    </FormField>
                    <FormField label="Delivery Charge (₹)">
                      <input type="number" style={s.input} min="0" value={formData.homeDelivery.deliveryCharge} onChange={e => setHD('deliveryCharge', Number(e.target.value))} placeholder="e.g. 30" />
                      <span style={s.fieldHint}>Charge added per delivery. Set 0 for free delivery.</span>
                    </FormField>
                    <FormField label="Free Delivery Above (₹)">
                      <input type="number" style={s.input} min="0" value={formData.homeDelivery.freeDeliveryAbove} onChange={e => setHD('freeDeliveryAbove', Number(e.target.value))} placeholder="e.g. 500 (0 = no free threshold)" />
                      <span style={s.fieldHint}>Set 0 to disable free delivery threshold</span>
                    </FormField>
                    <FormField label="Delivery Radius (km)">
                      <input type="number" style={s.input} min="0" step="0.5" value={formData.homeDelivery.deliveryRadiusKm} onChange={e => setHD('deliveryRadiusKm', Number(e.target.value))} placeholder="e.g. 3" />
                      <span style={s.fieldHint}>Maximum distance for home delivery</span>
                    </FormField>
                    <FormField label="Estimated Delivery Time (minutes)">
                      <input type="number" style={s.input} min="5" value={formData.homeDelivery.estimatedTimeMinutes} onChange={e => setHD('estimatedTimeMinutes', Number(e.target.value))} placeholder="e.g. 30" />
                    </FormField>
                    <FormField label="Delivery Note / Conditions" span2>
                      <textarea style={{ ...s.input, minHeight: 70, resize: 'vertical' }} value={formData.homeDelivery.deliveryNote} onChange={e => setHD('deliveryNote', e.target.value)} placeholder="e.g. Delivery available within Manasa city only. Cash on delivery accepted." />
                    </FormField>

                    {/* Delivery Summary */}
                    <div style={{ ...s.infoBox, gridColumn: '1 / -1' }}>
                      <p style={{ color: '#7c3aed', fontWeight: 700, fontSize: 13, marginBottom: 8 }}>📋 Delivery Policy Preview</p>
                      <p style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.7 }}>
                        Min. Order: <strong>₹{formData.homeDelivery.minOrderAmount}</strong> &nbsp;|&nbsp;
                        Delivery Charge: <strong>₹{formData.homeDelivery.deliveryCharge}</strong>
                        {formData.homeDelivery.freeDeliveryAbove > 0 && <> &nbsp;|&nbsp; Free above: <strong>₹{formData.homeDelivery.freeDeliveryAbove}</strong></>}
                        {formData.homeDelivery.deliveryRadiusKm > 0 && <> &nbsp;|&nbsp; Radius: <strong>{formData.homeDelivery.deliveryRadiusKm} km</strong></>}
                        &nbsp;|&nbsp; ETA: <strong>~{formData.homeDelivery.estimatedTimeMinutes} mins</strong>
                      </p>
                    </div>
                  </div>
                )}

                {!formData.homeDelivery.enabled && (
                  <div style={s.disabledBox}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🏠</div>
                    <p style={{ color: '#475569', fontSize: 14 }}>Home delivery is disabled for this shop.</p>
                    <p style={{ color: '#334155', fontSize: 12, marginTop: 4 }}>Toggle the switch above to configure delivery settings.</p>
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeFormTab === 'settings' && (
              <div style={s.formGrid}>
                <FormField label="Rating (0–5)">
                  <input type="number" style={s.input} min="0" max="5" step="0.1" value={formData.rating} onChange={e => setFormData(p => ({ ...p, rating: parseFloat(e.target.value) }))} />
                </FormField>
                <FormField label="Priority Score">
                  <input type="number" style={s.input} value={formData.priorityScore} onChange={e => setFormData(p => ({ ...p, priorityScore: parseInt(e.target.value) || 0 })} />
                  <span style={s.fieldHint}>Higher score = shown first in AI responses</span>
                </FormField>
                <div style={{ gridColumn: '1 / -1', display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                  {[
                    { key: 'verified', label: '✅ Mark as Verified', desc: 'Shows a verified badge' },
                    { key: 'sponsored', label: '⭐ Mark as Sponsored', desc: 'Featured placement' },
                    { key: 'isOpen', label: '🟢 Currently Open', desc: 'Real-time open/close status' },
                  ].map(toggle => (
                    <label key={toggle.key} style={s.checkCard}>
                      <input
                        type="checkbox"
                        checked={formData[toggle.key as keyof typeof formData] as boolean}
                        onChange={e => setFormData(p => ({ ...p, [toggle.key]: e.target.checked }))}
                        style={{ accentColor: '#7c3aed', width: 18, height: 18, flexShrink: 0 }}
                      />
                      <div>
                        <p style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 600, margin: 0 }}>{toggle.label}</p>
                        <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>{toggle.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div style={s.formActions}>
              <button type="submit" disabled={saving} style={{ ...s.primaryBtn, opacity: saving ? 0.6 : 1 }}>
                {saving ? '⏳ Saving...' : editingShop ? '💾 Update Shop' : '✅ Create Shop'}
              </button>
              {editingShop && (
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }} style={s.secondaryBtn}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div style={s.filterRow}>
        <input
          style={{ ...s.input, flex: 1, minWidth: 200, maxWidth: 340 }}
          placeholder="🔍 Search shops..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <select style={{ ...s.select, minWidth: 160 }} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select style={{ ...s.select, minWidth: 160 }} value={filterDelivery} onChange={e => setFilterDelivery(e.target.value as typeof filterDelivery)}>
          <option value="all">All Shops</option>
          <option value="delivery">🛵 With Delivery</option>
          <option value="no-delivery">🚫 No Delivery</option>
        </select>
        <div style={{ color: '#475569', fontSize: 13, whiteSpace: 'nowrap' }}>
          Showing {filteredShops.length} of {shops.length}
        </div>
      </div>

      {/* Shops Grid */}
      {filteredShops.length === 0 ? (
        <div style={s.emptyState}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏪</div>
          <p style={{ color: '#475569', fontSize: 16 }}>No shops found.</p>
          <p style={{ color: '#334155', fontSize: 13, marginTop: 4 }}>Try changing the filters or add a new shop.</p>
        </div>
      ) : (
        <div style={s.shopsGrid}>
          {filteredShops.map(shop => (
            <div key={shop._id} style={{ ...s.shopCard, borderColor: editingShop?._id === shop._id ? '#7c3aed60' : '#1e293b' }}>
              {/* Card Header */}
              <div style={s.shopCardHeader}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h3 style={s.shopName}>{shop.name}</h3>
                    {shop.verified && <span style={s.badge('emerald')}>✅ Verified</span>}
                    {shop.sponsored && <span style={s.badge('amber')}>⭐ Sponsored</span>}
                    {shop.homeDelivery?.enabled && <span style={s.badge('blue')}>🛵 Delivery</span>}
                    <span style={{ ...s.badge(shop.isOpen !== false ? 'green' : 'red'), marginLeft: 'auto' }}>
                      {shop.isOpen !== false ? '🟢 Open' : '🔴 Closed'}
                    </span>
                  </div>
                  <p style={s.shopCategory}>{shop.category}</p>
                </div>
              </div>

              {/* Card Info */}
              <div style={s.shopInfo}>
                <InfoItem icon="📍" text={shop.address} />
                <InfoItem icon="📞" text={shop.phone} />
                {shop.openingHours && <InfoItem icon="🕐" text={shop.openingHours} />}
                {shop.rating > 0 && <InfoItem icon="⭐" text={`${shop.rating.toFixed(1)} / 5`} />}
              </div>

              {/* Delivery Summary */}
              {shop.homeDelivery?.enabled && (
                <div style={s.deliveryBadgeRow}>
                  <div style={s.deliveryChip}>Min ₹{shop.homeDelivery.minOrderAmount}</div>
                  <div style={s.deliveryChip}>Charge ₹{shop.homeDelivery.deliveryCharge}</div>
                  {shop.homeDelivery.freeDeliveryAbove > 0 && <div style={s.deliveryChip}>Free ↑₹{shop.homeDelivery.freeDeliveryAbove}</div>}
                  <div style={s.deliveryChip}>~{shop.homeDelivery.estimatedTimeMinutes}min</div>
                </div>
              )}

              {/* Quick Toggles */}
              <div style={s.quickToggles}>
                <QuickToggle label="Verified" active={shop.verified} onChange={v => quickToggle(shop._id, 'verified', v)} color="#10b981" />
                <QuickToggle label="Sponsored" active={shop.sponsored} onChange={v => quickToggle(shop._id, 'sponsored', v)} color="#f59e0b" />
                <QuickToggle label="Open" active={shop.isOpen !== false} onChange={v => quickToggle(shop._id, 'isOpen', v)} color="#06b6d4" />
              </div>

              {/* Actions */}
              <div style={s.cardActions}>
                <button onClick={() => handleEdit(shop)} style={s.editBtn}>✏️ Edit</button>
                <button onClick={() => setExpandedShop(expandedShop === shop._id ? null : shop._id)} style={s.infoBtn}>
                  {expandedShop === shop._id ? '▲ Less' : '▼ Details'}
                </button>
                {deleteConfirm === shop._id ? (
                  <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                    <button onClick={() => handleDelete(shop._id)} style={s.confirmDeleteBtn}>Confirm Delete</button>
                    <button onClick={() => setDeleteConfirm(null)} style={s.cancelBtn}>Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteConfirm(shop._id)} style={{ ...s.deleteBtn, marginLeft: 'auto' }}>🗑 Delete</button>
                )}
              </div>

              {/* Expanded Details */}
              {expandedShop === shop._id && (
                <div style={s.expandedDetails}>
                  {shop.description && (
                    <div style={{ marginBottom: 12 }}>
                      <p style={s.expandLabel}>Description</p>
                      <p style={s.expandValue}>{shop.description}</p>
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <p style={s.expandLabel}>Priority Score</p>
                      <p style={s.expandValue}>{shop.priorityScore}</p>
                    </div>
                    <div>
                      <p style={s.expandLabel}>Tags</p>
                      <p style={s.expandValue}>{shop.tags.length > 0 ? shop.tags.join(', ') : 'None'}</p>
                    </div>
                    {shop.website && (
                      <div>
                        <p style={s.expandLabel}>Website</p>
                        <a href={shop.website} target="_blank" rel="noreferrer" style={{ color: '#7c3aed', fontSize: 13 }}>Visit ↗</a>
                      </div>
                    )}
                    {shop.whatsapp && (
                      <div>
                        <p style={s.expandLabel}>WhatsApp</p>
                        <p style={s.expandValue}>{shop.whatsapp}</p>
                      </div>
                    )}
                  </div>
                  {shop.homeDelivery?.enabled && shop.homeDelivery.deliveryNote && (
                    <div style={{ marginTop: 10 }}>
                      <p style={s.expandLabel}>Delivery Note</p>
                      <p style={s.expandValue}>{shop.homeDelivery.deliveryNote}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FormField({ label, children, span2 }: { label: string; children: React.ReactNode; span2?: boolean }) {
  return (
    <div style={{ gridColumn: span2 ? '1 / -1' : undefined, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
      {children}
    </div>
  );
}

function InfoItem({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 13, color: '#94a3b8' }}>
      <span style={{ flexShrink: 0 }}>{icon}</span>
      <span style={{ lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}

function QuickToggle({ label, active, onChange, color }: { label: string; active: boolean; onChange: (v: boolean) => void; color: string }) {
  return (
    <button
      onClick={() => onChange(!active)}
      style={{
        display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
        borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none',
        background: active ? `${color}22` : 'rgba(255,255,255,0.04)',
        color: active ? color : '#475569',
        transition: 'all 0.2s',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: active ? color : '#334155', display: 'inline-block' }} />
      {label}
    </button>
  );
}

const s = {
  loader: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', minHeight: 300 },
  spinnerPurple: { width: 44, height: 44, border: '3px solid rgba(139,92,246,0.2)', borderTop: '3px solid #7c3aed', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 },
  statCard: { background: 'rgba(255,255,255,0.03)', border: '1px solid', borderRadius: 16, padding: '16px 18px', display: 'flex', flexDirection: 'column' as const, gap: 6, alignItems: 'flex-start' as const },
  headerRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' as const },
  pageTitle: { color: '#f1f5f9', fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' },
  pageSubtitle: { color: '#475569', fontSize: 13, margin: '4px 0 0' },
  primaryBtn: { background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' as const },
  messageBanner: { borderRadius: 12, padding: '12px 16px', border: '1px solid', fontSize: 14, fontWeight: 500 },
  formCard: { background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 20, padding: 24, backdropFilter: 'blur(12px)' },
  formHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  formTitle: { color: '#e2e8f0', fontSize: 17, fontWeight: 700, margin: 0 },
  closeBtn: { background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8', cursor: 'pointer', borderRadius: 8, padding: '6px 12px', fontSize: 16 },
  tabRow: { display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' as const },
  tabBtn: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#64748b', padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' },
  tabBtnActive: { background: 'rgba(139,92,246,0.15)', borderColor: 'rgba(139,92,246,0.35)', color: '#c4b5fd' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 },
  input: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' },
  select: { width: '100%', background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit', cursor: 'pointer' },
  fieldHint: { color: '#475569', fontSize: 11, marginTop: 4 },
  toggleCard: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20 },
  toggleTitle: { color: '#e2e8f0', fontWeight: 600, fontSize: 15, margin: '0 0 4px' },
  toggleDesc: { color: '#64748b', fontSize: 13, margin: 0 },
  toggleSwitch: { cursor: 'pointer', flexShrink: 0 },
  toggleTrack: { width: 56, height: 28, borderRadius: 14, position: 'relative' as const, transition: 'background 0.2s' },
  toggleThumb: { position: 'absolute' as const, top: 3, width: 22, height: 22, borderRadius: '50%', background: '#fff', transition: 'transform 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.4)' },
  infoBox: { background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 14, padding: 16 },
  disabledBox: { textAlign: 'center' as const, padding: '40px 20px', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 16 },
  checkCard: { display: 'flex', alignItems: 'flex-start', gap: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 16, cursor: 'pointer', flex: '1 1 200px' },
  formActions: { display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' as const },
  secondaryBtn: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#94a3b8', padding: '10px 20px', fontSize: 14, fontWeight: 500, cursor: 'pointer' },
  filterRow: { display: 'flex', gap: 12, flexWrap: 'wrap' as const, alignItems: 'center' },
  emptyState: { textAlign: 'center' as const, padding: '60px 20px', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 20 },
  shopsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 18 },
  shopCard: { background: 'rgba(15,23,42,0.85)', border: '1px solid', borderRadius: 20, padding: 20, display: 'flex', flexDirection: 'column' as const, gap: 14, transition: 'border-color 0.2s' },
  shopCardHeader: { display: 'flex', gap: 12 },
  shopName: { color: '#f1f5f9', fontSize: 16, fontWeight: 700, margin: 0 },
  shopCategory: { color: '#7c3aed', fontSize: 12, fontWeight: 600, margin: '4px 0 0', textTransform: 'uppercase' as const, letterSpacing: '0.06em' },
  shopInfo: { display: 'flex', flexDirection: 'column' as const, gap: 6 },
  deliveryBadgeRow: { display: 'flex', gap: 8, flexWrap: 'wrap' as const },
  deliveryChip: { background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', color: '#93c5fd', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 },
  quickToggles: { display: 'flex', gap: 8, flexWrap: 'wrap' as const },
  cardActions: { display: 'flex', gap: 8, flexWrap: 'wrap' as const, alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 },
  editBtn: { background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: '#c4b5fd', borderRadius: 10, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  infoBtn: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b', borderRadius: 10, padding: '6px 14px', fontSize: 12, cursor: 'pointer' },
  deleteBtn: { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', borderRadius: 10, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  confirmDeleteBtn: { background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', borderRadius: 10, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  cancelBtn: { background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8', borderRadius: 10, padding: '6px 12px', fontSize: 12, cursor: 'pointer' },
  expandedDetails: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 16 },
  expandLabel: { color: '#475569', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', margin: '0 0 4px' },
  expandValue: { color: '#94a3b8', fontSize: 13, margin: 0, lineHeight: 1.5 },
  badge: (color: string) => {
    const map: Record<string, { bg: string; border: string; text: string }> = {
      emerald: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', text: '#34d399' },
      amber: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: '#fbbf24' },
      blue: { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', text: '#93c5fd' },
      green: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', text: '#34d399' },
      red: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)', text: '#f87171' },
    };
    const c = map[color] || map.blue;
    return { background: c.bg, border: `1px solid ${c.border}`, color: c.text, borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' as const } as React.CSSProperties;
  },
};