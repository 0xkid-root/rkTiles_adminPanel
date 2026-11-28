'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  BadgeCheck,
  Check,
  ChevronLeft,
  PauseCircle,
  Pencil,
  PlayCircle,
  Trash2,
  X,
} from 'lucide-react';
import { PageHeading } from '@/components/admin/layout/page-heading';
import { Modal } from '@/components/admin/admin-extras';
import { ApiError } from '@/lib/http';
import { dealerService, type Dealer } from '@/services/dealers';
import { DealerActionModal, type DealerAction } from './dealer-action-modal';
import { EditDealerForm } from './edit-dealer-form';
import {
  DEALERS_QUERY_KEY,
  DealerStatusBadge,
  actorEmail,
  actorName,
  dealerDisplayName,
  dealerInitial,
  formatDealerDate,
  formatDealerDateTime,
  nullable,
} from './dealer-shared';

export function DealerDetailView({ id }: { id: string }) {
  const router = useRouter();
  const [action, setAction] = useState<DealerAction | null>(null);
  const [editing, setEditing] = useState(false);

  const detailQuery = useQuery({
    queryKey: [...DEALERS_QUERY_KEY, 'detail', id],
    queryFn: () => dealerService.getDealer(id),
    enabled: Boolean(id),
  });

  const dealer = detailQuery.data?.data;

  if (detailQuery.isLoading) {
    return (
      <>
        <Link href="/admin/dealers" className="back-link">
          <ChevronLeft size={16} /> All dealers
        </Link>
        <section className="panel content-panel empty-state" style={{ padding: 40 }}>
          Loading dealer…
        </section>
      </>
    );
  }

  if (detailQuery.isError || !dealer) {
    const notFound = detailQuery.error instanceof ApiError && detailQuery.error.status === 404;
    const message = notFound
      ? 'This dealer record may have been removed.'
      : detailQuery.error instanceof ApiError
        ? detailQuery.error.message
        : 'Could not load dealer details.';
    return (
      <>
        <Link href="/admin/dealers" className="back-link">
          <ChevronLeft size={16} /> All dealers
        </Link>
        <PageHeading eyebrow="RK TILES ADMIN" title={notFound ? 'Dealer not found' : 'Dealer unavailable'} description={message} />
        {!notFound && (
          <div className="form-error" role="alert" style={{ marginBottom: 16 }}>
            {message}{' '}
            <button type="button" className="secondary-button compact" onClick={() => detailQuery.refetch()}>
              Retry
            </button>
          </div>
        )}
        <Link className="text-link" href="/admin/dealers">
          Back to dealers
        </Link>
      </>
    );
  }

  return <DealerDetailContent dealer={dealer} id={id} action={action} setAction={setAction} editing={editing} setEditing={setEditing} onDeleted={() => router.push('/admin/dealers')} />;
}

