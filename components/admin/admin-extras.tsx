'use client'
import { useState, useEffect, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowUpRight, Check, ChevronLeft, ChevronRight, ClipboardList, Globe2, Image as ImageIcon, LogOut, Pencil, Search, ShieldCheck, UserRound, X, Users, Package, Tag } from 'lucide-react'
import { useAdminStore, type Product, type State } from '@/lib/admin/store'
import { useAuth } from '@/lib/auth'
import { authService } from '@/services/auth'
import { ApiError } from '@/lib/http'
const money = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
const date = (s: string) => new Date(`${s}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
function Heading({ title, desc, action }: { title: string; desc: string; action?: React.ReactNode }) { return <div className="page-heading"><div><div className="eyebrow">RK TILES ADMIN</div><h1>{title}</h1><p>{desc}</p></div>{action}</div> }
export function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) { return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}><section className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="modal-title"><header><h2 id="modal-title">{title}</h2><button aria-label="Close dialog" onClick={onClose}><X size={18} /></button></header>{children}</section></div> }
function Status({ value }: { value: string }) { let c = ['Approved', 'In stock', 'Active', 'Published'].includes(value) ? 'positive' : ['Pending', 'Low stock'].includes(value) ? 'warning' : ['Rejected', 'Out of stock', 'Inactive', 'Unpublished'].includes(value) ? 'negative' : 'neutral'; return <span className={`status ${c}`}><i />{value}</span> }
function Photo({ p }: { p: Product }) { return <img className="product-photo" src={p.image} alt={p.name} /> }
export function CartActivity({ data }: { data: State }) { const dealers = data.dealers.filter(d => d.cart.length); const unique = new Set(dealers.flatMap(d => d.cart.map(x => x.productId))).size; const cats = new Set(dealers.flatMap(d => d.cart.map(x => data.products.find(p => p.id === x.productId)?.categoryId).filter(Boolean))).size; return <><Heading title="Dealer cart activity" desc="Monitor products dealers are exploring. These are not orders or sales." /><div className="stats-grid cart-stats">{[['Dealers with active carts', dealers.length, 'Current cart selections', Users], ['Unique products across carts', unique, 'Distinct catalogue items', Package], ['Total cart quantities', dealers.reduce((s, d) => s + d.cart.reduce((a, b) => a + b.quantity, 0), 0), 'No stock deduction', ClipboardList], ['Categories represented', cats, 'Across active carts', Tag]].map(([a, b, c, Icon]: any) => <article className="stat-card" key={a}><div className="stat-top"><span>{a}</span><span className="stat-icon sand"><Icon size={17} /></span></div><strong className="stat-value">{b}</strong><span className="stat-detail">{c}</span></article>)}</div><section className="panel content-panel"><div className="list-toolbar"><b>Active dealer carts</b><span className="cart-disclaimer"><ShieldCheck size={14} /> Cart selections only</span></div><div className="table-scroll"><table><thead><tr><th>DEALER</th><th>DEALER ID</th><th>BUSINESS</th><th>UNIQUE PRODUCTS</th><th>TOTAL QUANTITY</th><th>CATEGORIES</th><th /></tr></thead><tbody>{dealers.map(d => { const productCount = new Set(d.cart.map(c => c.productId)).size; const count = d.cart.reduce((s, c) => s + c.quantity, 0); const cats = [...new Set(d.cart.map(c => data.categories.find(cat => cat.id === data.products.find(p => p.id === c.productId)?.categoryId)?.name).filter(Boolean))]; return <tr key={d.id}><td>{d.owner}</td><td>{d.id}</td><td>{d.business}</td><td>{productCount}</td><td><b>{count}</b></td><td>{cats.join(' · ')}</td><td><Link className="text-link" href={`/admin/dealers/${d.id}`}>View cart <ArrowUpRight size={13} /></Link></td></tr> })}</tbody></table></div></section><div className="info-callout"><ShieldCheck size={18} /><div><b>Current selections, not purchases</b><p>Dealer carts do not represent sales or revenue. Central inventory is not reduced by cart activity.</p></div></div></> }
export function WebsiteContent({ data, update }: { data: State; update: (fn: (s: State) => State) => void }) { const [message, M] = useState(''); function toggle(id: string) { update(s => ({ ...s, content: { ...s.content, featuredIds: s.content.featuredIds.includes(id) ? s.content.featuredIds.filter(x => x !== id) : [...s.content.featuredIds, id] } })) } function order(id: string, step: number) { update(s => { const a = [...s.content.categoryOrder], i = a.indexOf(id), j = Math.min(a.length - 1, Math.max(0, i + step));[a[i], a[j]] = [a[j], a[i]]; return { ...s, content: { ...s.content, categoryOrder: a } } }) } return <><Heading title="Website content" desc="A lightweight way to curate the public RK Tiles experience." /><div className="info-callout"><Globe2 size={19} /><div><b>Mock content controls</b><p>These settings update the shared frontend demo state only. Your public website is not connected to this admin prototype.</p></div></div>{message && <div className="notice"><Check size={15} />{message}<button onClick={() => M('')}><X size={14} /></button></div>}<section className="panel content-panel"><div className="panel-heading"><div><h2>Homepage sections</h2><p>Control the presence of key homepage content</p></div></div><div className="content-toggle-row"><div className="toggle-icon"><ImageIcon size={18} /></div><span><b>Promotional section</b><small>Show the seasonal feature strip on homepage</small></span><label className="switch"><input type="checkbox" checked={data.content.promo} onChange={e => update(s => ({ ...s, content: { ...s.content, promo: e.target.checked } }))} /><i /></label></div><div className="content-toggle-row"><div className="toggle-icon"><ImageIcon size={18} /></div><span><b>Inspiration gallery</b><small>Display the interiors and inspiration gallery</small></span><label className="switch"><input type="checkbox" checked={data.content.gallery} onChange={e => update(s => ({ ...s, content: { ...s.content, gallery: e.target.checked } }))} /><i /></label></div></section><section className="panel content-panel"><div className="panel-heading"><div><h2>Featured products</h2><p>Choose products to highlight on the homepage</p></div></div><div className="content-product-list">{data.products.map(p => <label className="content-product" key={p.id}><input type="checkbox" checked={data.content.featuredIds.includes(p.id)} onChange={() => toggle(p.id)} /><Photo p={p} /><span><b>{p.name}</b><small>{p.sku} · {data.categories.find(c => c.id === p.categoryId)?.name}</small></span><Status value={p.published ? 'Published' : 'Unpublished'} /></label>)}</div></section><section className="panel content-panel"><div className="panel-heading"><div><h2>Featured collection order</h2><p>Adjust how collections are prioritized</p></div></div>{data.content.categoryOrder.map((id, i) => { const c = data.categories.find(x => x.id === id); if (!c) return null; return <div className="order-row" key={id}><span className="order-number">{String(i + 1).padStart(2, '0')}</span><b>{c.name}</b><Status value={c.active ? 'Active' : 'Inactive'} /><span className="order-controls"><button onClick={() => order(id, -1)} disabled={i === 0} aria-label="Move up">↑</button><button onClick={() => order(id, 1)} disabled={i === data.content.categoryOrder.length - 1} aria-label="Move down">↓</button></span></div> })}</section></> }
export function Profile() {
  const { user, refreshUser, logout, isLoggingOut } = useAuth();
  const router = useRouter();
  const [name, N] = useState(user?.name || 'Super Admin');
  const [editing, S] = useState(false);
  const [notice, M] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Sync state if user changes
  useEffect(() => {
    if (user?.name) N(user.name);
  }, [user]);

  const initials = (user?.name || name || 'RK')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const handleLogout = async () => {
    if (isLoggingOut) return;
    try {
      await logout();
      router.push('/admin/login');
    } catch (err: any) {
      setError(err?.message || 'Logout failed');
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    M('');

    try {
      await authService.updateAdminProfile({ name: name.trim() });
      await refreshUser();
      S(false);
      M('Profile details updated successfully.');
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message || 'Failed to update profile');
      } else {
        setError(err?.message || 'An error occurred while updating profile');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Heading
        title="Admin profile"
        desc="Manage your personal details and account information."
        action={
          <div style={{ display: 'flex', gap: '8px' }}>
            {!editing && (
              <button className="secondary-button" onClick={() => { setError(''); M(''); S(true); }}>
                <Pencil size={15} /> Edit profile
              </button>
            )}
            <button className="secondary-button" onClick={handleLogout} disabled={isLoggingOut}>
              <LogOut size={15} /> {isLoggingOut ? 'Logging out...' : 'Log out'}
            </button>
          </div>
        }
      />
      {notice && <div className="notice"><Check size={15} />{notice}</div>}
      {error && <div className="form-error" role="alert" style={{ marginBottom: 16 }}>{error}</div>}
      <section className="panel profile-main">
        <div className="profile-hero">
          <span className="profile-avatar">{initials}</span>
          <span>
            <div className="eyebrow">{user?.role === 'admin' ? 'OWNER · ADMINISTRATOR' : 'ADMINISTRATOR'}</div>
            <h2>{user?.name || name}</h2>
            <p>{user?.email || 'admin@rktiles.com'}</p>
          </span>
          <span className="verified-tag"><ShieldCheck size={15} /> Admin account</span>
        </div>
        <div className="profile-details">
          <div><small>ADMIN ID</small><strong>{user?._id ? `RK-ADM-${user._id.slice(-4).toUpperCase()}` : 'RK-ADM-001'}</strong></div>
          <div><small>FULL NAME</small><strong>{user?.name || name}</strong></div>
          <div><small>EMAIL ADDRESS</small><strong>{user?.email || 'admin@rktiles.com'}</strong></div>
          <div><small>ROLE</small><strong>{user?.role === 'admin' ? 'Owner · Administrator' : 'Administrator'}</strong></div>
          <div><small>ACCOUNT STATUS</small><Status value={user?.accountStatus ? user.accountStatus.charAt(0).toUpperCase() + user.accountStatus.slice(1) : (user?.isActive ? 'Active' : 'Inactive')} /></div>
          <div><small>AUTHENTICATION</small><strong>HttpOnly Cookie (JWT)</strong></div>
        </div>
      </section>
      {editing && (
        <section className="panel profile-edit">
          <h2>Edit personal details</h2>
          <form className="admin-form" onSubmit={handleSave}>
            <label>Full name<input value={name} onChange={e => N(e.target.value)} required disabled={saving} /></label>
            <label>Email address<input type="email" value={user?.email || 'admin@rktiles.com'} disabled title="Email address cannot be changed" style={{ opacity: 0.7, cursor: 'not-allowed' }} /></label>
            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => S(false)} disabled={saving}>Cancel</button>
              <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
            </div>
          </form>
        </section>
      )}
    </>
  );
}
