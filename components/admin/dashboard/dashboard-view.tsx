'use client';

import React from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Package,
  Plus,
  Tag,
  Users,
  Warehouse,
} from 'lucide-react';
import type { Dealer, Product, State } from '@/lib/admin/store';
import { PageHeading } from '@/components/admin/layout/page-heading';
import { StatCard } from '@/components/admin/shared/stat-card';
import { StatusBadge } from '@/components/admin/shared/status-badge';
import { ProductPhoto } from '@/components/admin/shared/product-photo';
import { formatDate } from '@/components/admin/shared/formatters';

interface DashboardViewProps {
  data: State;
}

export function DashboardView({ data }: DashboardViewProps) {
  const total = data.products.reduce((s, p) => s + p.stock, 0);
  const approved = data.dealers.filter((d) => d.status === 'Approved').length;
  const pending = data.dealers.filter((d) => d.status === 'Pending').length;
  const low = data.products.filter((p) => p.stock > 0 && p.stock <= p.threshold);
  const stockStatus = (p: Product) =>
    p.stock === 0 ? 'Out of stock' : p.stock <= p.threshold ? 'Low stock' : 'In stock';
  const cartCount = (d: Dealer) => d.cart.reduce((s, c) => s + c.quantity, 0);

  return (
    <>
      <PageHeading
        eyebrow="MONDAY, 26 NOVEMBER 2026"
        title="Good morning, Rohan"
        description="Here's what's happening across your tile business today."
        action={
          <button className="secondary-button" onClick={() => window.print()}>
            <ArrowDownRight size={16} /> Export overview
          </button>
        }
      />

      <div className="stats-grid">
        <StatCard label="Total products" value={data.products.length} detail="Across your catalogue" icon={Package} />
        <StatCard label="Categories" value={data.categories.length} detail={`${data.categories.filter((c) => c.active).length} visible on website`} icon={Tag} tone="blue" />
        <StatCard label="Total stock quantity" value={total.toLocaleString('en-IN')} detail="Central inventory units" icon={Warehouse} tone="green" />
        <StatCard label="Total dealers" value={data.dealers.length} detail={`${approved} approved partners`} icon={Users} tone="blue" />
        <StatCard label="Approved dealers" value={approved} detail="Ready to browse catalogue" icon={Check} tone="green" />
        <StatCard label="Pending approvals" value={pending} detail="Awaiting your review" icon={Activity} tone="amber" />
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
              <span className="summary-number">{data.products.length}</span>
              <span className="summary-label">Products tracked</span>
            </div>
            <div>
              <span className="summary-number warning-text">{low.length}</span>
              <span className="summary-label">Low stock</span>
            </div>
            <div>
              <span className="summary-number danger-text">
                {data.products.filter((p) => p.stock === 0).length}
              </span>
              <span className="summary-label">Out of stock</span>
            </div>
          </div>
          <div className="stock-bar-label">
            <span>Available stock</span>
            <strong>{total.toLocaleString('en-IN')} units</strong>
          </div>
          <div className="stock-bar">
            <i style={{ width: `${Math.max(5, Math.min(100, total / 8))}%` }} />
          </div>
          <div className="stock-foot">
            <span>
              <i className="dot green-dot" /> Healthy stock
            </span>
            <span>Across {data.categories.length} collections</span>
          </div>
        </section>

        <section className="panel alert-panel">
          <div className="panel-heading">
            <div>
              <h2>Low stock alerts</h2>
              <p>Products to replenish soon</p>
            </div>
            <span className="alert-count">{low.length} items</span>
          </div>
          {low.length ? (
            low.slice(0, 3).map((p) => (
              <div className="alert-row" key={p.id}>
                <span className="alert-mark">
                  <AlertTriangle size={15} />
                </span>
                <div className="alert-info">
                  <strong>{p.name}</strong>
                  <small>{p.sku}</small>
                </div>
                <span className="alert-qty">
                  {p.stock} <small>left</small>
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
                {[...data.products]
                  .slice(-4)
                  .reverse()
                  .map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="product-cell">
                          <ProductPhoto src={p.image} name={p.name} />
                          <span>
                            <strong>{p.name}</strong>
                            <small>{p.sku}</small>
                          </span>
                        </div>
                      </td>
                      <td>
                        {p.size}
                        <small className="cell-sub">{p.finish}</small>
                      </td>
                      <td>{p.stock}</td>
                      <td>
                        <StatusBadge value={stockStatus(p)} />
                      </td>
                    </tr>
                  ))}
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
            {[...data.dealers]
              .sort((a, b) => b.registered.localeCompare(a.registered))
              .slice(0, 4)
              .map((d) => (
                <Link className="dealer-list-row" key={d.id} href={`/admin/dealers/${d.id}`}>
                  <span className="dealer-initial">{d.business.slice(0, 1)}</span>
                  <span className="dealer-list-name">
                    <strong>{d.business}</strong>
                    <small>
                      {d.id} · {formatDate(d.registered)}
                    </small>
                  </span>
                  <StatusBadge value={d.status} />
                </Link>
              ))}
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
        <div className="cart-activity-grid">
          {data.dealers
            .filter((d) => d.cart.length)
            .map((d) => (
              <Link key={d.id} href={`/admin/dealers/${d.id}`} className="cart-mini">
                <span className="dealer-initial">{d.business.slice(0, 1)}</span>
                <span className="cart-mini-name">
                  <strong>{d.business}</strong>
                  <small>
                    {d.cart.length} unique products · {cartCount(d)} total qty
                  </small>
                </span>
                <span className="category-chips">
                  {[
                    ...new Set(
                      d.cart
                        .map(
                          (i) =>
                            data.categories
                              .find((c) => c.id === data.products.find((p) => p.id === i.productId)?.categoryId)
                              ?.name.split(' ')[0]
                        )
                        .filter(Boolean)
                    ),
                  ].join(' · ')}
                </span>
                <ArrowUpRight size={16} />
              </Link>
            ))}
        </div>
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
