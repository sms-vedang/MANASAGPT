'use client';

import { useState, useEffect } from 'react';

interface Metrics {
  totalShops: number;
  totalProducts: number;
  totalPlaces: number;
  totalQueries: number;
}

interface TopKeyword {
  _id: string;
  count: number;
}

interface TopCategory {
  _id: string;
  count: number;
}

interface TopShop {
  _id: string;
  name: string;
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [topKeywords, setTopKeywords] = useState<TopKeyword[]>([]);
  const [topCategories, setTopCategories] = useState<TopCategory[]>([]);
  const [topShops, setTopShops] = useState<TopShop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/queries');
      const data = await response.json();
      setMetrics(data.metrics);
      setTopKeywords(data.topKeywords);
      setTopCategories(data.topCategories);
      setTopShops(data.topShops);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Dashboard</h2>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-100">Total Shops</h3>
              <p className="text-3xl font-bold text-white">{metrics?.totalShops || 0}</p>
            </div>
            <div className="text-4xl">🏪</div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-100">Total Products</h3>
              <p className="text-3xl font-bold text-white">{metrics?.totalProducts || 0}</p>
            </div>
            <div className="text-4xl">🛍️</div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-purple-100">Total Places</h3>
              <p className="text-3xl font-bold text-white">{metrics?.totalPlaces || 0}</p>
            </div>
            <div className="text-4xl">🏛️</div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-yellow-100">Daily AI Queries</h3>
              <p className="text-3xl font-bold text-white">{metrics?.totalQueries || 0}</p>
            </div>
            <div className="text-4xl">🤖</div>
          </div>
        </div>
      </div>

      {/* Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Keywords */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-2">🔍</span>
            Top Searched Keywords
          </h3>
          <div className="space-y-3">
            {topKeywords.slice(0, 5).map((keyword, index) => (
              <div key={index} className="flex justify-between items-center bg-gray-700 p-3 rounded-lg">
                <span className="font-medium">{keyword._id}</span>
                <span className="bg-blue-600 px-2 py-1 rounded text-sm">
                  {keyword.count} searches
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Categories */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <span className="mr-2">📊</span>
            Popular Categories
          </h3>
          <div className="space-y-3">
            {topCategories.map((category, index) => (
              <div key={index} className="flex justify-between items-center bg-gray-700 p-3 rounded-lg">
                <span className="font-medium capitalize">{category._id}</span>
                <span className="bg-green-600 px-2 py-1 rounded text-sm">
                  {category.count} shops
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performing Shops */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <span className="mr-2">⭐</span>
          Top Performing Shops
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topShops.map((shop) => (
            <div key={shop._id} className="bg-gradient-to-r from-gray-700 to-gray-600 p-4 rounded-lg">
              <h4 className="font-semibold text-lg">{shop.name}</h4>
              <p className="text-gray-300 text-sm">Sponsored Shop</p>
            </div>
          ))}
        </div>
      </div>

      {/* Placeholder for Graph */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Queries Over Time</h3>
        <div className="h-64 flex items-center justify-center text-gray-400">
          Graph visualization would go here
        </div>
      </div>
    </div>
  );
}