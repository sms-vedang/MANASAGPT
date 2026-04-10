'use client';

import { useState, useEffect } from 'react';

interface Product {
  _id: string;
  name: string;
  price: number;
  shopId: { _id: string; name: string } | string | null;
  category: string;
  featured: boolean;
  stock?: number;
  image?: string;
}

interface Shop {
  _id: string;
  name: string;
}

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterShop, setFilterShop] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    shopId: '',
    category: '',
    featured: false,
    stock: 0,
    image: '',
  });

  useEffect(() => {
    fetchProducts();
    fetchShops();
  }, []);

  const getProductShopId = (product: Product) => {
    if (product.shopId && typeof product.shopId === 'object') {
      return product.shopId._id;
    }
    return typeof product.shopId === 'string' ? product.shopId : '';
  };

  const getProductShopName = (product: Product) => {
    if (product.shopId && typeof product.shopId === 'object') {
      return product.shopId.name;
    }
    return 'Unknown Shop';
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setMessage('❌ Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchShops = async () => {
    try {
      const response = await fetch('/api/shops');
      const data = await response.json();
      setShops(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch shops:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    try {
      const url = editingProduct ? `/api/products/${editingProduct._id}` : '/api/products';
      const method = editingProduct ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage(editingProduct ? '✅ Product updated successfully!' : '✅ Product created successfully!');
        fetchProducts();
        setShowForm(false);
        setEditingProduct(null);
        resetForm();
      } else {
        const errorData = await response.json();
        setMessage(`❌ ${errorData.error || 'Failed to save product'}`);
      }
    } catch (error) {
      console.error('Failed to save product:', error);
      setMessage('❌ Network error. Please try again.');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      shopId: getProductShopId(product),
      category: product.category,
      featured: product.featured,
      stock: product.stock || 0,
      image: product.image || '',
    });
    setShowForm(true);
    setMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setMessage('✅ Product deleted successfully');
        fetchProducts();
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
      setMessage('❌ Failed to delete product');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: 0,
      shopId: '',
      category: '',
      featured: false,
      stock: 0,
      image: '',
    });
    setEditingProduct(null);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesShop = !filterShop || getProductShopId(p) === filterShop;
    return matchesSearch && matchesShop;
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-400">Loading products catalog...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Product Management</h2>
          <p className="text-gray-400 mt-1">Manage inventory, pricing, and product visibility across all shops.</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); if(!showForm) resetForm(); }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition duration-200 transform hover:scale-105 flex items-center gap-2 shadow-lg shadow-blue-900/20"
        >
          {showForm ? '✕ Close Form' : '＋ Add New Product'}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border ${message.includes('✅') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'} animate-in slide-in-from-top duration-300`}>
          {message}
        </div>
      )}

      {/* Form Section */}
      {showForm && (
        <div className="bg-gray-900/50 border border-white/10 p-8 rounded-3xl backdrop-blur-sm animate-in slide-in-from-top duration-300">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            {editingProduct ? '✏️ Edit Product' : '📦 Create New Product'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Product Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Paracetamol 500mg"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-800 border border-white/10 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Price (₹) *</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  className="w-full bg-gray-800 border border-white/10 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Shop *</label>
                <select
                  value={formData.shopId}
                  onChange={(e) => setFormData({ ...formData, shopId: e.target.value })}
                  className="w-full bg-gray-800 border border-white/10 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white"
                  required
                >
                  <option value="">Select Shop</option>
                  {shops.map((shop) => (
                    <option key={shop._id} value={shop._id}>
                      {shop.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Category *</label>
                <input
                  type="text"
                  placeholder="e.g. Medicine, Electronics"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-gray-800 border border-white/10 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Stock Count</label>
                <input
                  type="number"
                  placeholder="Current inventory"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                  className="w-full bg-gray-800 border border-white/10 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Image URL (optional)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full bg-gray-800 border border-white/10 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-6 p-4 bg-white/5 rounded-2xl w-fit">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
                />
                <span className="text-gray-200 font-medium group-hover:text-white transition">🌟 Featured Product</span>
              </label>
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition shadow-lg shadow-blue-600/20"
              >
                {editingProduct ? '💾 Update Product' : '🚀 Create Product'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingProduct(null);
                  resetForm();
                  setMessage('');
                }}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3 px-8 rounded-xl transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-800/50 border border-white/10 p-3 pl-10 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-white"
          />
        </div>
        
        <select
          value={filterShop}
          onChange={(e) => setFilterShop(e.target.value)}
          className="w-full bg-gray-800/50 border border-white/10 p-3 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-white cursor-pointer"
        >
          <option value="">All Shops</option>
          {shops.map((shop) => (
            <option key={shop._id} value={shop._id}>
              🏪 {shop.name}
            </option>
          ))}
        </select>
        
        <div className="flex items-center justify-end text-sm text-gray-500">
          Showing {filteredProducts.length} entries
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-gray-900/30 border border-white/10 rounded-[28px] overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-widest">
                <th className="px-6 py-4 font-bold">Product</th>
                <th className="px-6 py-4 font-bold text-center">Category</th>
                <th className="px-6 py-4 font-bold text-center">Stock</th>
                <th className="px-6 py-4 font-bold text-center">Shop</th>
                <th className="px-6 py-4 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredProducts.map((product) => (
                <tr key={product._id} className="hover:bg-white/[0.02] transition group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gray-800 border border-white/5 flex items-center justify-center text-xl overflow-hidden shrink-0">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          '📦'
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-white text-base">{product.name}</p>
                          {product.featured && (
                            <span className="bg-amber-500/20 text-amber-400 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">Featured</span>
                          )}
                        </div>
                        <p className="text-blue-400 font-bold text-lg mt-0.5">₹{product.price.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-center">
                      <span className="px-3 py-1 bg-gray-800 text-gray-400 rounded-lg text-sm font-medium border border-white/5">
                        {product.category}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`text-sm font-bold ${(!product.stock || product.stock < 5) ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {product.stock ?? '0'} units
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="text-gray-300 text-sm">
                      {getProductShopName(product)}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex gap-2 opacity-60 group-hover:opacity-100 transition">
                      <button
                        onClick={() => handleEdit(product)}
                        className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-xs font-bold transition flex items-center gap-1"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs font-bold transition flex items-center gap-1"
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="text-4xl mb-4">📭</div>
                    <p className="text-gray-500">No products matching your filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
