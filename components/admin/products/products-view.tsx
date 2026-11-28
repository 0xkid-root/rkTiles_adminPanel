'use client';

import React, { useState, type FormEvent } from 'react';
import { Pencil, Plus, Search, SlidersHorizontal, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Product, State } from '@/lib/admin/store';
import { productImage } from '@/lib/admin/store';
import { productService, type BackendProduct } from '@/services/products';
import { categoryService, type BackendCategory } from '@/services/categories';
import { ApiError } from '@/lib/http';
import { PageHeading } from '@/components/admin/layout/page-heading';
import { StatusBadge } from '@/components/admin/shared/status-badge';
import { ProductPhoto } from '@/components/admin/shared/product-photo';
import { formatMoney } from '@/components/admin/shared/formatters';
import { Modal } from '@/components/admin/admin-extras';

interface ProductsViewProps {
  data: State;
  update: (fn: (s: State) => State) => void;
}

export function ProductsView({ data }: ProductsViewProps) {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All categories');
  const [statusFilter, setStatusFilter] = useState('All availability');
  const [stockFilter, setStockFilter] = useState('All stock');
  const [visibilityFilter, setVisibilityFilter] = useState('All visibility');
  const [editing, setEditing] = useState<Product | null | false>(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [modalError, setModalError] = useState('');

  // 1. Fetch categories for selector dropdown & category mapping
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await categoryService.getAll();
      return (res?.data || []).map((cat: any) => ({
        id: cat._id,
        name: cat.name,
      }));
    },
  });

  // 2. Fetch live products via React Query
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await productService.getAll({ limit: 100 });
      const list = res?.data || [];
      return list.map((p: BackendProduct): Product => {
        const catId = typeof p.category === 'object' && p.category !== null ? p.category._id : (p.category || '');
        return {
          id: p._id,
          name: p.name,
          sku: p.SKU,
          categoryId: catId,
          size: p.size || '600 × 1200 mm',
          finish: p.finish || 'Polished',
          surface: p.surface || 'GVT',
          color: p.color || 'White',
          price: p.price ?? 0,
          stock: p.stockQuantity ?? 0,
          threshold: p.lowStockThreshold ?? 20,
          image: p.images && p.images.length > 0 ? p.images[0] : productImage(0),
          featured: p.isFeatured ?? false,
          published: p.isVisible ?? true,
          active: p.isActive ?? true,
          description: p.description || '',
          updated: p.updatedAt ? p.updatedAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
        };
      });
    },
  });

  // 3. Mutation: Create / Update product
  const saveMutation = useMutation({
    mutationFn: async ({
      isEditing,
      id,
      payload,
    }: {
      isEditing: boolean;
      id?: string;
      payload: any;
    }) => {
      if (isEditing && id) {
        return productService.update(id, payload);
      }
      return productService.create(payload);
    },
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setEditing(false);
      setModalError('');
      const backendMessage = res?.message || (variables.isEditing ? 'Product updated' : 'Product created');
      toast.success(backendMessage);
    },
    onError: (err: any) => {
      const msg = err instanceof ApiError ? (err.message || 'Operation failed') : (err?.message || 'Could not save product');
      setModalError(msg);
      toast.error(msg);
    },
  });

  // 4. Mutation: Delete product
  const deleteMutation = useMutation({
    mutationFn: (id: string) => productService.delete(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(res?.message || 'Product removed successfully');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Could not delete product');
    },
  });

  // 5. Mutation: Toggle publish (visibility)
  const toggleVisibilityMutation = useMutation({
    mutationFn: ({ id, isVisible }: { id: string; isVisible: boolean }) =>
      productService.updateVisibility(id, isVisible),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(res?.message || 'Product visibility updated');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update visibility');
    },
  });

  // Use live data from backend (no dummy data fallback)
  const displayProducts = products;
  const displayCategories = categories;

  const categoryName = (id: string) =>
    displayCategories.find((c) => c.id === id)?.name || 'Uncategorized';

  const filtered = displayProducts.filter((p) => {
    const cat = categoryName(p.categoryId);
    return (
      `${p.name} ${p.sku}`.toLowerCase().includes(query.toLowerCase()) &&
      (selectedCategory === 'All categories' || cat === selectedCategory) &&
      (statusFilter === 'All availability' || (statusFilter === 'Available' ? p.stock > 0 : p.stock === 0)) &&
      (stockFilter === 'All stock' ||
        (stockFilter === 'Low stock'
          ? p.stock > 0 && p.stock <= p.threshold
          : stockFilter === 'Out of stock'
          ? p.stock === 0
          : p.stock > p.threshold)) &&
      (visibilityFilter === 'All visibility' || (visibilityFilter === 'Published' ? p.published : !p.published))
    );
  });

  const save = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saveMutation.isPending) return;
    setModalError('');

    const f = new FormData(e.currentTarget);
    const name = String(f.get('name')).trim();
    const sku = String(f.get('sku')).trim().toUpperCase();
    const category = String(f.get('categoryId'));
    const size = String(f.get('size'));
    const finish = String(f.get('finish'));
    const surface = String(f.get('surface'));
    const color = String(f.get('color'));
    const price = Number(f.get('price') || 0);
    const stockQuantity = Math.max(0, Number(f.get('stock') || 0));
    const lowStockThreshold = Number(f.get('threshold') || 0);
    const image = String(f.get('image') || productImage(0));
    const isFeatured = f.get('featured') === 'on';
    const isVisible = f.get('published') === 'on';
    const isActive = f.get('active') === 'on';
    const description = String(f.get('description'));

    saveMutation.mutate({
      isEditing: Boolean(editing && editing.id),
      id: editing ? editing.id : undefined,
      payload: {
        name,
        SKU: sku,
        category,
        size,
        finish,
        surface,
        color,
        price,
        stockQuantity,
        lowStockThreshold,
        images: image ? [image] : [],
        isFeatured,
        isVisible,
        isActive,
        description,
      },
    });
  };

  const removeProduct = (product: Product) => {
    if (!confirm(`Delete product ${product.name}? This action cannot be undone.`)) return;
    deleteMutation.mutate(product.id);
  };

  const availability = (p: Product) => (p.stock > 0 ? 'Available' : 'Out of stock');
  const statusStock = (p: Product) =>
    p.stock === 0 ? 'Out of stock' : p.stock <= p.threshold ? 'Low stock' : 'In stock';

  return (
    <>
      <PageHeading
        eyebrow="CATALOGUE CONTROL"
        title="Products"
        description="Manage your tile catalogue, product visibility and availability."
        action={
          <button
            className="primary-button"
            onClick={() => {
              setModalError('');
              setEditing(null);
            }}
          >
            <Plus size={16} /> Add product
          </button>
        }
      />

      <section className="panel content-panel">
        <div className="list-toolbar product-toolbar">
          <label className="inline-search wide-search">
            <Search size={15} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or SKU"
            />
          </label>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            <option>All categories</option>
            {displayCategories.map((c) => (
              <option key={c.id}>{c.name}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option>All availability</option>
            <option>Available</option>
            <option>Out of stock</option>
          </select>
          <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
            <option>All stock</option>
            <option>In stock</option>
            <option>Low stock</option>
            <option>Out of stock</option>
          </select>
          <select value={visibilityFilter} onChange={(e) => setVisibilityFilter(e.target.value)}>
            <option>All visibility</option>
            <option>Published</option>
            <option>Unpublished</option>
          </select>
        </div>

        <div className="table-scroll">
          <table className="products-table">
            <thead>
              <tr>
                <th>PRODUCT</th>
                <th>CATEGORY</th>
                <th>SIZE · FINISH</th>
                <th>PRICE</th>
                <th>STOCK</th>
                <th>AVAILABILITY</th>
                <th>WEBSITE</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} onClick={() => setSelected(p)} className="click-row">
                  <td>
                    <div className="product-cell">
                      <ProductPhoto src={p.image} name={p.name} />
                      <span>
                        <strong>
                          {p.name}
                          {p.featured && <span className="featured-star">FEATURED</span>}
                        </strong>
                        <small>{p.sku}</small>
                      </span>
                    </div>
                  </td>
                  <td>{categoryName(p.categoryId)}</td>
                  <td>
                    {p.size}
                    <small className="cell-sub">
                      {p.finish} · {p.surface}
                    </small>
                  </td>
                  <td>{formatMoney(p.price)}</td>
                  <td>
                    <strong>{p.stock}</strong>
                    <small className="cell-sub">threshold {p.threshold}</small>
                  </td>
                  <td>
                    <StatusBadge value={availability(p)} />
                  </td>
                  <td>
                    <button
                      className="text-link"
                      style={{ fontSize: '0.85rem' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleVisibilityMutation.mutate({ id: p.id, isVisible: !p.published });
                      }}
                      title="Click to toggle publish status"
                    >
                      <StatusBadge value={p.published ? 'Published' : 'Unpublished'} />
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        className="icon-button"
                        aria-label={`Edit ${p.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalError('');
                          setEditing(p);
                        }}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className="icon-button danger-icon"
                        aria-label={`Delete ${p.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeProduct(p);
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty-state">No products match these filters.</div>
          )}
        </div>

        <div className="table-footer">
          Showing <strong>{filtered.length}</strong> of {displayProducts.length} products{' '}
          {isLoading && <span style={{ opacity: 0.6 }}>(Syncing...)</span>}
          <span>
            <SlidersHorizontal size={14} /> Filters apply instantly
          </span>
        </div>
      </section>

      {editing !== false && (
        <Modal
          title={editing ? 'Edit product' : 'Add product'}
          onClose={() => setEditing(false)}
          wide
        >
          <form className="admin-form" onSubmit={save}>
            {modalError && (
              <div className="form-error" role="alert">
                {modalError}
              </div>
            )}
            <div className="form-section-title">PRODUCT DETAILS</div>
            <div className="form-grid">
              <label>
                Product name
                <input name="name" defaultValue={editing?.name} required disabled={saveMutation.isPending} />
              </label>
              <label>
                SKU / Product ID
                <input name="sku" defaultValue={editing?.sku} required disabled={saveMutation.isPending} />
              </label>
              <label>
                Category
                <select
                  name="categoryId"
                  defaultValue={editing?.categoryId || displayCategories[0]?.id}
                  required
                  disabled={saveMutation.isPending}
                >
                  {displayCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Tile size
                <input
                  name="size"
                  defaultValue={editing?.size || '600x1200'}
                  placeholder="e.g. 600x1200"
                  disabled={saveMutation.isPending}
                />
              </label>
              <label>
                Finish
                <input name="finish" defaultValue={editing?.finish || 'Glossy'} disabled={saveMutation.isPending} />
              </label>
              <label>
                Surface / material
                <input name="surface" defaultValue={editing?.surface || 'Polished'} disabled={saveMutation.isPending} />
              </label>
              <label>
                Color
                <input name="color" defaultValue={editing?.color || 'White'} disabled={saveMutation.isPending} />
              </label>
              <label>
                Price (₹ / unit)
                <input name="price" type="number" min="0" defaultValue={editing?.price ?? 1000} disabled={saveMutation.isPending} />
              </label>
              <label className="full-field">
                Description
                <textarea name="description" rows={2} defaultValue={editing?.description} disabled={saveMutation.isPending} />
              </label>
            </div>
            <div className="form-section-title">INVENTORY & VISIBILITY</div>
            <div className="form-grid">
              <label>
                Stock quantity
                <input
                  name="stock"
                  type="number"
                  min="0"
                  defaultValue={editing?.stock ?? 100}
                  disabled={saveMutation.isPending}
                />
              </label>
              <label>
                Low-stock threshold
                <input
                  name="threshold"
                  type="number"
                  min="0"
                  defaultValue={editing?.threshold ?? 20}
                  disabled={saveMutation.isPending}
                />
              </label>
              <label>
                Product image URL
                <input
                  name="image"
                  defaultValue={editing?.image || productImage(0)}
                  disabled={saveMutation.isPending}
                />
              </label>
              <div className="checkbox-row">
                <label>
                  <input
                    name="featured"
                    type="checkbox"
                    defaultChecked={editing?.featured}
                    disabled={saveMutation.isPending}
                  />{' '}
                  Featured
                </label>
                <label>
                  <input
                    name="published"
                    type="checkbox"
                    defaultChecked={editing?.published ?? true}
                    disabled={saveMutation.isPending}
                  />{' '}
                  Published
                </label>
                <label>
                  <input
                    name="active"
                    type="checkbox"
                    defaultChecked={editing?.active ?? true}
                    disabled={saveMutation.isPending}
                  />{' '}
                  Active
                </label>
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={() => setEditing(false)}
                disabled={saveMutation.isPending}
              >
                Cancel
              </button>
              <button className="primary-button" type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving...' : 'Save product'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {selected && (
        <Modal title={selected.name} onClose={() => setSelected(null)}>
          <div className="product-detail">
            <ProductPhoto
              src={selected.image}
              name={selected.name}
              className="detail-photo"
            />
            <div className="detail-tags">
              <StatusBadge value={selected.published ? 'Published' : 'Unpublished'} />
              <StatusBadge value={statusStock(selected)} />
            </div>
            <div className="detail-sku">{selected.sku}</div>
            <p>{selected.description}</p>
            <div className="detail-grid">
              <span>
                Category<strong>{categoryName(selected.categoryId)}</strong>
              </span>
              <span>
                Size<strong>{selected.size}</strong>
              </span>
              <span>
                Finish<strong>{selected.finish}</strong>
              </span>
              <span>
                Surface<strong>{selected.surface}</strong>
              </span>
              <span>
                Color<strong>{selected.color}</strong>
              </span>
              <span>
                Price<strong>{formatMoney(selected.price)}</strong>
              </span>
              <span>
                Stock<strong>{selected.stock} units</strong>
              </span>
              <span>
                Low-stock threshold<strong>{selected.threshold} units</strong>
              </span>
            </div>
            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() => {
                  setSelected(null);
                  setModalError('');
                  setEditing(selected);
                }}
              >
                <Pencil size={15} /> Edit product
              </button>
              <button className="primary-button" onClick={() => setSelected(null)}>
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
