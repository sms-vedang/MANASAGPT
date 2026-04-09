'use client';

import { useState, useEffect } from 'react';
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

export default function Admin() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

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

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 p-4">
        <h1 className="text-xl font-bold mb-6 text-center">CityAI Admin</h1>
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