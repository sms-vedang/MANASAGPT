'use client';

import { useState, useEffect } from 'react';

interface Ad {
  _id: string;
  type: string;
  priority: number;
  startDate: string;
  endDate?: string;
  content: string;
  shopId?: { _id: string; name: string };
  productId?: { _id: string; name: string };
}

export default function AdManagement() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [formData, setFormData] = useState({
    type: 'sponsored',
    priority: 0,
    startDate: '',
    endDate: '',
    content: '',
    shopId: '',
    productId: '',
  });

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const response = await fetch('/api/ads');
      const data = await response.json();
      setAds(data);
    } catch (error) {
      console.error('Failed to fetch ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingAd ? `/api/ads/${editingAd._id}` : '/api/ads';
      const method = editingAd ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchAds();
        setShowForm(false);
        setEditingAd(null);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to save ad:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ad?')) return;

    try {
      const response = await fetch(`/api/ads/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchAds();
      }
    } catch (error) {
      console.error('Failed to delete ad:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'sponsored',
      priority: 0,
      startDate: '',
      endDate: '',
      content: '',
      shopId: '',
      productId: '',
    });
  };

  if (loading) return <div className="text-center py-8">Loading ads...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Ads & Monetization</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
        >
          Create Ad
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">
            {editingAd ? 'Edit Ad' : 'Create New Ad'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="bg-gray-700 p-2 rounded"
                required
              >
                <option value="sponsored">Sponsored Shop</option>
                <option value="featured">Featured Product</option>
                <option value="banner">Banner Ad</option>
              </select>
              <input
                type="number"
                placeholder="Priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                className="bg-gray-700 p-2 rounded"
                min="0"
              />
              <input
                type="date"
                placeholder="Start Date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="bg-gray-700 p-2 rounded"
                required
              />
              <input
                type="date"
                placeholder="End Date (optional)"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="bg-gray-700 p-2 rounded"
              />
            </div>
            <textarea
              placeholder="Ad Content/Description"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="bg-gray-700 p-2 rounded w-full h-24"
              required
            />
            <div className="flex space-x-2">
              <button type="submit" className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded">
                {editingAd ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingAd(null);
                  resetForm();
                }}
                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-800 shadow-md rounded">
          <thead>
            <tr className="bg-gray-700">
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Content</th>
              <th className="px-4 py-2">Priority</th>
              <th className="px-4 py-2">Start Date</th>
              <th className="px-4 py-2">End Date</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ads.map((ad) => (
              <tr key={ad._id} className="border-b border-gray-700">
                <td className="px-4 py-2 capitalize">{ad.type}</td>
                <td className="px-4 py-2 max-w-xs truncate">{ad.content}</td>
                <td className="px-4 py-2">{ad.priority}</td>
                <td className="px-4 py-2">{new Date(ad.startDate).toLocaleDateString()}</td>
                <td className="px-4 py-2">{ad.endDate ? new Date(ad.endDate).toLocaleDateString() : 'Ongoing'}</td>
                <td className="px-4 py-2 space-x-2">
                  <button className="text-blue-400 hover:underline">Edit</button>
                  <button
                    onClick={() => handleDelete(ad._id)}
                    className="text-red-400 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}