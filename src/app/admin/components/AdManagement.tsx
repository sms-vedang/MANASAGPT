'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

interface Ad {
  _id: string;
  type: 'sponsored' | 'featured' | 'banner';
  priority: number;
  startDate: string;
  endDate?: string;
  content: string;
  image?: string;
  shopId?: { _id: string; name: string };
  productId?: { _id: string; name: string };
}

interface ShopOption {
  _id: string;
  name: string;
}

interface ProductOption {
  _id: string;
  name: string;
}

type FormDataState = {
  type: 'sponsored' | 'featured' | 'banner';
  priority: number;
  startDate: string;
  endDate: string;
  content: string;
  image: string;
  shopId: string;
  productId: string;
};

const initialFormData: FormDataState = {
  type: 'sponsored',
  priority: 0,
  startDate: '',
  endDate: '',
  content: '',
  image: '',
  shopId: '',
  productId: '',
};

export default function AdManagement() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [shops, setShops] = useState<ShopOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [formData, setFormData] = useState<FormDataState>(initialFormData);

  useEffect(() => {
    void Promise.all([fetchAds(), fetchReferences()]);
  }, []);

  const fetchAds = async () => {
    try {
      const response = await fetch('/api/ads');
      const data = await response.json();
      setAds(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferences = async () => {
    try {
      const [shopsResponse, productsResponse] = await Promise.all([
        fetch('/api/shops'),
        fetch('/api/products'),
      ]);
      const [shopsData, productsData] = await Promise.all([
        shopsResponse.json(),
        productsResponse.json(),
      ]);
      setShops(Array.isArray(shopsData) ? shopsData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (error) {
      console.error('Failed to fetch ad references:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...formData,
      endDate: formData.endDate || undefined,
      image: formData.image || undefined,
      shopId: formData.type === 'sponsored' ? formData.shopId || undefined : undefined,
      productId: formData.type === 'featured' ? formData.productId || undefined : undefined,
    };

    try {
      const url = editingAd ? `/api/ads/${editingAd._id}` : '/api/ads';
      const method = editingAd ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await fetchAds();
        setShowForm(false);
        setEditingAd(null);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to save ad:', error);
    }
  };

  const handleEdit = (ad: Ad) => {
    setEditingAd(ad);
    setFormData({
      type: ad.type,
      priority: ad.priority,
      startDate: ad.startDate ? ad.startDate.slice(0, 10) : '',
      endDate: ad.endDate ? ad.endDate.slice(0, 10) : '',
      content: ad.content,
      image: ad.image || '',
      shopId: ad.shopId?._id || '',
      productId: ad.productId?._id || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ad?')) return;

    try {
      const response = await fetch(`/api/ads/${id}`, { method: 'DELETE' });
      if (response.ok) {
        await fetchAds();
      }
    } catch (error) {
      console.error('Failed to delete ad:', error);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
  };

  const activeTypeHelp =
    formData.type === 'banner'
      ? 'Banner ads can show on the AI page with an image and message.'
      : formData.type === 'sponsored'
        ? 'Sponsored ads should be linked to a shop so recommendations can mention the business.'
        : 'Featured ads should be linked to a product for promotion inside the assistant.';

  if (loading) return <div className="py-8 text-center">Loading ads...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Ads & Monetization</h2>
          <p className="mt-1 text-sm text-slate-400">Manage banner placements and sponsored recommendations.</p>
        </div>
        <button
          onClick={() => {
            setEditingAd(null);
            resetForm();
            setShowForm(true);
          }}
          className="rounded-xl bg-blue-600 px-4 py-2 font-medium hover:bg-blue-700"
        >
          Create Ad
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-6">
          <h3 className="mb-1 text-xl font-semibold">{editingAd ? 'Edit Ad' : 'Create New Ad'}</h3>
          <p className="mb-5 text-sm text-slate-400">{activeTypeHelp}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: e.target.value as FormDataState['type'],
                    shopId: '',
                    productId: '',
                  }))
                }
                className="rounded-lg bg-slate-700 p-3"
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
                onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                className="rounded-lg bg-slate-700 p-3"
                min="0"
              />

              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="rounded-lg bg-slate-700 p-3"
                required
              />

              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="rounded-lg bg-slate-700 p-3"
              />
            </div>

            <textarea
              placeholder="Ad content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="h-28 w-full rounded-lg bg-slate-700 p-3"
              required
            />

            <input
              type="text"
              placeholder="Image URL or public asset path"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full rounded-lg bg-slate-700 p-3"
            />

            {formData.type === 'sponsored' && (
              <select
                value={formData.shopId}
                onChange={(e) => setFormData({ ...formData, shopId: e.target.value })}
                className="w-full rounded-lg bg-slate-700 p-3"
                required
              >
                <option value="">Select shop</option>
                {shops.map((shop) => (
                  <option key={shop._id} value={shop._id}>
                    {shop.name}
                  </option>
                ))}
              </select>
            )}

            {formData.type === 'featured' && (
              <select
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                className="w-full rounded-lg bg-slate-700 p-3"
                required
              >
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name}
                  </option>
                ))}
              </select>
            )}

            <div className="flex gap-3">
              <button type="submit" className="rounded-lg bg-green-600 px-4 py-2 font-medium hover:bg-green-700">
                {editingAd ? 'Update Ad' : 'Create Ad'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingAd(null);
                  resetForm();
                }}
                className="rounded-lg bg-slate-600 px-4 py-2 font-medium hover:bg-slate-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-800">
        <table className="min-w-full">
          <thead>
            <tr className="bg-slate-700/70 text-left text-sm text-slate-200">
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Content</th>
              <th className="px-4 py-3">Linked Item</th>
              <th className="px-4 py-3">Image</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Schedule</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ads.map((ad) => (
              <tr key={ad._id} className="border-t border-slate-700">
                <td className="px-4 py-3 capitalize">{ad.type}</td>
                <td className="max-w-sm px-4 py-3">{ad.content}</td>
                <td className="px-4 py-3 text-sm text-slate-300">
                  {ad.shopId?.name || ad.productId?.name || 'Not linked'}
                </td>
                <td className="px-4 py-3">
                  {ad.image ? (
                    ad.image.startsWith('/') ? (
                      <div className="relative h-16 w-24 overflow-hidden rounded-lg border border-slate-600">
                        <Image src={ad.image} alt="Ad preview" fill className="object-cover" sizes="96px" />
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ad.image} alt="Ad preview" className="h-16 w-24 rounded-lg border border-slate-600 object-cover" />
                    )
                  ) : (
                    'No image'
                  )}
                </td>
                <td className="px-4 py-3">{ad.priority}</td>
                <td className="px-4 py-3 text-sm text-slate-300">
                  <div>{new Date(ad.startDate).toLocaleDateString()}</div>
                  <div>{ad.endDate ? new Date(ad.endDate).toLocaleDateString() : 'Ongoing'}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    <button onClick={() => handleEdit(ad)} className="text-blue-400 hover:underline">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(ad._id)} className="text-red-400 hover:underline">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
