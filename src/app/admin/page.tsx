'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Dashboard from './components/Dashboard';
import ShopManagement from './components/ShopManagement';
import ProductManagement from './components/ProductManagement';
import PlaceManagement from './components/PlaceManagement';
import CityKnowledge from './components/CityKnowledge';
import AdManagement from './components/AdManagement';
import Analytics from './components/Analytics';
import AIControl from './components/AIControl';
import Settings from './components/Settings';

type Tab = 'dashboard' | 'shops' | 'products' | 'places' | 'city' | 'ads' | 'analytics' | 'ai' | 'settings';

interface User {
  id: string;
  username: string;
  role: string;
  shopId?: string;
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/check');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        router.push('/admin/login');
      }
    } catch (error) {
      router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const tabs = [
    { id: 'dashboard' as Tab, name: 'Dashboard', icon: '📊' },
    { id: 'shops' as Tab, name: 'Shop Management', icon: '🏪' },
    { id: 'products' as Tab, name: 'Product Management', icon: '🛍️' },
    { id: 'places' as Tab, name: 'Places', icon: '🏛️' },
    { id: 'city' as Tab, name: 'City Knowledge', icon: '🌆' },
    { id: 'ads' as Tab, name: 'Ads & Monetization', icon: '📢' },
    { id: 'analytics' as Tab, name: 'Analytics', icon: '📈' },
    { id: 'ai' as Tab, name: 'AI Control', icon: '🤖' },
    { id: 'settings' as Tab, name: 'Settings', icon: '⚙️' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'shops':
        return <ShopManagement />;
      case 'products':
        return <ProductManagement />;
      case 'places':
        return <PlaceManagement />;
      case 'city':
        return <CityKnowledge />;
      case 'ads':
        return <AdManagement />;
      case 'analytics':
        return <Analytics />;
      case 'ai':
        return <AIControl />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold">CityAI Admin</h1>
          <button
            onClick={handleLogout}
            className="text-red-400 hover:text-red-300 text-sm"
          >
            Logout
          </button>
        </div>
        <div className="mb-4 text-sm text-gray-400">
          Welcome, {user.username} ({user.role})
        </div>
        <nav className="space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-gray-700 text-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {renderContent()}
      </div>
    </div>
  );
}