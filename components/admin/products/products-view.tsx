'use client';

import React, { useState, type FormEvent } from 'react';
import { Pencil, Plus, Search, SlidersHorizontal } from 'lucide-react';
import type { Product, State } from '@/lib/admin/store';
import { productImage } from '@/lib/admin/store';
import { PageHeading } from '@/components/admin/layout/page-heading';
import { StatusBadge } from '@/components/admin/shared/status-badge';
import { ProductPhoto } from '@/components/admin/shared/product-photo';
import { formatMoney } from '@/components/admin/shared/formatters';
import { Modal } from '@/components/admin/admin-extras';

interface ProductsViewProps {
  data: State;
  update: (fn: (s: State) => State) => void;
}

export function ProductsView({ data, update }: ProductsViewProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All categories');
  const [status, setStatus] = useState('All availability');
  const [stock, setStock] = useState('All stock');
  const [show, setShow] = useState('All visibility');
  const [editing, setEditing] = useState<Product | null | false>(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [notice, setNotice] = useState('');

  const filtered = data.products.filter((p) => {
    const cat = data.categories.find((c) => c.id === p.categoryId)?.name || '';
    return (
      `${p.name} ${p.sku}`.toLowerCase().includes(query.toLowerCase()) &&
      (category === 'All categories' || cat === category) &&
      (status === 'All availability' || (status === 'Available' ? p.stock > 0 : p.stock === 0)) &&
      (stock === 'All stock' ||
        (stock === 'Low stock'
          ? p.stock > 0 && p.stock <= p.threshold
          : stock === 'Out of stock'
          ? p.stock === 0
          : p.stock > p.threshold)) &&
      (show === 'All visibility' || (show === 'Published' ? p.published : !p.published))
    );
  });

  const save = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const product: Product = {
      id: (editing || undefined)?.id || `prd-${Date.now()}`,
      name: String(f.get('name')),
      sku: String(f.get('sku')),
      categoryId: String(f.get('categoryId')),
      size: String(f.get('size')),
      finish: String(f.get('finish')),
      surface: String(f.get('surface')),
      color: String(f.get('color')),
      price: Number(f.get('price') || 0),
      stock: Math.max(0, Number(f.get('stock') || 0)),
      threshold: Number(f.get('threshold') || 0),
      image: String(f.get('image') || productImage(0)),
      featured: f.get('featured') === 'on',
      published: f.get('published') === 'on',
      active: f.get('active') === 'on',
      description: String(f.get('description')),
      updated: new Date().toISOString().slice(0, 10),
    };
    update((s) => ({
      ...s,
      products: editing
        ? s.products.map((p) => (p.id === product.id ? product : p))
        : [product, ...s.products],
      content: {
        ...s.content,
        featuredIds: product.featured
          ? [...new Set([...s.content.featuredIds, product.id])]
          : s.content.featuredIds.filter((id) => id !== product.id),
      },
    }));
    setEditing(false);
    setNotice('Product saved. Catalogue and stock totals are updated.');
  };

  const categoryName = (id: string) =>
    data.categories.find((c) => c.id === id)?.name || 'Uncategorized';
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
              setNotice('');
              setEditing(null);
            }}
          >
            <Plus size={16} /> Add product
          </button>
        }
      />
      {notice && (
        <div className="notice">
          {notice}
          <button onClick={() => setNotice('')}>✕</button>
        </div>
      )}
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
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>All categories</option>
            {data.categories.map((c) => (
              <option key={c.id}>{c.name}</option>
            ))}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>All availability</option>
            <option>Available</option>
            <option>Out of stock</option>
          </select>
          <select value={stock} onChange={(e) => setStock(e.target.value)}>
            <option>All stock</option>
            <option>In stock</option>
            <option>Low stock</option>
            <option>Out of stock</option>
          </select>
          <select value={show} onChange={(e) => setShow(e.target.value)}>
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
                    <StatusBadge value={p.published ? 'Published' : 'Unpublished'} />
                  </td>
                  <td>
                    <button
                      className="icon-button"
                      aria-label={`Edit ${p.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditing(p);
                      }}
                    >
                      <Pencil size={15} />
                    </button>
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
          Showing <strong>{filtered.length}</strong> of {data.products.length} products{' '}
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
            <div className="form-section-title">PRODUCT DETAILS</div>
            <div className="form-grid">
              <label>
                Product name
                <input name="name" defaultValue={editing?.name} required />
              </label>
              <label>
                SKU / Product ID
                <input name="sku" defaultValue={editing?.sku} required />
              </label>
              <label>
                Category
                <select
                  name="categoryId"
                  defaultValue={editing?.categoryId || data.categories[0]?.id}
                  required
                >
                  {data.categories.map((c) => (
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
                  defaultValue={editing?.size}
                  placeholder="e.g. 600 × 1200 mm"
                />
              </label>
              <label>
                Finish
                <input name="finish" defaultValue={editing?.finish} />
              </label>
              <label>
                Surface / material
                <input name="surface" defaultValue={editing?.surface} />
              </label>
              <label>
                Color
                <input name="color" defaultValue={editing?.color} />
              </label>
              <label>
                Price (₹ / unit)
                <input name="price" type="number" min="0" defaultValue={editing?.price} />
              </label>
              <label className="full-field">
                Description
                <textarea name="description" rows={2} defaultValue={editing?.description} />
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
                  defaultValue={editing?.stock ?? 0}
                />
              </label>
              <label>
                Low-stock threshold
                <input
                  name="threshold"
                  type="number"
                  min="0"
                  defaultValue={editing?.threshold ?? 20}
                />
              </label>
              <label>
                Product image URL
                <input
                  name="image"
                  defaultValue={editing?.image || productImage(0)}
                />
              </label>
              <div className="checkbox-row">
                <label>
                  <input
                    name="featured"
                    type="checkbox"
                    defaultChecked={editing?.featured}
                  />{' '}
                  Featured
                </label>
                <label>
                  <input
                    name="published"
                    type="checkbox"
                    defaultChecked={editing?.published ?? true}
                  />{' '}
                  Published
                </label>
                <label>
                  <input
                    name="active"
                    type="checkbox"
                    defaultChecked={editing?.active ?? true}
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
              >
                Cancel
              </button>
              <button className="primary-button" type="submit">
                Save product
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
