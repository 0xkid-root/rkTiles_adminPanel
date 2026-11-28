'use client';

import React from 'react';
import type {
  AccountStatus,
  ApprovalStatus,
  Dealer,
  DealerAdminActor,
  VerificationStatus,
} from '@/services/dealers';

/** Query key root for all dealer queries (list + detail). */
export const DEALERS_QUERY_KEY = ['dealers'] as const;

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;
export const SEARCH_DEBOUNCE_MS = 350;

/* ------------------------------ formatting ------------------------------ */

export const EMPTY = '—';

/** Render nullable/optional values gracefully. */
export function nullable(value: string | number | null | undefined, fallback: string = EMPTY): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string' && value.trim() === '') return fallback;
  return String(value);
}

/** Title-case a snake/lowercase enum value for display. */
export function labelize(value: string | null | undefined, fallback: string = EMPTY): string {
  if (!value) return fallback;
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function formatDealerDate(value: string | null | undefined, fallback: string = EMPTY): string {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDealerDateTime(value: string | null | undefined, fallback: string = EMPTY): string {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Display name for a populated approvedBy/rejectedBy actor. */
export function actorName(actor: DealerAdminActor | undefined, fallback: string = EMPTY): string {
  if (!actor) return fallback;
  if (typeof actor === 'string') return actor || fallback;
  return actor.name || actor.email || actor._id || fallback;
}

/** Extra detail (email) for a populated actor, if any. */
export function actorEmail(actor: DealerAdminActor | undefined): string | null {
  if (!actor || typeof actor === 'string') return null;
  return actor.email || null;
}

/** Dealer display name with graceful fallbacks. */
export function dealerDisplayName(dealer: Dealer): string {
  return dealer.businessName || dealer.ownerName || dealer.name || dealer.email || 'Unnamed dealer';
}

export function dealerInitial(dealer: Dealer): string {
  const name = dealerDisplayName(dealer);
  return name.trim().charAt(0).toUpperCase() || 'D';
}

/** Join address parts, skipping missing values. */
export function formatAddress(address: Dealer['address'], fallback: string = EMPTY): string {
  if (!address) return fallback;
  const parts = [address.street, address.city, address.state, address.pincode, address.country].filter(
    (part): part is string => typeof part === 'string' && part.trim() !== ''
  );
  return parts.length ? parts.join(', ') : fallback;
}

/* ------------------------------ status badge ------------------------------ */

type BadgeTone = 'positive' | 'warning' | 'negative' | 'neutral';

const STATUS_TONES: Record<string, BadgeTone> = {
  // approval
  approved: 'positive',
  pending: 'warning',
  rejected: 'negative',
  // account
  active: 'positive',
  suspended: 'negative',
  // verification
  verified: 'positive',
  unverified: 'neutral',
};

export function DealerStatusBadge({ status }: { status: string | null | undefined }) {
  const key = (status || '').toLowerCase();
  const tone: BadgeTone = STATUS_TONES[key] ?? 'neutral';
  return (
    <span className={`status ${tone}`}>
      <i />
      {labelize(status, 'Unknown')}
    </span>
  );
}

/* ------------------------------ status helpers ------------------------------ */

export function approvalLabel(status: ApprovalStatus | string | null | undefined): string {
  return labelize(status, 'Pending');
}

export function accountStatusLabel(status: AccountStatus | string | null | undefined): string {
  return labelize(status, 'Unknown');
}

export function verificationLabel(status: VerificationStatus | string | null | undefined): string {
  return labelize(status, 'Unverified');
}
