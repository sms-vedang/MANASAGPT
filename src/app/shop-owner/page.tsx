'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  username: string;
  role: string;
  shopId?: string;
}

interface Shop {
  _id: string;
  name: string;
  category: string;
  address: string;
  phone: string;
  website?: string;
  rating: number;
  tags: string[];
  sponsored: boolean;
  priorityScore: number;
  verified: boolean;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  shopId: string | { _id: string; name: string };
  category: string;
  featured: boolean;
  stock?: number;
}

export default function ShopOwner() {
  const [user, setUser] = useState<User | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'shop' | 'products'>('shop');
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/check');
      if (response.ok) {
        const data = await response.json();
        if (data.user.role !== 'shop_owner') {
          router.push('/admin/login');
          return;
        }
        setUser(data.user);
        if (data.user.shopId) {
          fetchShop(data.user.shopId);
          fetchProducts(data.user.shopId);
        }
      } else {
        router.push('/admin/login');
      }
    } catch (error) {
      router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchShop = async (shopId: string) => {
    try {
      const response = await fetch(`/api/shops/${shopId}`);
      if (response.ok) {
        const shopData = await response.json();
        setShop(shopData);
      }
    } catch (error) {
      console.error('Failed to fetch shop:', error);
    }
  };

  const fetchProducts = async (shopId: string) => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const allProducts = await response.json();
        const shopProducts = allProducts.filter((p: Product) =>
          typeof p.shopId === 'string' ? p.shopId === shopId : p.shopId._id === shopId
        );
        setProducts(shopProducts);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user || !shop) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">No shop assigned to this account.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Shop Owner Dashboard - {shop.name}</h1>
        <button
          onClick={handleLogout}
          className="text-red-400 hover:text-red-300"
        >
          Logout
        </button>
      </div>

      {/* Navigation */}
      <div className="bg-gray-800 px-4 py-2">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('shop')}
            className={`px-4 py-2 rounded ${activeTab === 'shop' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
          >
            Shop Details
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded ${activeTab === 'products' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
          >
            My Products
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'shop' && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Shop Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><strong>Name:</strong> {shop.name}</div>
              <div><strong>Category:</strong> {shop.category}</div>
              <div><strong>Address:</strong> {shop.address}</div>
              <div><strong>Phone:</strong> {shop.phone}</div>
              <div><strong>Website:</strong> {shop.website ? <a href={shop.website} target="_blank" rel="noopener noreferrer" className="text-blue-400">Visit</a> : 'Not provided'}</div>
              <div><strong>Rating:</strong> {shop.rating}/5</div>
              <div><strong>Verified:</strong> {shop.verified ? '✅' : '❌'}</div>
              <div><strong>Sponsored:</strong> {shop.sponsored ? '✅' : '❌'}</div>
            </div>
            <div className="mt-4">
              <strong>Tags:</strong> {shop.tags.join(', ')}
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">My Products</h2>
              <button className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded">
                Add Product
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-gray-800 shadow-md rounded">
                <thead>
                  <tr className="bg-gray-700">
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Price</th>
                    <th className="px-4 py-2">Category</th>
                    <th className="px-4 py-2">Featured</th>
                    <th className="px-4 py-2">Stock</th>
                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product._id} className="border-b border-gray-700">
                      <td className="px-4 py-2">{product.name}</td>
                      <td className="px-4 py-2">₹{product.price}</td>
                      <td className="px-4 py-2">{product.category}</td>
                      <td className="px-4 py-2">{product.featured ? '⭐' : '❌'}</td>
                      <td className="px-4 py-2">{product.stock || 'N/A'}</td>
                      <td className="px-4 py-2 space-x-2">
                        <button className="text-blue-400 hover:underline">Edit</button>
                        <button className="text-red-400 hover:underline">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
