'use client';

import React, { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, History, Package, Search, SlidersHorizontal, Warehouse } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeading } from '@/components/admin/layout/page-heading';
import { StatCard } from '@/components/admin/shared/stat-card';
import { StatusBadge } from '@/components/admin/shared/status-badge';
import { Modal } from '@/components/admin/admin-extras';
import { ApiError } from '@/lib/http';
import {
  inventoryService,
  type InventoryItem,
  type StockAdjustmentType,
  type StockHistoryRecord,
} from '@/services/inventory';

const PAGE_SIZE = 20;

function categoryName(item: InventoryItem) {
  if (item.category && typeof item.category === 'object') return item.category.name;
  return 'Uncategorized';
}

function stockLabel(item: InventoryItem) {
  if (item.isOutOfStock || item.stockQuantity <= 0) return 'Out of stock';
  if (item.isLowStock || item.stockQuantity <= item.lowStockThreshold) return 'Low stock';
  return 'In stock';
}

function formatWhen(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatWhenTime(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function actorName(record: StockHistoryRecord) {
  if (record.adjustedBy && typeof record.adjustedBy === 'object') return record.adjustedBy.name;
  return 'Admin';
}

function typeLabel(type: StockAdjustmentType) {
  if (type === 'increase') return 'Increase';
  if (type === 'decrease') return 'Decrease';
  return 'Set stock';
}

export function InventoryView() {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'low_stock' | 'out_of_stock'>('all');
  const [page, setPage] = useState(1);
  const [adjusting, setAdjusting] = useState<InventoryItem | null>(null);
  const [historyFor, setHistoryFor] = useState<InventoryItem | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [mode, setMode] = useState<StockAdjustmentType>('increase');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const summaryQuery = useQuery({
    queryKey: ['inventory', 'summary'],
    queryFn: () => inventoryService.getSummary(),
  });

  const listQuery = useQuery({
    queryKey: ['inventory', 'list', { page, search, status }],
    queryFn: () =>
      inventoryService.getInventory({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        status: status === 'all' ? undefined : status,
      }),
  });

  const historyQuery = useQuery({
    queryKey: ['inventory', 'history', historyFor?._id, historyPage],
    enabled: Boolean(historyFor),
    queryFn: () => inventoryService.getHistory(historyFor!._id, { page: historyPage, limit: 10 }),
  });

  const adjustMutation = useMutation({
    mutationFn: async ({
      productId,
      adjustmentType,
      quantity,
      reason,
    }: {
      productId: string;
      adjustmentType: StockAdjustmentType;
      quantity: number;
      reason: string;
    }) => {
      if (adjustmentType === 'set') {
        return inventoryService.setStock(productId, { quantity, reason });
      }
      return inventoryService.adjustStock(productId, { adjustmentType, quantity, reason });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setAdjusting(null);
      setFormError('');
      toast.success(res?.message || 'Stock updated');
    },
    onError: (err: unknown) => {
      const message = err instanceof ApiError ? err.message : 'Could not update stock';
      setFormError(message);
      toast.error(message);
    },
  });

  const summary = summaryQuery.data?.data;
  const rows = listQuery.data?.data || [];
  const pagination = listQuery.data?.pagination;
  const totalPages = pagination?.totalPages || 1;
  const healthy = summary
    ? Math.max(0, summary.totalProducts - summary.lowStockProducts - summary.outOfStockProducts)
    : 0;

  const openAdjust = (item: InventoryItem) => {
    setMode('increase');
    setFormError('');
    setAdjusting(item);
  };

  const openHistory = (item: InventoryItem) => {
    setHistoryPage(1);
    setHistoryFor(item);
  };

  const submitAdjust = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!adjusting || adjustMutation.isPending) return;
    setFormError('');

    const form = new FormData(event.currentTarget);
    const quantity = Number(form.get('quantity'));
    const reason = String(form.get('reason') || '').trim();

    if (!Number.isInteger(quantity) || (mode === 'set' ? quantity < 0 : quantity < 1)) {
      setFormError(mode === 'set' ? 'Quantity must be a whole number of 0 or more.' : 'Quantity must be a whole number of 1 or more.');
      return;
    }
    if (!reason) {
      setFormError('A reason is required for every stock change.');
      return;
    }
    if (mode === 'decrease' && quantity > adjusting.stockQuantity) {
      setFormError(`Cannot decrease stock by ${quantity}. Current stock is only ${adjusting.stockQuantity}.`);
      return;
    }

    adjustMutation.mutate({
      productId: adjusting._id,
      adjustmentType: mode,
      quantity,
      reason,
    });
  };

  return (
    <>
      <PageHeading
        eyebrow="RK TILES ADMIN"
        title="Inventory / Stock"
        description="Manage central stock levels, low-stock alerts, and the adjustment audit trail."
      />

      <div className="stats-grid inventory-stats">
        <StatCard
          label="Total stock quantity"
          value={summary ? summary.totalStockUnits.toLocaleString('en-IN') : '—'}
          detail="Central inventory units"
          icon={Warehouse}
        />
        <StatCard
          label="In-stock products"
          value={summary ? healthy : '—'}
          detail="Above the low-stock threshold"
          icon={Package}
          tone="green"
        />
        <StatCard
          label="Low-stock products"
          value={summary ? summary.lowStockProducts : '—'}
          detail="At or below threshold"
          icon={AlertTriangle}
          tone="amber"
        />
        <StatCard
          label="Out of stock"
          value={summary ? summary.outOfStockProducts : '—'}
          detail="Needs replenishment"
          icon={SlidersHorizontal}
          tone="sand"
        />
      </div>

      {listQuery.isError && (
        <div className="form-error" role="alert" style={{ marginBottom: 16 }}>
          {listQuery.error instanceof ApiError ? listQuery.error.message : 'Could not load inventory.'}
        </div>
      )}

      <section className="panel content-panel">
        <div className="list-toolbar">
          <strong>Product stock levels</strong>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={status}
              aria-label="Filter by stock status"
              onChange={(event) => {
                setStatus(event.target.value as 'all' | 'low_stock' | 'out_of_stock');
                setPage(1);
              }}
            >
              <option value="all">All stock</option>
              <option value="low_stock">Low stock</option>
              <option value="out_of_stock">Out of stock</option>
            </select>
            <label className="inline-search">
              <Search size={15} />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search product or SKU"
              />
            </label>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>PRODUCT</th>
                <th>CATEGORY</th>
                <th>CURRENT STOCK</th>
                <th>THRESHOLD</th>
                <th>STATUS</th>
                <th>UPDATED</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {listQuery.isLoading ? (
                <tr>
                  <td colSpan={7}>Loading inventory…</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7}>No products match this stock filter.</td>
                </tr>
              ) : (
                rows.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div className="product-cell">
                        <span>
                          <strong>{item.name}</strong>
                          <small>{item.SKU}</small>
                        </span>
                      </div>
                    </td>
                    <td>{categoryName(item)}</td>
                    <td>
                      <b>{item.stockQuantity}</b> units
                    </td>
                    <td>{item.lowStockThreshold} units</td>
                    <td>
                      <StatusBadge value={stockLabel(item)} />
                    </td>
                    <td>{formatWhen(item.updatedAt)}</td>
                    <td>
                      <div className="row-actions">
                        <button className="secondary-button compact" onClick={() => openHistory(item)}>
                          <History size={14} /> History
                        </button>
                        <button className="secondary-button compact" onClick={() => openAdjust(item)}>
                          Adjust
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="list-toolbar">
          <span>
            {pagination
              ? `${pagination.total} products · page ${pagination.page} of ${totalPages}`
              : ' '}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="secondary-button compact"
              disabled={page <= 1 || listQuery.isLoading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Previous
            </button>
            <button
              type="button"
              className="secondary-button compact"
              disabled={page >= totalPages || listQuery.isLoading}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <p className="inventory-note">Dealer cart activity does not reduce central inventory.</p>

      {adjusting && (
        <Modal title="Adjust stock" onClose={() => !adjustMutation.isPending && setAdjusting(null)}>
          <form className="admin-form" onSubmit={submitAdjust}>
            <div className="adjust-product">
              <span>
                <b>{adjusting.name}</b>
                <small>
                  {adjusting.SKU} · Current: {adjusting.stockQuantity}
                </small>
              </span>
            </div>
            <label>
              Adjustment type
              <select
                name="type"
                value={mode}
                onChange={(event) => setMode(event.target.value as StockAdjustmentType)}
              >
                <option value="increase">Increase stock</option>
                <option value="decrease">Decrease stock</option>
                <option value="set">Set exact stock</option>
              </select>
            </label>
            <label>
              Quantity
              <input
                type="number"
                name="quantity"
                min={mode === 'set' ? 0 : 1}
                step={1}
                required
                disabled={adjustMutation.isPending}
              />
            </label>
            <label>
              Reason / notes
              <textarea name="reason" required rows={3} disabled={adjustMutation.isPending} />
            </label>
            {formError && (
              <div className="form-error" role="alert">
                {formError}
              </div>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setAdjusting(null)}
                disabled={adjustMutation.isPending}
              >
                Cancel
              </button>
              <button className="primary-button" disabled={adjustMutation.isPending}>
                {adjustMutation.isPending ? 'Saving…' : 'Apply adjustment'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {historyFor && (
        <Modal title="Stock history" onClose={() => setHistoryFor(null)} wide>
          <div className="admin-form">
            <div className="adjust-product">
              <span>
                <b>{historyFor.name}</b>
                <small>
                  {historyFor.SKU} · Current: {historyFor.stockQuantity}
                </small>
              </span>
            </div>
            {historyQuery.isError && (
              <div className="form-error" role="alert">
                {historyQuery.error instanceof ApiError
                  ? historyQuery.error.message
                  : 'Could not load stock history.'}
              </div>
            )}
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>DATE</th>
                    <th>TYPE</th>
                    <th>CHANGE</th>
                    <th>NEW QTY</th>
                    <th>REASON</th>
                    <th>BY</th>
                  </tr>
                </thead>
                <tbody>
                  {historyQuery.isLoading ? (
                    <tr>
                      <td colSpan={6}>Loading history…</td>
                    </tr>
                  ) : (historyQuery.data?.data || []).length === 0 ? (
                    <tr>
                      <td colSpan={6}>No stock adjustments recorded for this product.</td>
                    </tr>
                  ) : (
                    historyQuery.data!.data.map((record) => (
                      <tr key={record._id}>
                        <td>{formatWhenTime(record.createdAt)}</td>
                        <td>{typeLabel(record.adjustmentType)}</td>
                        <td>
                          {record.previousQuantity} → {record.newQuantity}
                          <small className="cell-sub">
                            {record.newQuantity - record.previousQuantity > 0 ? '+' : ''}
                            {record.newQuantity - record.previousQuantity}
                          </small>
                        </td>
                        <td>
                          <b>{record.newQuantity}</b>
                        </td>
                        <td>{record.reason}</td>
                        <td>{actorName(record)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {(historyQuery.data?.pagination?.totalPages || 1) > 1 && (
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={historyPage <= 1}
                  onClick={() => setHistoryPage((current) => Math.max(1, current - 1))}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={historyPage >= (historyQuery.data?.pagination?.totalPages || 1)}
                  onClick={() => setHistoryPage((current) => current + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
