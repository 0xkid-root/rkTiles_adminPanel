'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  BadgeCheck,
  Check,
  ChevronRight,
  CircleSlash,
  PauseCircle,
  PlayCircle,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { PageHeading } from '@/components/admin/layout/page-heading';
import { ApiError } from '@/lib/http';
import {
  dealerService,
  ACCOUNT_STATUSES,
  APPROVAL_STATUSES,
  VERIFICATION_STATUSES,
  type AccountStatus,
  type ApprovalStatus,
  type Dealer,
  type DealerSort,
  type VerificationStatus,
} from '@/services/dealers';
import { DealerActionModal, type DealerAction } from './dealer-action-modal';
import {
  DEALERS_QUERY_KEY,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  SEARCH_DEBOUNCE_MS,
  DealerStatusBadge,
  dealerDisplayName,
  formatDealerDate,
  labelize,
  nullable,
} from './dealer-shared';

const COLUMN_COUNT = 10;

export function DealersView() {
  // Search + filters (preserved across pagination)
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [city, setCity] = useState('');
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus | ''>('');
  const [accountStatus, setAccountStatus] = useState<AccountStatus | ''>('');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | ''>('');
  const [sort, setSort] = useState<DealerSort | ''>('');

  // Pagination (backend-driven)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);

  // Row action confirmation
  const [pendingAction, setPendingAction] = useState<{ dealer: Dealer; action: DealerAction } | null>(null);

  // Debounce search + city; reset to first page when they change.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setCity(cityInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput, cityInput]);

  const queryParams = {
    page,
    limit,
    search: search || undefined,
    approvalStatus: approvalStatus || undefined,
    accountStatus: accountStatus || undefined,
    verificationStatus: verificationStatus || undefined,
    city: city || undefined,
    sort: sort || undefined,
  };

  const listQuery = useQuery({
    queryKey: [...DEALERS_QUERY_KEY, 'list', queryParams],
    queryFn: () => dealerService.getDealers(queryParams),
    placeholderData: (previous) => previous,
  });

  const rows = listQuery.data?.data ?? [];
  const pagination = listQuery.data?.pagination;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const total = pagination?.total ?? 0;
  const isLoading = listQuery.isLoading;
  const hasFilters = Boolean(
    searchInput.trim() ||
      cityInput.trim() ||
      search ||
      city ||
      approvalStatus ||
      accountStatus ||
      verificationStatus ||
      sort
  );

  return (
    <>
      <PageHeading
        eyebrow="RK TILES ADMIN"
        title="Dealers"
        description="Review applications and manage your registered dealer network."
        action={
          <span className="status neutral" style={{ height: 30 }}>
            <i />
            {listQuery.isFetching ? 'Refreshing…' : `${total} dealer${total === 1 ? '' : 's'}`}
          </span>
        }
      />

      {listQuery.isError && (
        <div className="form-error" role="alert" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ flex: 1 }}>
            {listQuery.error instanceof ApiError ? listQuery.error.message : 'Could not load dealers.'}
          </span>
          <button type="button" className="secondary-button compact" onClick={() => listQuery.refetch()}>
            Retry
          </button>
        </div>
      )}

      <section className="panel content-panel">
        <div className="list-toolbar product-toolbar">
          <label className="inline-search wide-search">
            <Search size={15} />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search business, owner, email, dealer ID or mobile"
              aria-label="Search dealers"
            />
          </label>

          <select
            value={approvalStatus}
            aria-label="Filter by approval status"
            onChange={(event) => {
              setApprovalStatus(event.target.value as ApprovalStatus | '');
              setPage(1);
            }}
          >
            <option value="">All approvals</option>
            {APPROVAL_STATUSES.map((status) => (
              <option key={status} value={status}>
                {labelize(status)}
              </option>
            ))}
          </select>

          <select
            value={accountStatus}
            aria-label="Filter by account status"
            onChange={(event) => {
              setAccountStatus(event.target.value as AccountStatus | '');
              setPage(1);
            }}
          >
            <option value="">All accounts</option>
            {ACCOUNT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {labelize(status)}
              </option>
            ))}
          </select>

          <select
            value={verificationStatus}
            aria-label="Filter by verification status"
            onChange={(event) => {
              setVerificationStatus(event.target.value as VerificationStatus | '');
              setPage(1);
            }}
          >
            <option value="">All verification</option>
            {VERIFICATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {labelize(status)}
              </option>
            ))}
          </select>

          <label className="inline-search">
            <Search size={15} />
            <input
              value={cityInput}
              onChange={(event) => setCityInput(event.target.value)}
              placeholder="Filter city"
              aria-label="Filter by city"
            />
          </label>

          <select
            value={sort}
            aria-label="Sort dealers"
            onChange={(event) => {
              setSort(event.target.value as DealerSort | '');
              setPage(1);
            }}
          >
            <option value="">Newest first</option>
            <option value="businessName_asc">Business A–Z</option>
            <option value="businessName_desc">Business Z–A</option>
          </select>

          {hasFilters && (
            <button
              type="button"
              className="secondary-button compact"
              onClick={() => {
                setSearchInput('');
                setSearch('');
                setCityInput('');
                setCity('');
                setApprovalStatus('');
                setAccountStatus('');
                setVerificationStatus('');
                setSort('');
                setPage(1);
              }}
            >
              <CircleSlash size={13} /> Clear
            </button>
          )}
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>BUSINESS</th>
                <th>DEALER ID</th>
                <th>OWNER</th>
                <th>CONTACT</th>
                <th>CITY</th>
                <th>REGISTERED</th>
                <th>APPROVAL</th>
                <th>ACCOUNT</th>
                <th>VERIFICATION</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={COLUMN_COUNT} className="empty-state">
                    Loading dealers…
                  </td>
                </tr>
              ) : listQuery.isError ? (
                <tr>
                  <td colSpan={COLUMN_COUNT} className="empty-state">
                    Could not load dealers. Use Retry above.
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={COLUMN_COUNT} className="empty-state">
                    {hasFilters ? 'No dealers match this search or filter.' : 'No dealers found.'}
                  </td>
                </tr>
              ) : (
                rows.map((dealer) => (
                  <tr key={dealer._id}>
                    <td>
                      <Link href={`/admin/dealers/${dealer._id}`} className="table-business">
                        {dealerDisplayName(dealer)} <ChevronRight size={14} />
                      </Link>
                    </td>
                    <td>{nullable(dealer.dealerId)}</td>
                    <td>{nullable(dealer.ownerName ?? dealer.name)}</td>
                    <td>
                      {nullable(dealer.email)}
                      <small className="cell-sub">{nullable(dealer.mobile)}</small>
                    </td>
                    <td>{nullable(dealer.address?.city)}</td>
                    <td>{formatDealerDate(dealer.createdAt)}</td>
                    <td>
                      <DealerStatusBadge status={dealer.approvalStatus} />
                    </td>
                    <td>
                      <DealerStatusBadge status={dealer.accountStatus} />
                    </td>
                    <td>
                      <DealerStatusBadge status={dealer.verificationStatus} />
                    </td>
                    <td>
                      <div className="row-actions">
                        <Link
                          href={`/admin/dealers/${dealer._id}`}
                          className="secondary-button compact"
                          aria-label={`View ${dealerDisplayName(dealer)}`}
                        >
                          View
                        </Link>
                        {dealer.approvalStatus !== 'approved' && (
                          <button
                            type="button"
                            className="approve-btn"
                            title="Approve dealer"
                            aria-label={`Approve ${dealerDisplayName(dealer)}`}
                            onClick={() => setPendingAction({ dealer, action: { type: 'approval', status: 'approved' } })}
                          >
                            <Check size={15} />
                          </button>
                        )}
                        {dealer.approvalStatus !== 'rejected' && (
                          <button
                            type="button"
                            className="reject-btn"
                            title="Reject dealer"
                            aria-label={`Reject ${dealerDisplayName(dealer)}`}
                            onClick={() => setPendingAction({ dealer, action: { type: 'approval', status: 'rejected' } })}
                          >
                            <X size={15} />
                          </button>
                        )}
                        {dealer.accountStatus === 'suspended' ? (
                          <button
                            type="button"
                            className="secondary-button compact"
                            title="Activate account"
                            onClick={() =>
                              setPendingAction({ dealer, action: { type: 'account-status', status: 'active' } })
                            }
                          >
                            <PlayCircle size={14} /> Activate
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="secondary-button compact"
                            title="Suspend account"
                            onClick={() =>
                              setPendingAction({ dealer, action: { type: 'account-status', status: 'suspended' } })
                            }
                          >
                            <PauseCircle size={14} /> Suspend
                          </button>
                        )}
                        <button
                          type="button"
                          className="secondary-button compact"
                          title="Update verification"
                          onClick={() => setPendingAction({ dealer, action: { type: 'verification' } })}
                        >
                          <BadgeCheck size={14} /> Verify
                        </button>
                        <button
                          type="button"
                          className="reject-btn"
                          title="Delete dealer"
                          aria-label={`Delete ${dealerDisplayName(dealer)}`}
                          onClick={() => setPendingAction({ dealer, action: { type: 'delete' } })}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <strong>
            {pagination
              ? `${pagination.total} dealer${pagination.total === 1 ? '' : 's'} · page ${pagination.page} of ${totalPages}`
              : ' '}
          </strong>
          <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              Rows
              <select
                value={limit}
                aria-label="Rows per page"
                onChange={(event) => {
                  setLimit(Math.min(MAX_PAGE_SIZE, Math.max(1, Number(event.target.value) || DEFAULT_PAGE_SIZE)));
                  setPage(1);
                }}
              >
                {[10, 20, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="secondary-button compact"
              disabled={page <= 1 || isLoading || listQuery.isFetching}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Previous
            </button>
            <button
              type="button"
              className="secondary-button compact"
              disabled={page >= totalPages || isLoading || listQuery.isFetching}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </button>
          </span>
        </div>
      </section>

      <p className="inventory-note">
        <ShieldCheck size={14} /> Approval, account status and verification are independent. Deleting a dealer also
        removes their associated cart.
      </p>

      {pendingAction && (
        <DealerActionModal
          dealer={pendingAction.dealer}
          action={pendingAction.action}
          onClose={() => setPendingAction(null)}
        />
      )}
    </>
  );
}

export default DealersView;
