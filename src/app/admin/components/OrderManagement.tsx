'use client';

import { useState, useEffect } from 'react';

interface Order {
  _id: string;
  productName: string;
  productPrice: number;
  shopName: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  quantity: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  note?: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  preparing: '#8b5cf6',
  ready: '#06b6d4',
  delivered: '#10b981',
  cancelled: '#ef4444',
};

const STATUS_FLOW = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'];

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [updating, setUpdating] = useState<string | null>(null);
  const limit = 20;

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(limit), page: String(page) });
      if (filterStatus) params.set('status', filterStatus);
      const res = await fetch(`/api/orders?${params}`);
      const data = await res.json();
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch {
      console.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchOrders(); }, [page, filterStatus]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      await fetch(`/api/orders?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      await fetchOrders();
    } finally {
      setUpdating(null);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#e2e8f0' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>
            📦 Orders
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            {total} total orders
          </p>
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', gap: 8 }}>
          {['', 'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'].map((s) => (
            <button
              key={s}
              onClick={() => { setFilterStatus(s); setPage(1); }}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                border: filterStatus === s ? '1px solid rgba(139,92,246,0.5)' : '1px solid rgba(255,255,255,0.08)',
                background: filterStatus === s ? 'rgba(139,92,246,0.18)' : 'rgba(255,255,255,0.04)',
                color: filterStatus === s ? '#c4b5fd' : '#64748b',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      {!filterStatus && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Pending', key: 'pending', color: '#f59e0b' },
            { label: 'Confirmed', key: 'confirmed', color: '#3b82f6' },
            { label: 'Delivered', key: 'delivered', color: '#10b981' },
            { label: 'Cancelled', key: 'cancelled', color: '#ef4444' },
          ].map(({ label, key, color }) => {
            const count = orders.filter((o) => o.status === key).length;
            return (
              <div key={key} style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${color}30`,
                borderRadius: 14,
                padding: '14px 16px',
              }}>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color }}>{count}</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Orders table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>Loading orders...</div>
      ) : orders.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 0',
          background: 'rgba(255,255,255,0.02)', borderRadius: 18,
          border: '1px solid rgba(255,255,255,0.06)', color: '#475569',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>No orders yet</p>
          <p style={{ margin: '6px 0 0', fontSize: 13 }}>Orders placed via ManasaGPT chat will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {orders.map((order) => {
            const statusColor = STATUS_COLORS[order.status] || '#64748b';
            const currIdx = STATUS_FLOW.indexOf(order.status);
            const nextStatus = currIdx >= 0 && currIdx < STATUS_FLOW.length - 1 ? STATUS_FLOW[currIdx + 1] : null;

            return (
              <div key={order._id} style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16,
                padding: '16px 20px',
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: 16,
                alignItems: 'start',
              }}>
                {/* Left info */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'capitalize',
                      background: `${statusColor}20`,
                      color: statusColor,
                      border: `1px solid ${statusColor}40`,
                    }}>
                      {order.status}
                    </span>
                    <span style={{ fontSize: 11, color: '#475569' }}>
                      {new Date(order.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span style={{ fontSize: 11, color: '#475569', fontFamily: 'monospace' }}>
                      #{order._id.slice(-6).toUpperCase()}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px' }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#f1f5f9', gridColumn: '1 / -1' }}>
                      {order.productName} <span style={{ fontWeight: 400, color: '#64748b' }}>×{order.quantity}</span>
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 13, color: '#94a3b8' }}>🏪 {order.shopName}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 13, color: '#10b981', fontWeight: 700 }}>₹{order.totalPrice}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 13, color: '#94a3b8' }}>👤 {order.customerName}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 13, color: '#94a3b8' }}>📞 {order.customerPhone}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b', gridColumn: '1 / -1' }}>
                      📍 {order.customerAddress}
                    </p>
                    {order.note && (
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: '#7c3aed', gridColumn: '1 / -1' }}>
                        💬 {order.note}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                  {nextStatus && (
                    <button
                      onClick={() => void updateStatus(order._id, nextStatus)}
                      disabled={updating === order._id}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 10,
                        border: '1px solid rgba(16,185,129,0.3)',
                        background: 'rgba(16,185,129,0.12)',
                        color: '#34d399',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {updating === order._id ? '...' : `→ ${nextStatus}`}
                    </button>
                  )}
                  {order.status !== 'cancelled' && order.status !== 'delivered' && (
                    <button
                      onClick={() => void updateStatus(order._id, 'cancelled')}
                      disabled={updating === order._id}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 10,
                        border: '1px solid rgba(239,68,68,0.3)',
                        background: 'rgba(239,68,68,0.08)',
                        color: '#f87171',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}
          >
            ←
          </button>
          <span style={{ padding: '8px 16px', fontSize: 13, color: '#64748b' }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{ padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
