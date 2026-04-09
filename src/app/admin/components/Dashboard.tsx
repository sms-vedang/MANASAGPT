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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold">Total Shops</h3>
          <p className="text-2xl font-bold text-blue-400">{metrics?.totalShops || 0}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold">Total Products</h3>
          <p className="text-2xl font-bold text-green-400">{metrics?.totalProducts || 0}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold">Total Places</h3>
          <p className="text-2xl font-bold text-purple-400">{metrics?.totalPlaces || 0}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold">Daily AI Queries</h3>
          <p className="text-2xl font-bold text-yellow-400">{metrics?.totalQueries || 0}</p>
        </div>
      </div>

      {/* Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Top Keywords */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Top Searched Keywords</h3>
          <ul className="space-y-2">
            {topKeywords.slice(0, 5).map((keyword, index) => (
              <li key={index} className="flex justify-between">
                <span>{keyword._id}</span>
                <span className="text-gray-400">{keyword.count}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Top Categories */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Top Categories</h3>
          <ul className="space-y-2">
            {topCategories.map((category, index) => (
              <li key={index} className="flex justify-between">
                <span>{category._id}</span>
                <span className="text-gray-400">{category.count}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Top Performing Shops */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Top Performing Shops</h3>
          <ul className="space-y-2">
            {topShops.map((shop) => (
              <li key={shop._id}>{shop.name}</li>
            ))}
          </ul>
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