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
import UserManagement from './components/UserManagement';
import Settings from './components/Settings';

type Tab =
  | 'dashboard'
  | 'shops'
  | 'products'
  | 'places'
  | 'city'
  | 'ads'
  | 'analytics'
  | 'ai'
  | 'users'
  | 'settings';

interface User {
  id: string;
  username: string;
  role: string;
  shopId?: string;
}

const tabs = [
  { id: 'dashboard' as Tab, name: 'Dashboard', icon: '📊', section: 'Overview' },
  { id: 'analytics' as Tab, name: 'Analytics', icon: '📈', section: 'Overview' },
  { id: 'shops' as Tab, name: 'Shops', icon: '🏪', section: 'Content' },
  { id: 'products' as Tab, name: 'Products', icon: '🛍️', section: 'Content' },
  { id: 'places' as Tab, name: 'Places', icon: '🏛️', section: 'Content' },
  { id: 'city' as Tab, name: 'City Knowledge', icon: '🌆', section: 'Content' },
  { id: 'ads' as Tab, name: 'Ads & Monetization', icon: '📢', section: 'Revenue' },
  { id: 'users' as Tab, name: 'User Management', icon: '👥', section: 'Admin' },
  { id: 'ai' as Tab, name: 'AI Control', icon: '🤖', section: 'Admin' },
  { id: 'settings' as Tab, name: 'Settings', icon: '⚙️', section: 'Admin' },
];

