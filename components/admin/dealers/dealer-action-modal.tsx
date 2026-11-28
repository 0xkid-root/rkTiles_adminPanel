'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Check, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/admin/admin-extras';
import { ApiError } from '@/lib/http';
import {
  dealerService,
  VERIFICATION_STATUSES,
  type AccountStatus,
  type Dealer,
  type DealerApprovalStatus,
  type VerificationStatus,
} from '@/services/dealers';
import { DEALERS_QUERY_KEY, dealerDisplayName, verificationLabel } from './dealer-shared';

export type DealerAction =
  | { type: 'approval'; status: DealerApprovalStatus }
  | { type: 'account-status'; status: AccountStatus }
  | { type: 'verification'; status?: VerificationStatus }
  | { type: 'delete' };

interface DealerActionModalProps {
  dealer: Dealer;
  action: DealerAction;
  onClose: () => void;
  onSuccess?: (message?: string) => void;
  /** Called after a successful delete (e.g. navigate back to the list). */
  onDeleted?: () => void;
}

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message || fallback;
  if (err instanceof Error) return err.message || fallback;
  return fallback;
}

export function DealerActionModal({ dealer, action, onClose, onSuccess, onDeleted }: DealerActionModalProps) {
  const queryClient = useQueryClient();
  const [remarks, setRemarks] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>(
    action.type === 'verification'
      ? action.status ?? dealer.verificationStatus ?? 'unverified'
      : 'unverified'
  );
  const [formError, setFormError] = useState('');

  const name = dealerDisplayName(dealer);

  const mutation = useMutation({
    mutationFn: async () => {
      const trimmedRemarks = remarks.trim();
      const remarksPayload = trimmedRemarks ? { remarks: trimmedRemarks } : {};

      switch (action.type) {
        case 'approval':
          return dealerService.updateDealerApproval(dealer._id, {
            status: action.status,
            ...remarksPayload,
          });
        case 'account-status':
          return dealerService.updateDealerAccountStatus(dealer._id, {
            status: action.status,
            ...remarksPayload,
          });
        case 'verification':
          return dealerService.updateDealerVerification(dealer._id, {
            status: verificationStatus,
            ...remarksPayload,
          });
        case 'delete':
          return dealerService.deleteDealer(dealer._id);
      }
    },
    onSuccess: async (res) => {
      const message = (res as { message?: string } | null)?.message || defaultSuccessMessage(action);
      toast.success(message);
      onSuccess?.(message);

      if (action.type === 'delete') {
        // Navigate away first so the detail query unmounts; then refresh only the list.
        onDeleted?.();
        queryClient.invalidateQueries({ queryKey: [...DEALERS_QUERY_KEY, 'list'] });
      } else {
        // Refresh the affected dealer data (list + detail).
        queryClient.invalidateQueries({ queryKey: DEALERS_QUERY_KEY });
      }
      onClose();
    },
    onError: (err) => {
      const message = errorMessage(err, defaultErrorMessage(action));
      setFormError(message);
      toast.error(message);
    },
  });

  const pending = mutation.isPending;

  return (
    <Modal title={modalTitle(action)} onClose={() => !pending && onClose()}>
      <div className="admin-form">
        <p className="muted" style={{ fontSize: 11, color: '#5e6259', margin: 0 }}>
          <strong>{name}</strong>
          {dealer.dealerId ? ` · ${dealer.dealerId}` : ''}
        </p>

        {action.type === 'approval' && action.status === 'approved' && (
          <p style={{ fontSize: 11, color: '#5e6259', margin: 0 }}>
            Approve this dealer for the RK Tiles dealer network? Approval status becomes <b>approved</b> and any
            previous rejection is cleared.
          </p>
        )}
        {action.type === 'approval' && action.status === 'rejected' && (
          <p style={{ fontSize: 11, color: '#5e6259', margin: 0 }}>
            Reject this dealer application? Approval status becomes <b>rejected</b>. You can provide a reason below.
          </p>
        )}
        {action.type === 'account-status' && action.status === 'active' && (
          <p style={{ fontSize: 11, color: '#5e6259', margin: 0 }}>
            Activate this dealer account? Account status becomes <b>active</b> and the dealer can sign in.
          </p>
        )}
        {action.type === 'account-status' && action.status === 'suspended' && (
          <p style={{ fontSize: 11, color: '#5e6259', margin: 0 }}>
            Suspend this dealer account? Account status becomes <b>suspended</b> and the dealer is deactivated.
          </p>
        )}
        {action.type === 'verification' && (
          <p style={{ fontSize: 11, color: '#5e6259', margin: 0 }}>
            Update verification progress. This does <b>not</b> change approval status or account status.
          </p>
        )}

        {action.type === 'verification' && (
          <label>
            Verification status
            <select
              value={verificationStatus}
              disabled={pending}
              onChange={(event) => setVerificationStatus(event.target.value as VerificationStatus)}
            >
              {VERIFICATION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {verificationLabel(status)}
                </option>
              ))}
            </select>
          </label>
        )}

        {action.type !== 'delete' && (
          <label>
            Remarks (optional)
            <textarea
              value={remarks}
              rows={3}
              disabled={pending}
              placeholder={remarksPlaceholder(action)}
              onChange={(event) => setRemarks(event.target.value)}
            />
          </label>
        )}

        {action.type === 'delete' && (
          <div className="form-error" role="alert" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <AlertTriangle size={14} style={{ flex: 'none', marginTop: 1 }} />
            <span>
              Deleting <b>{name}</b> is permanent. It will also remove their associated cart. This cannot be undone.
            </span>
          </div>
        )}

        {formError && (
          <div className="form-error" role="alert">
            {formError}
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose} disabled={pending}>
            Cancel
          </button>
          <button
            type="button"
            className="primary-button"
            disabled={pending}
            onClick={() => {
              setFormError('');
              mutation.mutate();
            }}
          >
            {action.type === 'delete' ? <Trash2 size={14} /> : <Check size={14} />}
            {pending ? 'Please wait…' : confirmLabel(action)}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function modalTitle(action: DealerAction): string {
  switch (action.type) {
    case 'approval':
      return action.status === 'approved' ? 'Approve dealer?' : 'Reject dealer?';
    case 'account-status':
      return action.status === 'active' ? 'Activate dealer account?' : 'Suspend dealer account?';
    case 'verification':
      return 'Update verification';
    case 'delete':
      return 'Delete dealer?';
  }
}

function confirmLabel(action: DealerAction): string {
  switch (action.type) {
    case 'approval':
      return action.status === 'approved' ? 'Approve dealer' : 'Reject dealer';
    case 'account-status':
      return action.status === 'active' ? 'Activate' : 'Suspend';
    case 'verification':
      return 'Save verification';
    case 'delete':
      return 'Delete dealer';
  }
}

function remarksPlaceholder(action: DealerAction): string {
  switch (action.type) {
    case 'approval':
      return action.status === 'approved'
        ? 'e.g. Documents verified, application approved.'
        : 'e.g. Please submit valid business documents.';
    case 'account-status':
      return action.status === 'active' ? 'e.g. Dealer account activated.' : 'e.g. Account suspended after admin review.';
    case 'verification':
      return 'e.g. Business details and documents verified.';
    default:
      return '';
  }
}

function defaultSuccessMessage(action: DealerAction): string {
  switch (action.type) {
    case 'approval':
      return action.status === 'approved' ? 'Dealer approved successfully' : 'Dealer rejected successfully';
    case 'account-status':
      return `Dealer status updated to ${action.status}`;
    case 'verification':
      return 'Dealer verification updated successfully';
    case 'delete':
      return 'Dealer deleted successfully';
  }
}

function defaultErrorMessage(action: DealerAction): string {
  switch (action.type) {
    case 'approval':
      return action.status === 'approved' ? 'Could not approve dealer' : 'Could not reject dealer';
    case 'account-status':
      return 'Could not update account status';
    case 'verification':
      return 'Could not update verification';
    case 'delete':
      return 'Could not delete dealer';
  }
}
