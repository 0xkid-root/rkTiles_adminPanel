'use client';

import React, { useState, type FormEvent } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Category, State } from '@/lib/admin/store';
import { productImage } from '@/lib/admin/store';
import { categoryService } from '@/services/categories';
import { ApiError } from '@/lib/http';
import { PageHeading } from '@/components/admin/layout/page-heading';
import { StatusBadge } from '@/components/admin/shared/status-badge';
import { formatDate } from '@/components/admin/shared/formatters';
import { Modal } from '@/components/admin/admin-extras';

interface CategoriesViewProps {
  data: State;
  update: (fn: (s: State) => State) => void;
}

export function CategoriesView({ data }: CategoriesViewProps) {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Category | null | false>(false);
  const [modalError, setModalError] = useState('');

  // 1. React Query fetch with automatic caching, deduplication & zero infinite loops
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await categoryService.getAll();
      const list = res?.data || [];
      return list.map((cat: any): Category => ({
        id: cat._id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description || '',
        image: cat.image || productImage(0),
        active: cat.isActive ?? true,
        created: cat.createdAt ? cat.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
      }));
    },
  });

  // 2. React Query Mutation: Create / Update
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
        return categoryService.update(id, payload);
      }
      return categoryService.create(payload);
    },
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setEditing(false);
      setModalError('');
      // Use actual backend message instead of hardcoding
      const backendMessage = res?.message || (variables.isEditing ? 'Category updated' : 'Category created');
      toast.success(backendMessage);
    },
    onError: (err: any) => {
      const msg = err instanceof ApiError ? (err.message || 'Operation failed') : (err?.message || 'Could not save category');
      setModalError(msg);
      toast.error(msg);
    },
  });

  // 3. React Query Mutation: Toggle Status
  const statusMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      categoryService.updateStatus(id, active),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      // Use actual backend message
      toast.success(res?.message || 'Category status updated successfully');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update category status');
    },
  });

  // 4. React Query Mutation: Delete
  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoryService.delete(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      // Use actual backend message
      toast.success(res?.message || 'Category removed successfully');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Could not delete category');
    },
  });

  // Fallback to local data if cache is empty or loading
  const displayList = categories.length > 0 ? categories : data.categories;
  const filteredList = displayList.filter((c) =>
    `${c.name} ${c.description}`.toLowerCase().includes(query.toLowerCase())
  );

  const save = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saveMutation.isPending) return;
    setModalError('');

    const form = new FormData(e.currentTarget);
    const name = String(form.get('name')).trim();
    const description = String(form.get('description'));
    const image = String(form.get('image') || productImage(0));
    const active = form.get('active') === 'on';

    saveMutation.mutate({
      isEditing: Boolean(editing && editing.id),
      id: editing ? editing.id : undefined,
      payload: {
        name,
        description,
        image,
        isActive: active,
        isVisible: active,
      },
    });
  };

  const toggleStatus = (category: Category) => {
    statusMutation.mutate({ id: category.id, active: !category.active });
  };

  const removeCategory = (category: Category) => {
    const count = data.products.filter((p) => p.categoryId === category.id).length;
    if (count) {
      toast.warning(`Cannot delete “${category.name}”: ${count} product${count === 1 ? ' is' : 's are'} assigned.`);
      return;
    }
    if (!confirm(`Delete ${category.name}? This cannot be undone.`)) return;
    deleteMutation.mutate(category.id);
  };

  return (
    <>
      <PageHeading
        eyebrow="CATALOGUE CONTROL"
        title="Categories"
        description="Organize your collections and control what appears on your website."
        action={
          <button
            className="primary-button"
            onClick={() => {
              setModalError('');
              setEditing(null);
            }}
          >
            <Plus size={16} /> Create category
          </button>
        }
      />

      <section className="panel content-panel">
        <div className="list-toolbar">
          <div>
            <strong>{displayList.length} collections</strong>
            <span> · {displayList.filter((c) => c.active).length} active</span>
            {isLoading && <span style={{ marginLeft: 8, opacity: 0.6 }}>(Syncing...)</span>}
          </div>
          <label className="inline-search">
            <Search size={15} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search categories"
            />
          </label>
        </div>

        <div className="category-grid">
          {filteredList.map((c) => (
            <article className="category-card" key={c.id}>
              <div className="category-cover">
                <img src={c.image} alt={c.name} />
                <StatusBadge value={c.active ? 'Active' : 'Inactive'} />
                <button
                  className="icon-button category-edit"
                  aria-label={`Edit ${c.name}`}
                  onClick={() => {
                    setModalError('');
                    setEditing(c);
                  }}
                >
                  <Pencil size={15} />
                </button>
              </div>
              <div className="category-body">
                <div className="category-title">
                  <h3>{c.name}</h3>
                  <span>
                    {data.products.filter((p) => p.categoryId === c.id).length} products
                  </span>
                </div>
                <p>{c.description}</p>
                <div className="category-meta">
                  <span>/{c.slug}</span>
                  <span>Created {formatDate(c.created)}</span>
                </div>
                <div className="category-actions">
                  <button
                    className="secondary-button compact"
                    onClick={() => {
                      setModalError('');
                      setEditing(c);
                    }}
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  <button
                    className="secondary-button compact"
                    onClick={() => toggleStatus(c)}
                    disabled={statusMutation.isPending}
                  >
                    {c.active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    className="icon-button danger-icon"
                    aria-label="Delete category"
                    onClick={() => removeCategory(c)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
        {filteredList.length === 0 && (
          <div className="empty-state">No categories match your search.</div>
        )}
      </section>

      {editing !== false && (
        <Modal
          title={editing ? 'Edit category' : 'Create category'}
          onClose={() => setEditing(false)}
        >
          <form className="admin-form" onSubmit={save}>
            {modalError && (
              <div className="form-error" role="alert">
                {modalError}
              </div>
            )}
            <div className="form-grid">
              <label>
                Category name
                <input
                  name="name"
                  defaultValue={editing?.name}
                  required
                  disabled={saveMutation.isPending}
                />
              </label>
              <label>
                Slug
                <input
                  name="slug"
                  defaultValue={editing?.slug}
                  placeholder="auto-generated by backend"
                  disabled={saveMutation.isPending}
                />
              </label>
              <label className="full-field">
                Description
                <textarea
                  name="description"
                  defaultValue={editing?.description}
                  rows={3}
                  disabled={saveMutation.isPending}
                />
              </label>
              <label>
                Image URL
                <input
                  name="image"
                  defaultValue={editing?.image || productImage(0)}
                  disabled={saveMutation.isPending}
                />
              </label>
              <label className="toggle-field">
                <input
                  name="active"
                  type="checkbox"
                  defaultChecked={editing?.active ?? true}
                  disabled={saveMutation.isPending}
                />{' '}
                Visible on website
              </label>
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
                {saveMutation.isPending ? 'Saving...' : 'Save category'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