const sections = ['Overview', 'Content', 'Revenue', 'Admin'];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
    } catch {
      router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'shops': return <ShopManagement />;
      case 'products': return <ProductManagement />;
      case 'places': return <PlaceManagement />;
      case 'city': return <CityKnowledge />;
      case 'ads': return <AdManagement />;
      case 'analytics': return <Analytics />;
      case 'ai': return <AIControl />;
      case 'users': return <UserManagement />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.loadingContent}>
          <div style={styles.spinner} />
          <p style={{ color: '#94a3b8', marginTop: 16, fontSize: 14 }}>Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const activeTabInfo = tabs.find(t => t.id === activeTab);

  return (
    <div style={styles.root}>
      {/* Animated background */}
      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />

      {/* Sidebar */}
      <aside style={{ ...styles.sidebar, width: sidebarOpen ? 260 : 72 }}>
        {/* Logo */}
        <div style={styles.logoArea}>
          <div style={styles.logoIcon}>🏙️</div>
          {sidebarOpen && (
            <div style={styles.logoText}>
              <span style={styles.logoTitle}>ManasaGPT</span>
              <span style={styles.logoSub}>Admin Console</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={styles.collapseBtn}
            title={sidebarOpen ? 'Collapse' : 'Expand'}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* User Info */}
        {sidebarOpen && (
          <div style={styles.userCard}>
            <div style={styles.userAvatar}>
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={styles.userName}>{user.username}</p>
              <p style={styles.userRole}>{user.role.replace('_', ' ')}</p>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={styles.nav}>
          {sections.map(section => {
            const sectionTabs = tabs.filter(t => t.section === section);
            return (
              <div key={section} style={styles.navSection}>
                {sidebarOpen && <div style={styles.sectionLabel}>{section}</div>}
                {sectionTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    title={!sidebarOpen ? tab.name : undefined}
                    style={{
                      ...styles.navBtn,
                      ...(activeTab === tab.id ? styles.navBtnActive : styles.navBtnInactive),
                      justifyContent: sidebarOpen ? 'flex-start' : 'center',
                    }}
                  >
                    <span style={styles.navIcon}>{tab.icon}</span>
                    {sidebarOpen && <span style={styles.navLabel}>{tab.name}</span>}
                    {sidebarOpen && activeTab === tab.id && <span style={styles.navActiveDot} />}
                  </button>
                ))}
              </div>
            );
          })}
        </nav>

        {/* Logout */}
        <button onClick={handleLogout} style={styles.logoutBtn} title="Logout">
          <span>🚪</span>
          {sidebarOpen && <span>Logout</span>}
        </button>
      </aside>

      {/* Main content */}
      <main style={styles.main}>
        {/* Top bar */}
        <header style={styles.topbar}>
          <div>
            <h1 style={styles.pageTitle}>
              <span style={{ marginRight: 8 }}>{activeTabInfo?.icon}</span>
              {activeTabInfo?.name}
            </h1>
            <p style={styles.pageCrumb}>
              ManasaGPT Admin › {activeTabInfo?.section} › {activeTabInfo?.name}
            </p>
          </div>
          <div style={styles.topbarRight}>
            <div style={styles.liveIndicator}>
              <span style={styles.liveDot} />
              Live
            </div>
            <div style={styles.topbarTime}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div style={styles.content}>
          {renderContent()}
        </div>
      </main>

      <style>{`
        * { box-sizing: border-box; }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        body { margin: 0; font-family: 'Inter', sans-serif; background: #0a0f1e; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes glow { 0%,100% { opacity: 0.3; } 50% { opacity: 0.6; } }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    minHeight: '100vh',
    background: '#080d1a',
    fontFamily: "'Inter', -apple-system, sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },
  bgGlow1: {
    position: 'fixed',
    top: -200,
    left: -200,
    width: 600,
    height: 600,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(109,40,217,0.15) 0%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: 0,
    animation: 'glow 6s ease-in-out infinite',
  },
  bgGlow2: {
    position: 'fixed',
    bottom: -200,
    right: -100,
    width: 500,
    height: 500,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: 0,
    animation: 'glow 8s ease-in-out infinite reverse',
  },
  sidebar: {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    background: 'rgba(15, 20, 40, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRight: '1px solid rgba(139,92,246,0.15)',
    transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
    overflow: 'hidden',
    flexShrink: 0,
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '20px 16px',
    borderBottom: '1px solid rgba(139,92,246,0.1)',
    minHeight: 72,
  },
  logoIcon: {
    fontSize: 28,
    flexShrink: 0,
    filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.6))',
  },
  logoText: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'hidden',
  },
  logoTitle: {
    color: '#e2e8f0',
    fontWeight: 700,
    fontSize: 15,
    letterSpacing: '-0.02em',
    whiteSpace: 'nowrap',
  },
  logoSub: {
    color: '#7c3aed',
    fontSize: 10,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    whiteSpace: 'nowrap',
  },
  collapseBtn: {
    background: 'rgba(139,92,246,0.1)',
    border: '1px solid rgba(139,92,246,0.2)',
    borderRadius: 8,
    color: '#7c3aed',
    cursor: 'pointer',
    fontSize: 10,
    padding: '4px 6px',
    flexShrink: 0,
    transition: 'all 0.2s',
  },
  userCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    margin: '12px 12px 4px',
    padding: '12px',
    background: 'rgba(139,92,246,0.08)',
    border: '1px solid rgba(139,92,246,0.15)',
    borderRadius: 12,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 700,
    fontSize: 14,
    flexShrink: 0,
  },
  userName: {
    color: '#e2e8f0',
    fontWeight: 600,
    fontSize: 13,
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  userRole: {
    color: '#7c3aed',
    fontSize: 11,
    margin: 0,
    fontWeight: 500,
    textTransform: 'capitalize',
  },
  nav: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  navSection: {
    marginBottom: 8,
  },
  sectionLabel: {
    color: '#475569',
    fontSize: 9,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    padding: '6px 8px 4px',
    whiteSpace: 'nowrap',
  },
  navBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 10px',
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    transition: 'all 0.2s',
    textAlign: 'left',
    position: 'relative',
    whiteSpace: 'nowrap',
  },
  navBtnActive: {
    background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(79,70,229,0.25))',
    color: '#c4b5fd',
    border: '1px solid rgba(139,92,246,0.3)',
    boxShadow: '0 0 12px rgba(139,92,246,0.1)',
  },
  navBtnInactive: {
    background: 'transparent',
    color: '#64748b',
    border: '1px solid transparent',
  },
  navIcon: {
    fontSize: 16,
    flexShrink: 0,
  },
  navLabel: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  navActiveDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#7c3aed',
    boxShadow: '0 0 6px #7c3aed',
    flexShrink: 0,
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    margin: '8px 12px 16px',
    padding: '10px',
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 10,
    color: '#f87171',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    transition: 'all 0.2s',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
    zIndex: 1,
  },
  topbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '18px 28px',
    background: 'rgba(15, 20, 40, 0.7)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(139,92,246,0.1)',
    flexShrink: 0,
  },
  pageTitle: {
    color: '#f1f5f9',
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
    marginBottom: 2,
    letterSpacing: '-0.02em',
    display: 'flex',
    alignItems: 'center',
  },
  pageCrumb: {
    color: '#475569',
    fontSize: 12,
    margin: 0,
    fontWeight: 400,
  },
  topbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  liveIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'rgba(16,185,129,0.1)',
    border: '1px solid rgba(16,185,129,0.2)',
    borderRadius: 20,
    padding: '4px 12px',
    color: '#34d399',
    fontSize: 12,
    fontWeight: 600,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#10b981',
    boxShadow: '0 0 6px #10b981',
    animation: 'pulse 2s infinite',
    display: 'inline-block',
  },
  topbarTime: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: 500,
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '28px',
    color: '#e2e8f0',
  },
  loadingScreen: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: '#080d1a',
  },
  loadingContent: {
    textAlign: 'center' as const,
  },
  spinner: {
    width: 44,
    height: 44,
    border: '3px solid rgba(139,92,246,0.2)',
    borderTop: '3px solid #7c3aed',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto',
  },
};