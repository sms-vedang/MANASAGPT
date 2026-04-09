'use client';

import { useState, useEffect } from 'react';

interface Query {
  _id: string;
  userQuery: string;
  timestamp: string;
  response?: string;
}

interface AnalyticsData {
  metrics: {
    totalShops: number;
    totalProducts: number;
    totalPlaces: number;
    totalQueries: number;
  };
  recentQueries: Query[];
  topKeywords: { _id: string; count: number }[];
  topCategories: { _id: string; count: number }[];
  topShops: { _id: string; name: string }[];
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/queries');
      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading analytics...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Analytics</h2>

      {data && (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold">Total Queries</h3>
              <p className="text-2xl font-bold text-blue-400">{data.metrics.totalQueries}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold">Active Shops</h3>
              <p className="text-2xl font-bold text-green-400">{data.metrics.totalShops}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold">Products Listed</h3>
              <p className="text-2xl font-bold text-purple-400">{data.metrics.totalProducts}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-lg font-semibold">Places Indexed</h3>
              <p className="text-2xl font-bold text-yellow-400">{data.metrics.totalPlaces}</p>
            </div>
          </div>

          {/* Top Keywords */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Top Searched Keywords</h3>
            <div className="space-y-2">
              {data.topKeywords.slice(0, 10).map((keyword, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-lg">{keyword._id}</span>
                  <span className="bg-blue-600 px-2 py-1 rounded text-sm">
                    {keyword.count} searches
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Categories */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Popular Categories</h3>
            <div className="space-y-2">
              {data.topCategories.map((category, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-lg capitalize">{category._id}</span>
                  <span className="bg-green-600 px-2 py-1 rounded text-sm">
                    {category.count} shops
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Queries */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Recent User Queries</h3>
            <div className="space-y-3">
              {data.recentQueries.map((query) => (
                <div key={query._id} className="border-b border-gray-700 pb-2">
                  <p className="text-gray-300">&quot;{query.userQuery}&quot;</p>
                  <p className="text-sm text-gray-500">
                    {new Date(query.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
