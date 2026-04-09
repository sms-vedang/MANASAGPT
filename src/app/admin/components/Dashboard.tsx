'use client';

import { useEffect, useMemo, useState } from 'react';

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

interface RecentQuery {
  _id: string;
  userQuery: string;
  timestamp: string;
}

interface AnalyticsPayload {
  metrics: Metrics;
  topKeywords: TopKeyword[];
  topCategories: TopCategory[];
  topShops: TopShop[];
  recentQueries: RecentQuery[];
}

const metricCards = [
  {
    key: 'totalShops',
    title: 'Listed Shops',
    accent: 'from-sky-500/20 to-blue-500/5 border-sky-400/20',
    icon: '🏪',
  },
  {
    key: 'totalProducts',
    title: 'Products',
    accent: 'from-emerald-500/20 to-green-500/5 border-emerald-400/20',
    icon: '🛍️',
  },
  {
    key: 'totalPlaces',
    title: 'Places',
    accent: 'from-amber-500/20 to-orange-500/5 border-amber-400/20',
    icon: '📍',
  },
  {
    key: 'totalQueries',
    title: 'User Queries',
    accent: 'from-fuchsia-500/20 to-violet-500/5 border-fuchsia-400/20',
    icon: '💬',
  },
] as const;

export default function Dashboard() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/queries');
      const analytics = await response.json();
      setData(analytics);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const healthSummary = useMemo(() => {
    if (!data) {
      return {
        completion: 0,
        message: 'Loading system status...',
      };
    }

    const activeSources = [
      data.metrics.totalShops > 0,
      data.metrics.totalProducts > 0,
      data.metrics.totalPlaces > 0,
      data.metrics.totalQueries > 0,
    ].filter(Boolean).length;

    const completion = Math.round((activeSources / 4) * 100);
    const message =
      completion === 100
        ? 'All core content pipelines are active.'
        : 'Some sections still need content or user activity.';

    return { completion, message };
  }, [data]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-14 w-14 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-400" />
          <p className="text-sm text-slate-400">Loading command center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.22),_transparent_35%),linear-gradient(135deg,_rgba(15,23,42,0.98),_rgba(30,41,59,0.94))] p-6 shadow-2xl shadow-black/20">
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div>
            <div className="mb-3 inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
              Admin Command Center
            </div>
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Keep ManasaGPT content, discovery, and operations in sync.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
              This dashboard gives you one place to watch local inventory growth, query demand, and
              which businesses or categories are getting the most attention.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Platform Health</p>
                <p className="mt-2 text-3xl font-semibold text-white">{healthSummary.completion}%</p>
                <p className="mt-1 text-sm text-slate-300">{healthSummary.message}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Top Search Theme</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {data?.topKeywords?.[0]?._id || 'No query data yet'}
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  {data?.topKeywords?.[0]?.count || 0} search hits
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Most Active Category</p>
                <p className="mt-2 text-xl font-semibold capitalize text-white">
                  {data?.topCategories?.[0]?._id || 'Not enough data'}
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  {data?.topCategories?.[0]?.count || 0} listings
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-slate-950/35 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Quick Snapshot</p>
            <div className="mt-4 space-y-3">
              {[
                { label: 'Verified local search base', value: `${data?.metrics.totalShops || 0} shops` },
                { label: 'Discovery-ready products', value: `${data?.metrics.totalProducts || 0} products` },
                { label: 'City landmarks indexed', value: `${data?.metrics.totalPlaces || 0} places` },
                { label: 'Total conversations tracked', value: `${data?.metrics.totalQueries || 0} queries` },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                  <span className="text-sm text-slate-300">{item.label}</span>
                  <span className="text-sm font-semibold text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => (
          <div
            key={card.key}
            className={`rounded-[24px] border bg-gradient-to-br p-5 shadow-lg shadow-black/10 ${card.accent}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-300">{card.title}</p>
                <p className="mt-3 text-4xl font-semibold text-white">
                  {data?.metrics?.[card.key] || 0}
                </p>
              </div>
              <div className="text-3xl">{card.icon}</div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-[24px] border border-white/10 bg-slate-900/70 p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">Top Search Keywords</h3>
                <p className="text-sm text-slate-400">What users are asking most often</p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                Last 10 tracked
              </span>
            </div>

            <div className="space-y-3">
              {(data?.topKeywords || []).slice(0, 6).map((keyword, index) => (
                <div
                  key={`${keyword._id}-${index}`}
                  className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 text-sm font-semibold text-blue-200">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-white">{keyword._id}</p>
                      <p className="text-xs text-slate-400">Trending search phrase</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-blue-500/15 px-3 py-1 text-sm text-blue-200">
                    {keyword.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-slate-900/70 p-6">
            <div className="mb-5">
              <h3 className="text-xl font-semibold text-white">Recent Query Feed</h3>
              <p className="text-sm text-slate-400">Latest user activity flowing into the assistant</p>
            </div>

            <div className="space-y-3">
              {(data?.recentQueries || []).slice(0, 6).map((query) => (
                <div key={query._id} className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                  <p className="font-medium text-white">{query.userQuery}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(query.timestamp).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[24px] border border-white/10 bg-slate-900/70 p-6">
            <div className="mb-5">
              <h3 className="text-xl font-semibold text-white">Category Mix</h3>
              <p className="text-sm text-slate-400">Which content clusters are strongest right now</p>
            </div>

            <div className="space-y-4">
              {(data?.topCategories || []).map((category) => {
                const total = data?.metrics.totalShops || 1;
                const width = Math.max(10, Math.round((category.count / total) * 100));
                return (
                  <div key={category._id}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="capitalize text-slate-200">{category._id}</span>
                      <span className="text-slate-400">{category.count} listings</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-slate-900/70 p-6">
            <div className="mb-5">
              <h3 className="text-xl font-semibold text-white">Featured Shops</h3>
              <p className="text-sm text-slate-400">Sponsored or priority businesses worth monitoring</p>
            </div>

            <div className="space-y-3">
              {(data?.topShops || []).map((shop, index) => (
                <div key={shop._id} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-200">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-white">{shop.name}</p>
                      <p className="text-xs text-slate-400">High-visibility placement</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-200">
                    Priority
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
