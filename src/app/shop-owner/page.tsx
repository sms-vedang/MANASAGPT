'use client';

import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  username: string;
  role: string;
  shopId?: string;
}

interface ShopOrder {
  _id: string;
  productName: string;
  productPrice: number;
  quantity: number;
  totalPrice: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  note?: string;
  createdAt: string;
}

const ORDER_STATUS_NEXT: Record<string, string> = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'delivered',
};

const ORDER_STATUS_COLOR: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  preparing: '#8b5cf6',
  ready: '#06b6d4',
  delivered: '#10b981',
  cancelled: '#ef4444',
};

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
  website?: string;
  rating: number;
  tags: string[];
  sponsored: boolean;
  priorityScore: number;
  verified: boolean;
  homeDelivery: HomeDelivery;
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

type ActivePanel = 'overview' | 'shop' | 'products' | 'orders';

const emptyProductForm = {
  name: '',
  price: '',
  category: '',
  stock: '',
  featured: false,
};

const emptyShopForm = {
  name: '',
  category: '',
  address: '',
  phone: '',
  website: '',
  tags: '',
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

export default function ShopOwnerPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [activePanel, setActivePanel] = useState<ActivePanel>('overview');
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [shopForm, setShopForm] = useState(emptyShopForm);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [savingShop, setSavingShop] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  // Orders
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const featuredCount = products.filter((product) => product.featured).length;
    const lowStockCount = products.filter((product) => {
      const stock = product.stock ?? 0;
      return stock > 0 && stock <= 5;
    }).length;
    const inventoryValue = products.reduce((sum, product) => {
      return sum + product.price * (product.stock ?? 0);
    }, 0);

    return {
      totalProducts,
      featuredCount,
      lowStockCount,
      inventoryValue,
    };
  }, [products]);

  const syncShopForm = (shopData: Shop) => {
    setShopForm({
      name: shopData.name,
      category: shopData.category,
      address: shopData.address,
      phone: shopData.phone,
      website: shopData.website || '',
      tags: shopData.tags.join(', '),
      homeDelivery: shopData.homeDelivery || emptyShopForm.homeDelivery,
    });
  };

  const refreshProducts = async (shopId: string) => {
    const response = await fetch(`/api/products?shopId=${shopId}`, { cache: 'no-store' });
    const data = await response.json().catch(() => []);

    if (!response.ok) {
      throw new Error(data?.error || 'Unable to refresh product list.');
    }

    setProducts(Array.isArray(data) ? data : []);
  };

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setPageError('');

      const authResponse = await fetch('/api/auth/check', { cache: 'no-store' });
      if (!authResponse.ok) {
        router.push('/admin/login');
        return;
      }

      const authData = await authResponse.json();
      if (authData.user.role !== 'shop_owner') {
        router.push('/admin/login');
        return;
      }

      if (!authData.user.shopId) {
        setUser(authData.user);
        setPageError('This account is not linked to a shop yet.');
        return;
      }

      setUser(authData.user);

      const [shopResponse, productsResponse] = await Promise.all([
        fetch(`/api/shops/${authData.user.shopId}`, { cache: 'no-store' }),
        fetch(`/api/products?shopId=${authData.user.shopId}`, { cache: 'no-store' }),
      ]);

      if (!shopResponse.ok) {
        const data = await shopResponse.json().catch(() => null);
        throw new Error(data?.error || 'Unable to load shop details.');
      }

      if (!productsResponse.ok) {
        const data = await productsResponse.json().catch(() => null);
        throw new Error(data?.error || 'Unable to load products.');
      }

      const [shopData, productData] = await Promise.all([
        shopResponse.json(),
        productsResponse.json(),
      ]);

      setShop(shopData);
      syncShopForm(shopData);
      setProducts(Array.isArray(productData) ? productData : []);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Something went wrong while loading the dashboard.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchOrders = async (shopId: string) => {
    setOrdersLoading(true);
    try {
      const res = await fetch(`/api/orders?shopId=${shopId}&limit=50`);
      const data = await res.json();
      // Filter only this shop's orders client-side as a fallback
      const all: ShopOrder[] = data.orders || [];
      setOrders(all);
    } catch {
      // silently fail
    } finally {
      setOrdersLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    setUpdatingOrder(orderId);
    try {
      await fetch(`/api/orders?id=${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (user?.shopId) await fetchOrders(user.shopId);
    } finally {
      setUpdatingOrder(null);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (user?.shopId && activePanel === 'orders') {
      void fetchOrders(user.shopId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePanel, user?.shopId]);

  const resetProductForm = () => {
    setProductForm(emptyProductForm);
    setEditingProductId(null);
    setShowProductForm(false);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const handleShopSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!shop) return;

    try {
      setSavingShop(true);
      setActionMessage('');

      const response = await fetch(`/api/shops/${shop._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...shopForm,
          tags: shopForm.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean),
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to update shop details.');
      }

      setShop(data);
      syncShopForm(data);
      setActionMessage('Shop details updated successfully.');
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'Unable to update shop details.');
    } finally {
      setSavingShop(false);
    }
  };

  const handleProductSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!shop) return;

    try {
      setSavingProduct(true);
      setActionMessage('');

      const response = await fetch(
        editingProductId ? `/api/products/${editingProductId}` : '/api/products',
        {
          method: editingProductId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: productForm.name.trim(),
            price: Number(productForm.price),
            category: productForm.category.trim(),
            stock: productForm.stock === '' ? 0 : Number(productForm.stock),
            featured: productForm.featured,
            shopId: shop._id,
          }),
        }
      );

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to save product.');
      }

      await refreshProducts(shop._id);
      setActionMessage(editingProductId ? 'Product updated successfully.' : 'Product added successfully.');
      resetProductForm();
      setActivePanel('products');
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'Unable to save product.');
    } finally {
      setSavingProduct(false);
    }
  };

  const startEditProduct = (product: Product) => {
    setEditingProductId(product._id);
    setProductForm({
      name: product.name,
      price: String(product.price),
      category: product.category,
      stock: String(product.stock ?? 0),
      featured: product.featured,
    });
    setShowProductForm(true);
    setActivePanel('products');
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!shop) return;
    if (!window.confirm('Delete this product from your catalog?')) return;

    try {
      setActionMessage('');

      const response = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to delete product.');
      }

      await refreshProducts(shop._id);
      setActionMessage('Product deleted successfully.');
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'Unable to delete product.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--shell)] text-white">
        <PageStyles />
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 px-8 py-10 text-center shadow-2xl shadow-black/30 backdrop-blur">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-[var(--accent)]" />
            <p className="mt-4 text-sm text-slate-300">Loading your shop workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  if (pageError && !shop) {
    return (
      <div className="min-h-screen bg-[var(--shell)] text-white">
        <PageStyles />
        <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6">
          <div className="w-full rounded-[32px] border border-rose-400/20 bg-slate-950/80 p-8 shadow-2xl shadow-black/40 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.3em] text-rose-300/80">Shop Owner Console</p>
            <h1 className="mt-4 text-3xl font-semibold text-white">We couldn&apos;t open your dashboard</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">{pageError}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => void loadDashboard()}
                className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[var(--accent-strong)]"
              >
                Try Again
              </button>
              <button
                onClick={handleLogout}
                className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/25 hover:bg-white/5"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !shop) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--shell)] text-white">
      <PageStyles />

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-10rem] top-[-6rem] h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(45,212,191,0.28),_transparent_68%)] blur-3xl" />
        <div className="absolute bottom-[-8rem] right-[-4rem] h-80 w-80 rounded-full bg-[radial-gradient(circle,_rgba(245,158,11,0.18),_transparent_70%)] blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 sm:px-6 lg:flex-row lg:gap-6 lg:px-8 lg:py-6">
        <aside className="glass-panel mb-4 w-full rounded-[28px] p-4 lg:sticky lg:top-6 lg:mb-0 lg:h-[calc(100vh-3rem)] lg:w-80 lg:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-[var(--accent)]">Shop Owner</p>
              <h1 className="mt-3 text-2xl font-semibold text-white">{shop.name}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Manage your storefront, keep inventory current, and keep your public listing polished.
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-rose-300/40 hover:bg-rose-400/10 hover:text-rose-100"
            >
              Logout
            </button>
          </div>

          <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Account</p>
                <p className="mt-2 text-lg font-semibold text-white">{user.username}</p>
              </div>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-emerald-200">
                {shop.verified ? 'Verified' : 'Review Pending'}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-300">
              <div className="rounded-2xl bg-slate-900/70 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Rating</p>
                <p className="mt-2 text-lg font-semibold text-white">{shop.rating.toFixed(1)}</p>
              </div>
              <div className="rounded-2xl bg-slate-900/70 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Priority</p>
                <p className="mt-2 text-lg font-semibold text-white">{shop.priorityScore}</p>
              </div>
            </div>
          </div>

          <nav className="mt-6 space-y-2">
            {[
              { id: 'overview' as ActivePanel, label: 'Overview', note: 'Snapshot and alerts' },
              { id: 'shop' as ActivePanel, label: 'Shop Profile', note: 'Business details and discoverability' },
              { id: 'products' as ActivePanel, label: 'Products', note: 'Catalog, pricing, and stock' },
              { id: 'orders' as ActivePanel, label: 'Orders', note: 'Customer orders from ManasaGPT' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActivePanel(item.id)}
                className={`w-full rounded-[22px] border px-4 py-4 text-left transition ${
                  activePanel === item.id
                    ? 'border-[var(--accent)]/30 bg-[var(--accent)]/12 shadow-lg shadow-teal-950/40'
                    : 'border-white/8 bg-white/3 hover:border-white/15 hover:bg-white/[0.06]'
                }`}
              >
                <p className="text-sm font-semibold text-white">{item.label}</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">{item.note}</p>
              </button>
            ))}
          </nav>

          <div className="mt-6 rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,rgba(45,212,191,0.12),rgba(15,23,42,0.5))] p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent)]">Public Listing</p>
            <p className="mt-3 text-sm leading-6 text-slate-200">
              {shop.tags.length > 0 ? shop.tags.join(' • ') : 'Add tags to help customers find you faster.'}
            </p>
            {shop.website ? (
              <a
                href={shop.website}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex text-sm font-medium text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
              >
                Visit website
              </a>
            ) : (
              <p className="mt-4 text-sm text-slate-400">No website added yet.</p>
            )}
          </div>
        </aside>

        <main className="flex-1 space-y-6">
          <section className="glass-panel overflow-hidden rounded-[30px] p-6 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs uppercase tracking-[0.32em] text-[var(--accent)]">Operations Snapshot</p>
                <h2 className="mt-3 text-3xl font-semibold leading-tight text-white sm:text-4xl">
                  A cleaner, more reliable workspace for running {shop.name}.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                  Review inventory health, update your shop profile, and keep your public catalog current from one place.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    setShowProductForm(true);
                    setEditingProductId(null);
                    setProductForm(emptyProductForm);
                    setActivePanel('products');
                  }}
                  className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[var(--accent-strong)]"
                >
                  Add Product
                </button>
                <button
                  onClick={() => setActivePanel('shop')}
                  className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/25 hover:bg-white/5"
                >
                  Edit Shop Profile
                </button>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Catalog Items" value={String(stats.totalProducts)} hint="Products listed in your shop" />
              <MetricCard label="Featured Items" value={String(stats.featuredCount)} hint="Highlighted in discovery" />
              <MetricCard label="Low Stock" value={String(stats.lowStockCount)} hint="Items at 5 units or below" tone="warn" />
              <MetricCard
                label="Inventory Value"
                value={`₹${stats.inventoryValue.toLocaleString('en-IN')}`}
                hint="Based on current stock and price"
              />
            </div>

            {actionMessage ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                {actionMessage}
              </div>
            ) : null}

            {pageError ? (
              <div className="mt-4 rounded-2xl border border-rose-300/15 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                {pageError}
              </div>
            ) : null}
          </section>

          {activePanel === 'overview' ? (
            <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
              <div className="glass-panel rounded-[30px] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Inventory Focus</p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">Products needing attention</h3>
                  </div>
                  <button
                    onClick={() => setActivePanel('products')}
                    className="text-sm font-medium text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
                  >
                    Open products
                  </button>
                </div>

                <div className="mt-6 space-y-3">
                  {products.slice(0, 5).map((product) => (
                    <div
                      key={product._id}
                      className="flex flex-col gap-3 rounded-[24px] border border-white/8 bg-white/3 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-base font-semibold text-white">{product.name}</p>
                        <p className="mt-1 text-sm text-slate-400">
                          {product.category} · ₹{product.price.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                            (product.stock ?? 0) <= 5
                              ? 'bg-amber-400/15 text-amber-100'
                              : 'bg-emerald-400/15 text-emerald-100'
                          }`}
                        >
                          Stock {product.stock ?? 0}
                        </span>
                        {product.featured ? (
                          <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.16em] text-white">
                            Featured
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))}

                  {products.length === 0 ? (
                    <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-slate-400">
                      No products yet. Add your first product to start showing up in search.
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="glass-panel rounded-[30px] p-6">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Business Details</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Customer-facing essentials</h3>

                <dl className="mt-6 space-y-4 text-sm">
                  <InfoRow label="Category" value={shop.category} />
                  <InfoRow label="Phone" value={shop.phone} />
                  <InfoRow label="Address" value={shop.address} />
                  <InfoRow label="Website" value={shop.website || 'Not added'} />
                  <InfoRow label="Sponsored" value={shop.sponsored ? 'Enabled' : 'Disabled'} />
                </dl>

                <div className="mt-6 rounded-[24px] border border-white/8 bg-white/3 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Search Tags</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {shop.tags.length > 0 ? (
                      shop.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-medium text-slate-200"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-400">No tags added yet.</span>
                    )}
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {activePanel === 'shop' ? (
            <section className="glass-panel rounded-[30px] p-6 sm:p-8">
              <div className="max-w-2xl">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Shop Profile</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Keep your listing professional and up to date</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  These details are what customers will rely on to discover and trust your shop.
                </p>
              </div>

              <form onSubmit={handleShopSubmit} className="mt-8 grid gap-5 lg:grid-cols-2">
                <Field label="Shop Name">
                  <input
                    value={shopForm.name}
                    onChange={(event) => setShopForm((current) => ({ ...current, name: event.target.value }))}
                    className="field-input"
                    required
                  />
                </Field>
                <Field label="Category">
                  <input
                    value={shopForm.category}
                    onChange={(event) => setShopForm((current) => ({ ...current, category: event.target.value }))}
                    className="field-input"
                    required
                  />
                </Field>
                <Field label="Phone">
                  <input
                    value={shopForm.phone}
                    onChange={(event) => setShopForm((current) => ({ ...current, phone: event.target.value }))}
                    className="field-input"
                    required
                  />
                </Field>
                <Field label="Website">
                  <input
                    value={shopForm.website}
                    onChange={(event) => setShopForm((current) => ({ ...current, website: event.target.value }))}
                    className="field-input"
                    placeholder="https://"
                  />
                </Field>
                <Field label="Address" className="lg:col-span-2">
                  <textarea
                    value={shopForm.address}
                    onChange={(event) => setShopForm((current) => ({ ...current, address: event.target.value }))}
                    className="field-input min-h-28 resize-y"
                    required
                  />
                </Field>
                <Field label="Tags" helper="Separate keywords with commas">
                  <input
                    value={shopForm.tags}
                    onChange={(event) => setShopForm((current) => ({ ...current, tags: event.target.value }))}
                    className="field-input"
                    placeholder="grocery, fresh fruits, quick delivery"
                  />
                </Field>

                <div className="lg:col-span-2 mt-6">
                  <div className="flex items-center justify-between rounded-[24px] border border-white/8 bg-white/3 p-5">
                    <div>
                      <p className="text-base font-semibold text-white">🛵 Home Delivery</p>
                      <p className="text-sm text-slate-400 mt-1">Allow customers to order for delivery</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={shopForm.homeDelivery.enabled}
                        onChange={(e) =>
                          setShopForm((current) => ({
                            ...current,
                            homeDelivery: { ...current.homeDelivery, enabled: e.target.checked },
                          }))
                        }
                        className="peer sr-only"
                      />
                      <div className="peer h-7 w-14 rounded-full bg-slate-800 after:absolute after:left-[4px] after:top-[4px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[var(--accent)] peer-checked:after:translate-x-full peer-focus:outline-none"></div>
                    </label>
                  </div>

                  {shopForm.homeDelivery.enabled && (
                    <div className="mt-4 grid gap-5 lg:grid-cols-2 rounded-[24px] border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-6">
                      <Field label="Min. Order Amount (₹)" helper="Orders below this amount won't be delivered">
                        <input
                          type="number"
                          value={shopForm.homeDelivery.minOrderAmount || ''}
                          className="field-input"
                          onChange={(e) =>
                            setShopForm((current) => ({
                              ...current,
                              homeDelivery: { ...current.homeDelivery, minOrderAmount: Number(e.target.value) },
                            }))
                          }
                          required
                        />
                      </Field>
                      <Field label="Delivery Charge (₹)" helper="Set 0 for free delivery">
                        <input
                          type="number"
                          value={shopForm.homeDelivery.deliveryCharge || ''}
                          className="field-input"
                          onChange={(e) =>
                            setShopForm((current) => ({
                              ...current,
                              homeDelivery: { ...current.homeDelivery, deliveryCharge: Number(e.target.value) },
                            }))
                          }
                          required
                        />
                      </Field>
                      <Field label="Free Delivery Above (₹)" helper="Set 0 to disable">
                        <input
                          type="number"
                          value={shopForm.homeDelivery.freeDeliveryAbove || ''}
                          className="field-input"
                          onChange={(e) =>
                            setShopForm((current) => ({
                              ...current,
                              homeDelivery: { ...current.homeDelivery, freeDeliveryAbove: Number(e.target.value) },
                            }))
                          }
                        />
                      </Field>
                      <Field label="Delivery Radius (km)" helper="Maximum distance for delivery">
                        <input
                          type="number"
                          value={shopForm.homeDelivery.deliveryRadiusKm || ''}
                          className="field-input"
                          onChange={(e) =>
                            setShopForm((current) => ({
                              ...current,
                              homeDelivery: { ...current.homeDelivery, deliveryRadiusKm: Number(e.target.value) },
                            }))
                          }
                        />
                      </Field>
                      <Field label="Estimated Time (mins)">
                        <input
                          type="number"
                          value={shopForm.homeDelivery.estimatedTimeMinutes || ''}
                          className="field-input"
                          onChange={(e) =>
                            setShopForm((current) => ({
                              ...current,
                              homeDelivery: { ...current.homeDelivery, estimatedTimeMinutes: Number(e.target.value) },
                            }))
                          }
                        />
                      </Field>
                      <Field label="Delivery Note" className="lg:col-span-2" helper="E.g. Delivery available in Manasa only">
                        <textarea
                          value={shopForm.homeDelivery.deliveryNote}
                          className="field-input min-h-20 resize-y"
                          onChange={(e) =>
                            setShopForm((current) => ({
                              ...current,
                              homeDelivery: { ...current.homeDelivery, deliveryNote: e.target.value },
                            }))
                          }
                        />
                      </Field>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-2 flex flex-wrap gap-3 pt-4 border-t border-white/10 mt-2">
                  <button
                    type="submit"
                    disabled={savingShop}
                    className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingShop ? 'Saving...' : 'Save Shop Details'}
                  </button>
                  <button
                    type="button"
                    onClick={() => syncShopForm(shop)}
                    className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/5"
                  >
                    Reset
                  </button>
                </div>
              </form>
            </section>
          ) : null}

          {activePanel === 'products' ? (
            <section className="space-y-6">
              {showProductForm ? (
                <div className="glass-panel rounded-[30px] p-6 sm:p-8">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Catalog Editor</p>
                      <h3 className="mt-2 text-2xl font-semibold text-white">
                        {editingProductId ? 'Update product' : 'Add a new product'}
                      </h3>
                    </div>
                    <button
                      onClick={resetProductForm}
                      className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/5"
                    >
                      Close
                    </button>
                  </div>

                  <form onSubmit={handleProductSubmit} className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                    <Field label="Product Name">
                      <input
                        value={productForm.name}
                        onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))}
                        className="field-input"
                        required
                      />
                    </Field>
                    <Field label="Price">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={productForm.price}
                        onChange={(event) => setProductForm((current) => ({ ...current, price: event.target.value }))}
                        className="field-input"
                        required
                      />
                    </Field>
                    <Field label="Category">
                      <input
                        value={productForm.category}
                        onChange={(event) => setProductForm((current) => ({ ...current, category: event.target.value }))}
                        className="field-input"
                        required
                      />
                    </Field>
                    <Field label="Stock">
                      <input
                        type="number"
                        min="0"
                        value={productForm.stock}
                        onChange={(event) => setProductForm((current) => ({ ...current, stock: event.target.value }))}
                        className="field-input"
                      />
                    </Field>

                    <label className="flex items-center gap-3 rounded-[22px] border border-white/8 bg-white/3 px-4 py-4 text-sm text-slate-200 md:col-span-2">
                      <input
                        type="checkbox"
                        checked={productForm.featured}
                        onChange={(event) => setProductForm((current) => ({ ...current, featured: event.target.checked }))}
                        className="h-4 w-4 rounded border-white/20 bg-slate-900 text-[var(--accent)] focus:ring-[var(--accent)]"
                      />
                      Mark as featured product
                    </label>

                    <div className="md:col-span-2 xl:col-span-4 flex flex-wrap gap-3">
                      <button
                        type="submit"
                        disabled={savingProduct}
                        className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingProduct ? 'Saving...' : editingProductId ? 'Update Product' : 'Create Product'}
                      </button>
                      <button
                        type="button"
                        onClick={resetProductForm}
                        className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/5"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              ) : null}

              <div className="glass-panel rounded-[30px] p-6 sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Product Catalog</p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">Inventory, pricing, and visibility</h3>
                  </div>
                  <button
                    onClick={() => {
                      setShowProductForm(true);
                      setEditingProductId(null);
                      setProductForm(emptyProductForm);
                    }}
                    className="rounded-full bg-white/8 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/12"
                  >
                    New Product
                  </button>
                </div>

                <div className="mt-6 overflow-hidden rounded-[26px] border border-white/8">
                  <div className="hidden grid-cols-[1.8fr,1fr,1fr,0.9fr,1.1fr] gap-4 bg-white/[0.04] px-5 py-4 text-xs uppercase tracking-[0.2em] text-slate-400 md:grid">
                    <span>Product</span>
                    <span>Category</span>
                    <span>Price</span>
                    <span>Stock</span>
                    <span>Actions</span>
                  </div>

                  <div className="divide-y divide-white/8">
                    {products.length > 0 ? (
                      products.map((product) => (
                        <div
                          key={product._id}
                          className="grid gap-4 px-5 py-5 md:grid-cols-[1.8fr,1fr,1fr,0.9fr,1.1fr] md:items-center"
                        >
                          <div>
                            <p className="text-base font-semibold text-white">{product.name}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {product.featured ? (
                                <span className="rounded-full bg-[var(--accent)]/15 px-3 py-1 text-xs font-medium text-[var(--accent)]">
                                  Featured
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <p className="text-sm text-slate-300">{product.category}</p>
                          <p className="text-sm font-medium text-slate-100">₹{product.price.toLocaleString('en-IN')}</p>
                          <p className="text-sm text-slate-300">{product.stock ?? 0}</p>
                          <div className="flex gap-3">
                            <button
                              onClick={() => startEditProduct(product)}
                              className="text-sm font-medium text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => void handleDeleteProduct(product._id)}
                              className="text-sm font-medium text-rose-200 transition hover:text-rose-100"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-5 py-10 text-center text-sm text-slate-400">
                        Your catalog is empty. Add products to make the shop page feel complete and professional.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {activePanel === 'orders' ? (
            <section className="glass-panel rounded-[30px] p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Incoming Orders</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">Customer Orders</h3>
                </div>
                <button
                  onClick={() => user?.shopId && void fetchOrders(user.shopId)}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/5"
                >
                  🔄 Refresh
                </button>
              </div>

              {ordersLoading ? (
                <div className="py-12 text-center text-sm text-slate-400">Loading orders...</div>
              ) : orders.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] p-10 text-center">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="text-sm text-slate-400">No orders yet. When customers order via ManasaGPT chat, they will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const color = ORDER_STATUS_COLOR[order.status] || '#64748b';
                    const nextStatus = ORDER_STATUS_NEXT[order.status];
                    return (
                      <div key={order._id} className="rounded-[24px] border border-white/8 bg-white/3 p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            {/* Status + time */}
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <span style={{
                                background: `${color}20`,
                                color,
                                border: `1px solid ${color}40`,
                                padding: '2px 10px',
                                borderRadius: 20,
                                fontSize: 11,
                                fontWeight: 700,
                                textTransform: 'capitalize' as const,
                              }}>
                                {order.status}
                              </span>
                              <span className="text-xs text-slate-500">
                                {new Date(order.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="text-xs text-slate-600 font-mono">
                                #{order._id.slice(-6).toUpperCase()}
                              </span>
                            </div>

                            {/* Product */}
                            <p className="text-base font-bold text-white">
                              {order.productName} <span className="font-normal text-slate-400">×{order.quantity}</span>
                            </p>
                            <p className="text-sm font-semibold text-[var(--accent)] mt-1">₹{order.totalPrice}</p>

                            {/* Customer */}
                            <div className="mt-3 grid sm:grid-cols-2 gap-1 text-sm text-slate-300">
                              <span>👤 {order.customerName}</span>
                              <span>📞 {order.customerPhone}</span>
                              <span className="sm:col-span-2">📍 {order.customerAddress}</span>
                              {order.note && <span className="sm:col-span-2 text-[var(--accent)]">💬 {order.note}</span>}
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex flex-col gap-2 shrink-0">
                            {nextStatus && (
                              <button
                                onClick={() => void updateOrderStatus(order._id, nextStatus)}
                                disabled={updatingOrder === order._id}
                                className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-bold text-slate-950 capitalize transition hover:bg-[var(--accent-strong)] disabled:opacity-50"
                              >
                                {updatingOrder === order._id ? '...' : `→ ${nextStatus}`}
                              </button>
                            )}
                            {order.status !== 'cancelled' && order.status !== 'delivered' && (
                              <button
                                onClick={() => void updateOrderStatus(order._id, 'cancelled')}
                                disabled={updatingOrder === order._id}
                                className="rounded-full border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-400/20 disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string;
  value: string;
  hint: string;
  tone?: 'default' | 'warn';
}) {
  return (
    <div
      className={`rounded-[26px] border p-5 ${
        tone === 'warn'
          ? 'border-amber-300/15 bg-amber-400/10'
          : 'border-white/8 bg-white/3'
      }`}
    >
      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <p className="mt-4 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{hint}</p>
    </div>
  );
}

function Field({
  label,
  children,
  className = '',
  helper,
}: {
  label: string;
  children: ReactNode;
  className?: string;
  helper?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-3 block text-sm font-medium text-slate-200">{label}</span>
      {children}
      {helper ? <span className="mt-2 block text-xs text-slate-500">{helper}</span> : null}
    </label>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/8 bg-white/3 p-4">
      <dt className="text-xs uppercase tracking-[0.22em] text-slate-500">{label}</dt>
      <dd className="mt-2 text-sm leading-6 text-slate-200">{value}</dd>
    </div>
  );
}

function PageStyles() {
  return (
    <style>{`
      :root {
        --shell: #07111f;
        --accent: #49d6c5;
        --accent-strong: #79f2e3;
      }

      body {
        background:
          radial-gradient(circle at top, rgba(73, 214, 197, 0.08), transparent 38%),
          linear-gradient(180deg, #08101d 0%, #050b15 100%);
      }

      .glass-panel {
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: linear-gradient(180deg, rgba(12, 21, 37, 0.94), rgba(8, 14, 26, 0.92));
        box-shadow: 0 30px 80px rgba(0, 0, 0, 0.38);
        backdrop-filter: blur(18px);
      }

      .field-input {
        width: 100%;
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.04);
        color: white;
        padding: 0.95rem 1rem;
        outline: none;
        transition: border-color 160ms ease, background-color 160ms ease, box-shadow 160ms ease;
      }

      .field-input:focus {
        border-color: rgba(73, 214, 197, 0.45);
        background: rgba(255, 255, 255, 0.07);
        box-shadow: 0 0 0 4px rgba(73, 214, 197, 0.12);
      }

      .field-input::placeholder {
        color: #64748b;
      }
    `}</style>
  );
}
