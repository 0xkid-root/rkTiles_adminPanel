'use client'
import { useState, useEffect, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Activity, AlertTriangle, ArrowUpRight, Check, ChevronLeft, ChevronRight, ClipboardList, Globe2, Image as ImageIcon, LogOut, Pencil, Plus, Search, ShieldCheck, SlidersHorizontal, Trash2, UserRound, X, Warehouse, Users, Package, Tag } from 'lucide-react'
import { useAdminStore, type Dealer, type Product, type State } from '@/lib/admin/store'
import { useAuth } from '@/lib/auth'
import { authService } from '@/services/auth'
import { ApiError } from '@/lib/http'
const money = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
const date = (s: string) => new Date(`${s}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
function Heading({ title, desc, action }: { title: string; desc: string; action?: React.ReactNode }) { return <div className="page-heading"><div><div className="eyebrow">RK TILES ADMIN</div><h1>{title}</h1><p>{desc}</p></div>{action}</div> }
export function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) { return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}><section className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="modal-title"><header><h2 id="modal-title">{title}</h2><button aria-label="Close dialog" onClick={onClose}><X size={18} /></button></header>{children}</section></div> }
function Status({ value }: { value: string }) { let c = ['Approved', 'In stock', 'Active', 'Published'].includes(value) ? 'positive' : ['Pending', 'Low stock'].includes(value) ? 'warning' : ['Rejected', 'Out of stock', 'Inactive', 'Unpublished'].includes(value) ? 'negative' : 'neutral'; return <span className={`status ${c}`}><i />{value}</span> }
function Photo({ p }: { p: Product }) { return <img className="product-photo" src={p.image} alt={p.name} /> }
export function Inventory({ data, update }: { data: State; update: (fn: (s: State) => State) => void }) { const [q, Q] = useState(''), [item, I] = useState<Product | null>(null), [history, H] = useState(false), [msg, M] = useState(''); const total = data.products.reduce((n, p) => n + p.stock, 0); const low = data.products.filter(p => p.stock > 0 && p.stock <= p.threshold).length; const rows = data.products.filter(p => `${p.name} ${p.sku}`.toLowerCase().includes(q.toLowerCase())); function save(e: FormEvent<HTMLFormElement>) { e.preventDefault(); if (!item) return; const f = new FormData(e.currentTarget), type = String(f.get('type')), qty = Number(f.get('quantity')); const value = type === 'Add' ? item.stock + qty : type === 'Reduce' ? item.stock - qty : qty; if (qty < 0 || value < 0) { M('Stock cannot become negative. Reduce the adjustment quantity.'); return } update(s => ({ ...s, products: s.products.map(p => p.id === item.id ? { ...p, stock: value, updated: new Date().toISOString().slice(0, 10) } : p), adjustments: [{ id: `adj-${Date.now()}`, product: item.name, type, quantity: qty, reason: String(f.get('reason')), date: new Date().toISOString().slice(0, 10) }, ...s.adjustments] })); I(null); M('Inventory updated successfully.') } return <><Heading title="Inventory / Stock" desc="Manage central stock levels and adjustment history." /><div className="stats-grid inventory-stats">{[['Total stock quantity', total.toLocaleString(), 'Central inventory units', Warehouse], ['In-stock products', data.products.filter(p => p.stock > p.threshold).length, 'Above stock threshold', Package], ['Low-stock products', low, 'At or below threshold', AlertTriangle], ['Out of stock', data.products.filter(p => !p.stock).length, 'Needs replenishment', SlidersHorizontal]].map(([a, b, c, Icon]: any) => <article className="stat-card" key={a}><div className="stat-top"><span>{a}</span><span className="stat-icon sand"><Icon size={17} /></span></div><strong className="stat-value">{b}</strong><span className="stat-detail">{c}</span></article>)}</div>{msg && <div className="notice">{msg}<button onClick={() => M('')}><X size={15} /></button></div>}<section className="panel content-panel"><div className="inventory-tabs"><button className={!history ? 'selected' : ''} onClick={() => H(false)}>Stock overview</button><button className={history ? 'selected' : ''} onClick={() => H(true)}>Adjustment history · {data.adjustments.length}</button></div>{!history ? <><div className="list-toolbar"><strong>Product stock levels</strong><label className="inline-search"><Search size={15} /><input value={q} onChange={e => Q(e.target.value)} placeholder="Search product or SKU" /></label></div><div className="table-scroll"><table><thead><tr><th>PRODUCT</th><th>CATEGORY</th><th>CURRENT STOCK</th><th>THRESHOLD</th><th>STATUS</th><th>UPDATED</th><th /></tr></thead><tbody>{rows.map(p => <tr key={p.id}><td><div className="product-cell"><Photo p={p} /><span><strong>{p.name}</strong><small>{p.sku}</small></span></div></td><td>{data.categories.find(c => c.id === p.categoryId)?.name}</td><td><b>{p.stock}</b> units</td><td>{p.threshold} units</td><td><Status value={!p.stock ? 'Out of stock' : p.stock <= p.threshold ? 'Low stock' : 'In stock'} /></td><td>{date(p.updated)}</td><td><button className="secondary-button compact" onClick={() => I(p)}>Adjust</button></td></tr>)}</tbody></table></div></> : <div className="table-scroll"><table><thead><tr><th>DATE</th><th>PRODUCT</th><th>TYPE</th><th>QUANTITY</th><th>REASON</th></tr></thead><tbody>{data.adjustments.map(a => <tr key={a.id}><td>{date(a.date)}</td><td>{a.product}</td><td>{a.type}</td><td>{a.quantity}</td><td>{a.reason}</td></tr>)}</tbody></table></div>}</section><p className="inventory-note"><Activity size={15} /> Dealer cart activity does not reduce central inventory.</p>{item && <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && I(null)}><section className="modal"><header><h2>Adjust stock</h2><button onClick={() => I(null)}><X size={18} /></button></header><form className="admin-form" onSubmit={save}><div className="adjust-product"><Photo p={item} /><span><b>{item.name}</b><small>{item.sku} · Current: {item.stock}</small></span></div><label>Adjustment type<select name="type"><option>Add</option><option>Reduce</option><option>Set Stock</option></select></label><label>Quantity<input type="number" name="quantity" min="0" required /></label><label>Reason / notes<textarea name="reason" required rows={3} /></label><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => I(null)}>Cancel</button><button className="primary-button">Apply adjustment</button></div></form></section></div>}</> }
export function Dealers({ data, update }: { data: State; update: (fn: (s: State) => State) => void }) { const [q, Q] = useState(''), [filter, F] = useState('All statuses'), [approveDealer, A] = useState<Dealer | null>(null), [message, M] = useState(''); const rows = data.dealers.filter(d => `${d.business} ${d.owner} ${d.id} ${d.email} ${d.city}`.toLowerCase().includes(q.toLowerCase()) && (filter === 'All statuses' || filter === d.status)); const change = (id: string, status: Dealer['status']) => update(s => ({ ...s, dealers: s.dealers.map(d => d.id === id ? { ...d, status } : d) })); const confirmApproval = () => { if (!approveDealer) return; change(approveDealer.id, 'Approved'); M(`${approveDealer.business} has been approved as a dealer.`); A(null) }; return <><Heading title="Dealers" desc="Review applications and manage your registered dealer network." />{message && <div className="notice" role="status"><Check size={15} />{message}<button aria-label="Dismiss message" onClick={() => M('')}><X size={14} /></button></div>}<section className="panel content-panel"><div className="list-toolbar"><label className="inline-search wide-search"><Search size={15} /><input value={q} onChange={e => Q(e.target.value)} placeholder="Search business, owner or dealer ID" /></label><select value={filter} onChange={e => F(e.target.value)}>{['All statuses', 'Pending', 'Approved', 'Rejected', 'Suspended'].map(x => <option key={x}>{x}</option>)}</select></div><div className="table-scroll"><table><thead><tr><th>BUSINESS</th><th>DEALER ID</th><th>OWNER</th><th>CONTACT</th><th>CITY</th><th>REGISTERED</th><th>STATUS</th><th>ACTION</th></tr></thead><tbody>{rows.map(d => <tr key={d.id}><td><Link href={`/admin/dealers/${d.id}`} className="table-business">{d.business} <ChevronRight size={14} /></Link></td><td>{d.id}</td><td>{d.owner}</td><td>{d.email}<small className="cell-sub">{d.mobile}</small></td><td>{d.city}</td><td>{date(d.registered)}</td><td><Status value={d.status} /></td><td>{d.status === 'Pending' ? <div className="row-actions"><button className="approve-btn" onClick={() => A(d)} aria-label={`Review approval for ${d.business}`}><Check size={15} /></button><button className="reject-btn" onClick={() => change(d.id, 'Rejected')} aria-label="Reject"><X size={15} /></button></div> : <button className="secondary-button compact" onClick={() => change(d.id, d.status === 'Approved' ? 'Suspended' : 'Approved')}>{d.status === 'Approved' ? 'Suspend' : 'Approve'}</button>}</td></tr>)}</tbody></table>{!rows.length && <div className="empty-state">No dealers match this filter.</div>}</div></section>{approveDealer && <Modal title="Approve dealer application?" onClose={() => A(null)}><div className="admin-form"><p>Approve <strong>{approveDealer.business}</strong> for the RK Tiles dealer network? This will change their status to Approved.</p><div className="modal-actions"><button className="secondary-button" onClick={() => A(null)}>Cancel</button><button className="primary-button" onClick={confirmApproval}><Check size={15} /> Approve dealer</button></div></div></Modal>}</> }
export function DealerDetail({ data, update, id }: { data: State; update: (fn: (s: State) => State) => void; id: string }) { const d = data.dealers.find(x => x.id === id); if (!d) return <><Heading title="Dealer not found" desc="This dealer record may have been removed." /><Link className="text-link" href="/admin/dealers">Back to dealers</Link></>; const products = d.cart.map(c => ({ ...c, p: data.products.find(p => p.id === c.productId) })).filter(x => x.p); const qty = products.reduce((s, x) => s + x.quantity, 0); const groups = Object.values(products.reduce((o: any, x) => { const name = data.categories.find(c => c.id === x.p?.categoryId)?.name || 'Other'; o[name] ??= { name, count: 0, qty: 0 }; o[name].count++; o[name].qty += x.quantity; return o }, {})); const status = (v: Dealer['status']) => update(s => ({ ...s, dealers: s.dealers.map(x => x.id === id ? { ...x, status: v } : x) })); return <><Link href="/admin/dealers" className="back-link"><ChevronLeft size={16} /> All dealers</Link><Heading title={d.business} desc={`${d.id} · Registered ${date(d.registered)}`} action={<Status value={d.status} />} /><div className="dealer-detail-grid"><section className="panel detail-panel"><h2>Business profile</h2><div className="profile-card-head"><span className="dealer-avatar-large">{d.business[0]}</span><span><b>{d.business}</b><small>{d.owner} · {d.id}</small></span></div><div className="detail-grid dealer-fields">{[['Email', d.email], ['Mobile', d.mobile], ['Business type', 'Tile & surfaces retailer'], ['GST number', d.gst], ['Address', d.address], ['City / State', `${d.city}, ${d.state}`], ['PIN code', '380 009'], ['Country', 'India']].map(([a, b]) => <span key={a}>{a}<strong>{b}</strong></span>)}</div><div className="dealer-actions">{d.status === 'Pending' && <><button className="primary-button" onClick={() => status('Approved')}><Check size={15} /> Approve dealer</button><button className="secondary-button" onClick={() => status('Rejected')}>Reject</button></>}{d.status === 'Approved' && <button className="secondary-button" onClick={() => status('Suspended')}>Suspend account</button>}</div></section><section className="panel detail-panel"><h2>Current cart activity</h2><p className="muted">Product interest only · not an order</p><div className="cart-summary-cards"><div><strong>{products.length}</strong><small>Unique products</small></div><div><strong>{qty}</strong><small>Total quantity</small></div><div><strong>{groups.length}</strong><small>Categories</small></div></div><h3 className="subsection-title">Category breakdown</h3>{groups.map((g: any) => <div className="category-break-row" key={g.name}><span>{g.name}</span><strong>{g.count} products · {g.qty} qty</strong></div>)}<h3 className="subsection-title">Cart products</h3>{products.map(x => <div className="cart-product-row" key={x.p!.id}><Photo p={x.p!} /><span><b>{x.p!.name}</b><small>{x.p!.sku} · {data.categories.find(c => c.id === x.p!.categoryId)?.name}</small></span><b>× {x.quantity}</b></div>)}{!products.length && <div className="empty-inline">No current cart items.</div>}</section></div></> }
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
