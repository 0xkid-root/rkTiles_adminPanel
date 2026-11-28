'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Package,
  Plus,
  RefreshCw,
  Tag,
  Users,
  Warehouse,
} from 'lucide-react';
import { PageHeading } from '@/components/admin/layout/page-heading';
import { StatCard } from '@/components/admin/shared/stat-card';
import { StatusBadge } from '@/components/admin/shared/status-badge';
import { ProductPhoto } from '@/components/admin/shared/product-photo';
import { DealerStatusBadge } from '@/components/admin/dealers/dealer-shared';
import { useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/http';
import { dashboardService, type DashboardProduct } from '@/services/dashboard';

const DASHBOARD_QUERY_KEY = ['dashboard'] as const;
const LOW_STOCK_LIMIT = 5;
const RECENT_PRODUCTS_LIMIT = 4;
const RECENT_DEALERS_LIMIT = 4;

const FALLBACK_IMAGE = '/placeholder.svg';

function formatCount(value: number | null | undefined): string | number {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return value.toLocaleString('en-IN');
}

function formatDate(value: string | null | undefined, fallback = '—'): string {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function stockStatus(p: DashboardProduct): string {
  const stock = p.stockQuantity ?? 0;
  const threshold = p.lowStockThreshold ?? 0;
  if (stock <= 0) return 'Out of stock';
  if (stock <= threshold) return 'Low stock';
  return 'In stock';
}

function productImage(p: DashboardProduct): string {
  return (Array.isArray(p.images) && p.images.find((src) => typeof src === 'string' && src)) || FALLBACK_IMAGE;
}

function productCategory(p: DashboardProduct): string {
  if (p.category && typeof p.category === 'object') return p.category.name || 'Uncategorized';
  return 'Uncategorized';
}

function errorText(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message || fallback;
  if (err instanceof Error) return err.message || fallback;
  return fallback;
}

export function DashboardView() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const overviewQuery = useQuery({
    queryKey: [...DASHBOARD_QUERY_KEY, 'overview'],
    queryFn: dashboardService.getDashboardOverview,
  });
  const inventoryQuery = useQuery({
    queryKey: [...DASHBOARD_QUERY_KEY, 'inventory-summary'],
    queryFn: dashboardService.getDashboardInventorySummary,
  });
  const lowStockQuery = useQuery({
    queryKey: [...DASHBOARD_QUERY_KEY, 'low-stock', LOW_STOCK_LIMIT],
    queryFn: () => dashboardService.getDashboardLowStock(LOW_STOCK_LIMIT),
  });
  const recentProductsQuery = useQuery({
    queryKey: [...DASHBOARD_QUERY_KEY, 'recent-products', RECENT_PRODUCTS_LIMIT],
    queryFn: () => dashboardService.getDashboardRecentProducts(RECENT_PRODUCTS_LIMIT),
  });
  const recentDealersQuery = useQuery({
    queryKey: [...DASHBOARD_QUERY_KEY, 'recent-dealers', RECENT_DEALERS_LIMIT],
    queryFn: () => dashboardService.getDashboardRecentDealers(RECENT_DEALERS_LIMIT),
  });
  const cartQuery = useQuery({
    queryKey: [...DASHBOARD_QUERY_KEY, 'cart-summary'],
    queryFn: dashboardService.getDashboardCartSummary,
  });

  const overview = overviewQuery.data?.data;
  const inventory = inventoryQuery.data?.data;
  const lowItems = lowStockQuery.data?.data ?? [];
  const recentProducts = recentProductsQuery.data?.data ?? [];
  const recentDealers = recentDealersQuery.data?.data ?? [];
  const cart = cartQuery.data?.data;

  const products = overview?.products;
  const dealers = overview?.dealers;
  const categoriesTotal = overview?.categories?.total ?? 0;
  const totalUnits = inventory?.totalStockQuantity ?? products?.totalStockQuantity ?? 0;
  const lowStockCount = inventory?.lowStockProducts ?? products?.lowStock ?? 0;
  const outOfStockCount = inventory?.outOfStockProducts ?? products?.outOfStock ?? 0;

  const anyError =
    overviewQuery.error || inventoryQuery.error || lowStockQuery.error || recentProductsQuery.error ||
    recentDealersQuery.error || cartQuery.error;

  const refreshing =
    overviewQuery.isFetching || inventoryQuery.isFetching || lowStockQuery.isFetching ||
    recentProductsQuery.isFetching || recentDealersQuery.isFetching || cartQuery.isFetching;

  const overviewLoading = overviewQuery.isLoading;
  const inventoryLoading = inventoryQuery.isLoading;
  const firstName = (user?.name || '').split(' ').filter(Boolean)[0] || 'there';

  const eyebrow = useMemo(
    () =>
      new Date()
        .toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
        .toUpperCase(),
    []
  );

  const refresh = () => queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });

  return (
    <>
      <PageHeading
        eyebrow={eyebrow}
        title={`Good morning, ${firstName}`}
        description="Here's what's happening across your tile business today."
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="secondary-button" onClick={refresh} disabled={refreshing}>
              <RefreshCw size={16} /> {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
            <button className="secondary-button" onClick={() => window.print()}>
              <ArrowDownRight size={16} /> Export overview
            </button>
          </div>
        }
      />

      {anyError && (
        <div className="form-error" role="alert" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ flex: 1 }}>
            {errorText(
              overviewQuery.error || inventoryQuery.error || lowStockQuery.error ||
                recentProductsQuery.error || recentDealersQuery.error || cartQuery.error,
              'Could not load dashboard data.'
            )}
          </span>
          <button type="button" className="secondary-button compact" onClick={refresh}>
            Retry
          </button>
        </div>
      )}

      <div className="stats-grid">
        <StatCard
          label="Total products"
          value={overviewLoading ? '—' : formatCount(products?.total ?? 0)}
          detail={products ? `${formatCount(products.active)} active` : 'Across your catalogue'}
          icon={Package}
        />
        <StatCard
          label="Categories"
          value={overviewLoading ? '—' : formatCount(categoriesTotal)}
          detail="Active categories"
          icon={Tag}
          tone="blue"
        />
        <StatCard
          label="Total stock quantity"
          value={inventoryLoading ? '—' : totalUnits.toLocaleString('en-IN')}
          detail="Central inventory units"
          icon={Warehouse}
          tone="green"
        />
        <StatCard
          label="Total dealers"
          value={overviewLoading ? '—' : formatCount(dealers?.total ?? 0)}
          detail={dealers ? `${formatCount(dealers.approved)} approved partners` : 'Registered dealers'}
          icon={Users}
          tone="blue"
        />
        <StatCard
          label="Approved dealers"
          value={overviewLoading ? '—' : formatCount(dealers?.approved ?? 0)}
          detail="Ready to browse catalogue"
          icon={Check}
          tone="green"
        />
        <StatCard
          label="Pending approvals"
          value={overviewLoading ? '—' : formatCount(dealers?.pending ?? 0)}
          detail="Awaiting your review"
          icon={Activity}
          tone="amber"
        />
      </div>

      <div className="dashboard-grid">
        <section className="panel inventory-panel">
          <div className="panel-heading">
            <div>
              <h2>Inventory overview</h2>
              <p>A snapshot of central stock availability</p>
            </div>
            <Link href="/admin/inventory" className="text-link">
              View inventory <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="inventory-summary">
            <div>
              <span className="summary-number">{overviewLoading ? '—' : formatCount(products?.total ?? 0)}</span>
              <span className="summary-label">Products tracked</span>
            </div>
            <div>
              <span className="summary-number warning-text">{inventoryLoading ? '—' : formatCount(lowStockCount)}</span>
              <span className="summary-label">Low stock</span>
            </div>
            <div>
              <span className="summary-number danger-text">{inventoryLoading ? '—' : formatCount(outOfStockCount)}</span>
              <span className="summary-label">Out of stock</span>
            </div>
          </div>
          <div className="stock-bar-label">
            <span>Available stock</span>
            <strong>{inventoryLoading ? '—' : `${totalUnits.toLocaleString('en-IN')} units`}</strong>
          </div>
          <div className="stock-bar">
            <i style={{ width: `${inventoryLoading ? 0 : Math.max(5, Math.min(100, totalUnits / 8))}%` }} />
          </div>
          <div className="stock-foot">
            <span>
              <i className="dot green-dot" /> Healthy stock
            </span>
            <span>Across {formatCount(categoriesTotal)} collections</span>
          </div>
        </section>

        <section className="panel alert-panel">
          <div className="panel-heading">
            <div>
              <h2>Low stock alerts</h2>
              <p>Products to replenish soon</p>
            </div>
            <span className="alert-count">{formatCount(lowStockCount)} items</span>
          </div>
          {lowStockQuery.isLoading ? (
            <div className="empty-inline">Loading stock alerts…</div>
          ) : lowStockQuery.isError ? (
            <div className="empty-inline">Could not load stock alerts.</div>
          ) : lowItems.length ? (
            lowItems.map((p) => (
              <div className="alert-row" key={p._id}>
                <span className="alert-mark">
                  <AlertTriangle size={15} />
                </span>
                <div className="alert-info">
                  <strong>{p.name}</strong>
                  <small>{p.SKU}</small>
                </div>
                <span className="alert-qty">
                  {p.stockQuantity} <small>left</small>
                </span>
              </div>
            ))
          ) : (
            <div className="empty-inline">All products are above their stock thresholds.</div>
          )}
          <Link href="/admin/inventory" className="text-link alert-link">
            Review stock <ArrowUpRight size={14} />
          </Link>
        </section>
      </div>

      <div className="dashboard-grid second-row">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Recently added products</h2>
              <p>Your latest catalogue updates</p>
            </div>
            <Link href="/admin/products" className="text-link">
              View all <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>PRODUCT</th>
                  <th>SIZE · FINISH</th>
                  <th>STOCK</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {recentProductsQuery.isLoading ? (
                  <tr>
                    <td colSpan={4} className="empty-inline">
                      Loading products…
                    </td>
                  </tr>
                ) : recentProductsQuery.isError ? (
                  <tr>
                    <td colSpan={4} className="empty-inline">
                      Could not load recent products.
                    </td>
                  </tr>
                ) : recentProducts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="empty-inline">
                      No products yet.
                    </td>
                  </tr>
                ) : (
                  recentProducts.map((p) => (
                    <tr key={p._id}>
                      <td>
                        <div className="product-cell">
                          <ProductPhoto src={productImage(p)} name={p.name} />
                          <span>
                            <strong>{p.name}</strong>
                            <small>{p.SKU}</small>
                          </span>
                        </div>
                      </td>
                      <td>
                        {p.size || '—'}
                        <small className="cell-sub">{p.finish || '—'}</small>
                      </td>
                      <td>{p.stockQuantity}</td>
                      <td>
                        <StatusBadge value={stockStatus(p)} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Recent dealers</h2>
              <p>Latest partner registrations</p>
            </div>
            <Link href="/admin/dealers" className="text-link">
              View all <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="dealer-list">
            {recentDealersQuery.isLoading ? (
              <div className="empty-inline">Loading dealers…</div>
            ) : recentDealersQuery.isError ? (
              <div className="empty-inline">Could not load recent dealers.</div>
            ) : recentDealers.length === 0 ? (
              <div className="empty-inline">No dealers registered yet.</div>
            ) : (
              recentDealers.map((d) => {
                const name = d.businessName || d.ownerName || d.name || 'Unnamed dealer';
                return (
                  <Link className="dealer-list-row" key={d._id} href={`/admin/dealers/${d._id}`}>
                    <span className="dealer-initial">{name.slice(0, 1).toUpperCase()}</span>
                    <span className="dealer-list-name">
                      <strong>{name}</strong>
                      <small>
                        {[d.dealerId, formatDate(d.createdAt)].filter(Boolean).join(' · ')}
                      </small>
                    </span>
                    <DealerStatusBadge status={d.approvalStatus ?? null} />
                  </Link>
                );
              })
            )}
          </div>
        </section>
      </div>

      <section className="panel cart-overview">
        <div className="panel-heading">
          <div>
            <h2>Dealer cart activity</h2>
            <p>Current product interest · carts are not orders or sales</p>
          </div>
          <Link href="/admin/dealer-cart-activity" className="text-link">
            View activity <ArrowUpRight size={14} />
          </Link>
        </div>
        {cartQuery.isLoading ? (
          <div className="empty-inline">Loading cart activity…</div>
        ) : cartQuery.isError ? (
          <div className="empty-inline">Could not load cart activity.</div>
        ) : (
          <div className="cart-summary-cards">
            <div>
              <strong>{formatCount(cart?.dealersWithActiveCarts ?? dealers?.dealersWithCarts ?? 0)}</strong>
              <small>Dealers with active carts</small>
            </div>
            <div>
              <strong>{formatCount(cart?.totalUniqueProductsInAllCarts ?? overview?.cartActivity.totalCartProducts ?? 0)}</strong>
              <small>Total cart products</small>
            </div>
            <div>
              <strong>{formatCount(cart?.totalQuantityInAllCarts ?? overview?.cartActivity.totalCartQuantities ?? 0)}</strong>
              <small>Total cart quantities</small>
            </div>
          </div>
        )}
      </section>

      <div className="quick-actions">
        <span className="quick-label">QUICK ACTIONS</span>
        <Link href="/admin/products?new=1">
          <Plus size={17} /> Add new product <ArrowUpRight size={14} />
        </Link>
        <Link href="/admin/categories?new=1">
          <Tag size={16} /> Create category <ArrowUpRight size={14} />
        </Link>
        <Link href="/admin/inventory">
          <Warehouse size={16} /> Update stock <ArrowUpRight size={14} />
        </Link>
        <Link href="/admin/dealers">
          <Users size={16} /> View dealers <ArrowUpRight size={14} />
        </Link>
      </div>
    </>
  );
}
