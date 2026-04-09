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
}

export default function Admin() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Admin Panel - Shops</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 shadow-md rounded">
          <thead>
            <tr className="bg-gray-200 dark:bg-gray-700">
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Address</th>
              <th className="px-4 py-2">Phone</th>
              <th className="px-4 py-2">Rating</th>
              <th className="px-4 py-2">Sponsored</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shops.map((shop) => (
              <tr key={shop._id} className="border-b">
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
                  <button className="text-blue-500 hover:underline mr-2">Edit</button>
                  <button className="text-red-500 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}