function DealerDetailContent({
  dealer,
  id,
  action,
  setAction,
  editing,
  setEditing,
  onDeleted,
}: {
  dealer: Dealer;
  id: string;
  action: DealerAction | null;
  setAction: (action: DealerAction | null) => void;
  editing: boolean;
  setEditing: (editing: boolean) => void;
  onDeleted: () => void;
}) {
  const name = dealerDisplayName(dealer);
  const address = dealer.address ?? null;
  const isActive = dealer.isActive ?? (dealer.accountStatus ? dealer.accountStatus === 'active' : null);

  return (
    <>
      <Link href="/admin/dealers" className="back-link">
        <ChevronLeft size={16} /> All dealers
      </Link>

      <PageHeading
        eyebrow="RK TILES ADMIN"
        title={name}
        description={`${dealer.dealerId ? `${dealer.dealerId} · ` : ''}Registered ${formatDealerDate(dealer.createdAt)}`}
        action={
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <DealerStatusBadge status={dealer.approvalStatus} />
            <DealerStatusBadge status={dealer.accountStatus} />
            <DealerStatusBadge status={dealer.verificationStatus} />
          </div>
        }
      />

      <div className="dealer-actions" style={{ borderTop: 0, paddingTop: 0, marginBottom: 15, flexWrap: 'wrap' }}>
        <button type="button" className="secondary-button" onClick={() => setEditing(true)}>
          <Pencil size={15} /> Edit dealer
        </button>
        {dealer.approvalStatus !== 'approved' && (
          <button type="button" className="primary-button" onClick={() => setAction({ type: 'approval', status: 'approved' })}>
            <Check size={15} /> Approve dealer
          </button>
        )}
        {dealer.approvalStatus !== 'rejected' && (
          <button type="button" className="secondary-button" onClick={() => setAction({ type: 'approval', status: 'rejected' })}>
            <X size={15} /> Reject
          </button>
        )}
        {dealer.accountStatus === 'suspended' ? (
          <button type="button" className="secondary-button" onClick={() => setAction({ type: 'account-status', status: 'active' })}>
            <PlayCircle size={15} /> Activate account
          </button>
        ) : (
          <button type="button" className="secondary-button" onClick={() => setAction({ type: 'account-status', status: 'suspended' })}>
            <PauseCircle size={15} /> Suspend account
          </button>
        )}
        <button type="button" className="secondary-button" onClick={() => setAction({ type: 'verification' })}>
          <BadgeCheck size={15} /> Verification
        </button>
        <button type="button" className="secondary-button" onClick={() => setAction({ type: 'delete' })}>
          <Trash2 size={15} /> Delete dealer
        </button>
      </div>

      <div className="dealer-detail-grid">
        <section className="panel detail-panel">
          <h2>Business profile</h2>
          <div className="profile-card-head">
            <span className="dealer-avatar-large">{dealerInitial(dealer)}</span>
            <span>
              <b>{name}</b>
              <small>
                {nullable(dealer.ownerName)} · {nullable(dealer.dealerId)}
              </small>
            </span>
          </div>
          <div className="detail-grid dealer-fields">
            <Field label="Email" value={nullable(dealer.email)} />
            <Field label="Mobile" value={nullable(dealer.mobile)} />
            <Field label="Alternate mobile" value={nullable(dealer.alternateMobile)} />
            <Field label="Owner name" value={nullable(dealer.ownerName)} />
            <Field label="Business type" value={nullable(dealer.businessType)} />
            <Field label="GST number" value={nullable(dealer.gstNumber)} />
            <Field label="Role" value={nullable(dealer.role)} />
            <Field label="Name" value={nullable(dealer.name)} />
          </div>

          <h3 className="subsection-title">ADDRESS</h3>
          <div className="detail-grid dealer-fields">
            <Field label="Street" value={nullable(address?.street)} />
            <Field label="City" value={nullable(address?.city)} />
            <Field label="State" value={nullable(address?.state)} />
            <Field label="PIN code" value={nullable(address?.pincode)} />
            <Field label="Country" value={nullable(address?.country)} />
          </div>
        </section>

        <section className="panel detail-panel">
          <h2>Status &amp; approval</h2>
          <p className="muted" style={{ fontSize: 9, color: '#92938b', margin: '5px 0 0' }}>
            Approval, account status and verification are independent.
          </p>

          <div className="detail-grid dealer-fields">
            <span>
              Approval
              <span style={{ marginTop: 5, display: 'block' }}>
                <DealerStatusBadge status={dealer.approvalStatus} />
              </span>
            </span>
            <span>
              Account
              <span style={{ marginTop: 5, display: 'block' }}>
                <DealerStatusBadge status={dealer.accountStatus} />
              </span>
            </span>
            <span>
              Verification
              <span style={{ marginTop: 5, display: 'block' }}>
                <DealerStatusBadge status={dealer.verificationStatus} />
              </span>
            </span>
            <Field label="Account active" value={isActive === null ? null : isActive ? 'Yes' : 'No'} />
          </div>

          <h3 className="subsection-title">VERIFICATION REMARKS</h3>
          <p style={{ fontSize: 11, color: '#5c6058', margin: 0, whiteSpace: 'pre-wrap' }}>
            {nullable(dealer.verificationRemarks, 'No remarks')}
          </p>

          <h3 className="subsection-title">APPROVAL HISTORY</h3>
          <div className="detail-grid dealer-fields">
            <Field label="Approved by" value={actorName(dealer.approvedBy)} sub={actorEmail(dealer.approvedBy) ?? undefined} />
            <Field label="Approved at" value={formatDealerDateTime(dealer.approvedAt)} />
            <Field label="Rejected by" value={actorName(dealer.rejectedBy)} sub={actorEmail(dealer.rejectedBy) ?? undefined} />
            <Field label="Rejected at" value={formatDealerDateTime(dealer.rejectedAt)} />
          </div>

          <h3 className="subsection-title">ACTIVITY</h3>
          <div className="detail-grid dealer-fields">
            <Field label="Dealer ID" value={nullable(dealer.dealerId)} />
            <Field label="Last login" value={formatDealerDateTime(dealer.lastLoginAt)} />
            <Field label="Registered" value={formatDealerDateTime(dealer.createdAt)} />
            <Field label="Last updated" value={formatDealerDateTime(dealer.updatedAt)} />
          </div>
        </section>
      </div>

      {editing && (
        <Modal title="Edit dealer" onClose={() => setEditing(false)} wide>
          <EditDealerForm dealer={dealer} onCancel={() => setEditing(false)} onSaved={() => setEditing(false)} />
        </Modal>
      )}

      {action && (
        <DealerActionModal
          dealer={dealer}
          action={action}
          onClose={() => setAction(null)}
          onDeleted={onDeleted}
        />
      )}
    </>
  );
}

function Field({ label, value, sub }: { label: string; value: string | null | undefined; sub?: string }) {
  return (
    <span>
      {label}
      <strong>{nullable(value)}</strong>
      {sub && <small className="cell-sub">{sub}</small>}
    </span>
  );
}
