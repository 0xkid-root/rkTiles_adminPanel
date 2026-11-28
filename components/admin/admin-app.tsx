'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminStore, useAdminStore } from '@/lib/admin/store';
import { AuthProvider, useAuth } from '@/lib/auth';
import { ReactQueryProvider } from '@/lib/providers/query-provider';
import { AdminShell } from '@/components/admin/layout/admin-shell';
import { LoginForm } from '@/components/admin/auth/login-form';
import { DashboardView } from '@/components/admin/dashboard/dashboard-view';
import { CategoriesView } from '@/components/admin/categories/categories-view';
import { ProductsView } from '@/components/admin/products/products-view';
import { InventoryView } from '@/components/admin/inventory/inventory-view';
import {
  Dealers,
  DealerDetail,
  CartActivity,
  WebsiteContent,
  Profile,
} from '@/components/admin/admin-extras';

export default function AdminApp() {
  return (
    <ReactQueryProvider>
      <AuthProvider>
        <AdminStore>
          <AdminRouter />
        </AdminStore>
      </AuthProvider>
    </ReactQueryProvider>
  );
}

function AdminRouter() {
  const path = usePathname();
  const router = useRouter();
  const route = path.split('/').filter(Boolean).slice(1);
  const isLoginPage = route[0] === 'login';
  const { isAuthenticated, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isLoginPage && !isAuthenticated) {
        router.replace('/admin/login');
      } else if (isLoginPage && isAuthenticated) {
        router.replace('/admin/dashboard');
      }
    }
  }, [isLoading, isLoginPage, isAuthenticated, router]);

  if (isLoading || (!isLoginPage && !isAuthenticated)) {
    return (
      <div className="admin-loading">
        <span className="loading-mark">RK</span>
        <span>Preparing your workspace</span>
      </div>
    );
  }

  if (isLoginPage) {
    return <LoginForm onLoginSuccess={() => router.push('/admin/dashboard')} />;
  }

  return (
    <AdminShell
      onLogout={async () => {
        await logout();
        router.push('/admin/login');
      }}
    >
      <AdminPage route={route} />
    </AdminShell>
  );
}

function AdminPage({ route }: { route: string[] }) {
  const key = route[0] || 'dashboard';
  const { data, update } = useAdminStore();
  const id = route[1];

  switch (key) {
    case 'dashboard':
      return <DashboardView data={data} />;
    case 'categories':
      return <CategoriesView data={data} update={update} />;
    case 'products':
      return <ProductsView data={data} update={update} />;
    case 'inventory':
      return <InventoryView />;
    case 'dealers':
      return id ? (
        <DealerDetail data={data} update={update} id={id} />
      ) : (
        <Dealers data={data} update={update} />
      );
    case 'dealer-cart-activity':
      return <CartActivity data={data} />;
    case 'website-content':
      return <WebsiteContent data={data} update={update} />;
    case 'profile':
      return <Profile />;
    default:
      return <DashboardView data={data} />;
  }
}
