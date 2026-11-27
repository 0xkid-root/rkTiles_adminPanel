'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Globe2,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  Package,
  Search,
  Tag,
  UserRound,
  Users,
  Warehouse,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

export const ADMIN_MENU = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Categories', path: '/admin/categories', icon: Tag },
  { name: 'Products', path: '/admin/products', icon: Package },
  { name: 'Inventory / Stock', path: '/admin/inventory', icon: Warehouse },
  { name: 'Dealers', path: '/admin/dealers', icon: Users },
  { name: 'Dealer Cart Activity', path: '/admin/dealer-cart-activity', icon: Activity },
  { name: 'Website Content', path: '/admin/website-content', icon: Globe2 },
  { name: 'Admin Profile', path: '/admin/profile', icon: UserRound },
];

export const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  categories: 'Categories',
  products: 'Products',
  inventory: 'Inventory / Stock',
  dealers: 'Dealers',
  'dealer-cart-activity': 'Dealer Cart Activity',
  'website-content': 'Website Content',
  profile: 'Admin Profile',
};

interface AdminShellProps {
  children: React.ReactNode;
  onLogout: () => Promise<void>;
}

export function AdminShell({ children, onLogout }: AdminShellProps) {
  const path = usePathname();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [profile, setProfile] = useState(false);
  const [search, setSearch] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  const routeKey = path.split('/')[2];
  const title = PAGE_TITLES[routeKey] || 'Dealer Profile';
  const adminName = user?.name || 'Rohan Kapoor';
  const adminRole = user?.role === 'admin' ? 'Administrator' : 'Administrator';
  const initials =
    adminName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'RK';

  const handleLogoutClick = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setProfile(false);
    await onLogout();
  };

  return (
    <div className="admin-shell">
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobile ? 'mobile-open' : ''}`}>
        <Link href="/admin/dashboard" className="sidebar-brand">
          <span className="brand-mark">RK</span>
          <span className="brand-name">
            RK TILES<small>ADMIN STUDIO</small>
          </span>
          <button
            className="collapse-btn"
            aria-label="Toggle sidebar"
            onClick={(e) => {
              e.preventDefault();
              setCollapsed(!collapsed);
            }}
          >
            <ChevronLeft size={16} />
          </button>
        </Link>

        <div className="nav-label">WORKSPACE</div>
        <nav>
          {ADMIN_MENU.map((item) => {
            const Icon = item.icon;
            const active = path === item.path || path.startsWith(item.path + '/');
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setMobile(false)}
                className={`nav-link ${active ? 'active' : ''}`}
                title={collapsed ? item.name : undefined}
              >
                <Icon size={18} />
                <span>{item.name}</span>
                {active && <i />}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-icon">
              <CircleHelp size={17} />
            </span>
            <div>
              <strong>Need a hand?</strong>
              <small>Get help with your workspace</small>
            </div>
            <ChevronRight size={15} />
          </div>

          <div className="sidebar-user">
            <span className="avatar">{initials}</span>
            <span className="user-label">
              <strong>{adminName}</strong>
              <small>{adminRole}</small>
            </span>
            <button aria-label="Account menu" onClick={() => setProfile(!profile)}>
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>
      </aside>

      {mobile && (
        <button
          className="mobile-shade"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}

      <main className="main-panel">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu"
              onClick={() => setMobile(true)}
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>
            <div className="crumb">
              <span>RK Tiles</span>
              <ChevronRight size={13} />
              <strong>{title}</strong>
            </div>
          </div>

          <div className="topbar-actions">
            <label className="top-search">
              <Search size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search anything..."
                aria-label="Search this page"
              />
              <kbd>⌘ K</kbd>
            </label>
            <span className="top-separator" />

            <div className="profile-menu-wrap">
              <button className="profile-trigger" onClick={() => setProfile(!profile)}>
                <span className="avatar">{initials}</span>
                <span>
                  <strong>{adminName}</strong>
                  <small>{adminRole}</small>
                </span>
                <ChevronDown size={15} />
              </button>
              {profile && (
                <div className="profile-pop">
                  <Link href="/admin/profile" onClick={() => setProfile(false)}>
                    <UserRound size={16} /> Admin Profile
                  </Link>
                  <button onClick={handleLogoutClick} disabled={loggingOut}>
                    <LogOut size={16} /> {loggingOut ? 'Logging out...' : 'Log out'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="page-area">
          <div className="page-content">{children}</div>
        </div>
      </main>
    </div>
  );
}
