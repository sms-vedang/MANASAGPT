'use client';

import { useState, useEffect } from 'react';

interface Shop {
  _id: string;
  name: string;
  category: string;
  address: string;
  phone: string;
  rating: number;
  tags: string[];
  sponsored: boolean;
  priorityScore: number;
  verified: boolean;
}

export default function ShopManagement() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    address: '',
    phone: '',
    rating: 0,
    tags: '',
    sponsored: false,
    priorityScore: 0,
    verified: false,
  });

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    try {
      const response = await fetch('/api/shops');
      const data = await response.json();
      setShops(data);
    } catch (error) {
      console.error('Failed to fetch shops:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()),
    };

    try {
      const url = editingShop ? `/api/shops/${editingShop._id}` : '/api/shops';
      const method = editingShop ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        fetchShops();
        setShowForm(false);
        setEditingShop(null);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to save shop:', error);
    }
  };

  const handleEdit = (shop: Shop) => {
    setEditingShop(shop);
    setFormData({
      name: shop.name,
      category: shop.category,
      address: shop.address,
      phone: shop.phone,
      rating: shop.rating,
      tags: shop.tags.join(', '),
      sponsored: shop.sponsored,
      priorityScore: shop.priorityScore,
      verified: shop.verified,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shop?')) return;

    try {
      const response = await fetch(`/api/shops/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchShops();
      }
    } catch (error) {
      console.error('Failed to delete shop:', error);
    }
  };

  const toggleSponsored = async (id: string, current: boolean) => {
    try {
      const response = await fetch(`/api/shops/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sponsored: !current }),
      });
      if (response.ok) {
        fetchShops();
      }
    } catch (error) {
      console.error('Failed to update shop:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      address: '',
      phone: '',
      rating: 0,
      tags: '',
      sponsored: false,
      priorityScore: 0,
      verified: false,
    });
  };

  if (loading) return <div className="text-center py-8">Loading shops...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Shop Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
        >
          Add Shop
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">
            {editingShop ? 'Edit Shop' : 'Add New Shop'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Shop Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-gray-700 p-2 rounded"
                required
              />
              <input
                type="text"
                placeholder="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="bg-gray-700 p-2 rounded"
                required
              />
              <input
                type="text"
                placeholder="Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="bg-gray-700 p-2 rounded"
                required
              />
              <input
                type="text"
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-gray-700 p-2 rounded"
                required
              />
              <input
                type="number"
                placeholder="Rating"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                className="bg-gray-700 p-2 rounded"
                min="0"
                max="5"
                step="0.1"
              />
              <input
                type="number"
                placeholder="Priority Score"
                value={formData.priorityScore}
                onChange={(e) => setFormData({ ...formData, priorityScore: parseInt(e.target.value) })}
                className="bg-gray-700 p-2 rounded"
              />
              <input
                type="text"
                placeholder="Tags (comma separated)"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="bg-gray-700 p-2 rounded"
              />
            </div>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.sponsored}
                  onChange={(e) => setFormData({ ...formData, sponsored: e.target.checked })}
                  className="mr-2"
                />
                Sponsored
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.verified}
                  onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
                  className="mr-2"
                />
                Verified
              </label>
            </div>
            <div className="flex space-x-2">
              <button type="submit" className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded">
                {editingShop ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingShop(null);
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
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Address</th>
              <th className="px-4 py-2">Phone</th>
              <th className="px-4 py-2">Rating</th>
              <th className="px-4 py-2">Sponsored</th>
              <th className="px-4 py-2">Verified</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shops.map((shop) => (
              <tr key={shop._id} className="border-b border-gray-700">
                <td className="px-4 py-2">{shop.name}</td>
                <td className="px-4 py-2">{shop.category}</td>
                <td className="px-4 py-2">{shop.address}</td>
                <td className="px-4 py-2">{shop.phone}</td>
                <td className="px-4 py-2">{shop.rating}</td>
                <td className="px-4 py-2">
                  <input
                    type="checkbox"
                    checked={shop.sponsored}
                    onChange={() => toggleSponsored(shop._id, shop.sponsored)}
                  />
                </td>
                <td className="px-4 py-2">
                  {shop.verified ? '✅' : '❌'}
                </td>
                <td className="px-4 py-2 space-x-2">
                  <button
                    onClick={() => handleEdit(shop)}
                    className="text-blue-400 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(shop._id)}
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