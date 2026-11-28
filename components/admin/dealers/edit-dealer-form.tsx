'use client';

import React, { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '@/lib/http';
import { dealerService, type Dealer, type DealerAddress, type UpdateDealerPayload } from '@/services/dealers';
import { DEALERS_QUERY_KEY } from './dealer-shared';

const ADDRESS_FIELDS = ['street', 'city', 'state', 'pincode', 'country'] as const;
type AddressField = (typeof ADDRESS_FIELDS)[number];

interface AddressForm {
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

interface FormState {
  businessName: string;
  ownerName: string;
  mobile: string;
  alternateMobile: string;
  gstNumber: string;
  businessType: string;
  address: AddressForm;
}

function toAddressForm(address: DealerAddress | null | undefined): AddressForm {
  return {
    street: address?.street ?? '',
    city: address?.city ?? '',
    state: address?.state ?? '',
    pincode: address?.pincode ?? '',
    country: address?.country ?? '',
  };
}

function toFormState(dealer: Dealer): FormState {
  return {
    businessName: dealer.businessName ?? '',
    ownerName: dealer.ownerName ?? '',
    mobile: dealer.mobile ?? '',
    alternateMobile: dealer.alternateMobile ?? '',
    gstNumber: dealer.gstNumber ?? '',
    businessType: dealer.businessType ?? '',
    address: toAddressForm(dealer.address),
  };
}

/**
 * Edit dealer profile form (PATCH /admin/dealers/:id).
 * Only sends fields the user actually edited; address fields are sent individually.
 */
export function EditDealerForm({
  dealer,
  onCancel,
  onSaved,
}: {
  dealer: Dealer;
  onCancel: () => void;
  onSaved?: (message?: string) => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(() => toFormState(dealer));
  const [original] = useState<FormState>(() => toFormState(dealer));
  const [formError, setFormError] = useState('');

  const setField = (field: keyof Omit<FormState, 'address'>, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const setAddressField = (field: AddressField, value: string) =>
    setForm((current) => ({ ...current, address: { ...current.address, [field]: value } }));

  const mutation = useMutation({
    mutationFn: (payload: UpdateDealerPayload) => dealerService.updateDealer(dealer._id, payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: DEALERS_QUERY_KEY });
      const message = res?.message || 'Dealer updated successfully';
      toast.success(message);
      onSaved?.(message);
    },
    onError: (err) => {
      const message = err instanceof ApiError ? err.message : 'Could not update dealer';
      setFormError(message);
      toast.error(message);
    },
  });

  const pending = mutation.isPending;

  function buildPayload(): UpdateDealerPayload {
    const payload: UpdateDealerPayload = {};
    const businessName = form.businessName.trim();
    const ownerName = form.ownerName.trim();
    const mobile = form.mobile.trim();

    if (businessName !== original.businessName.trim()) payload.businessName = businessName;
    if (ownerName !== original.ownerName.trim()) payload.ownerName = ownerName;
    if (mobile !== original.mobile.trim()) payload.mobile = mobile;
    if (form.alternateMobile.trim() !== original.alternateMobile.trim())
      payload.alternateMobile = form.alternateMobile.trim();
    if (form.gstNumber.trim() !== original.gstNumber.trim()) payload.gstNumber = form.gstNumber.trim();
    if (form.businessType.trim() !== original.businessType.trim()) payload.businessType = form.businessType.trim();

    const addressPatch: Partial<DealerAddress> = {};
    for (const field of ADDRESS_FIELDS) {
      const next = form.address[field].trim();
      const prev = original.address[field].trim();
      if (next !== prev) addressPatch[field] = next;
    }
    // Only send address when at least one address field changed; never send an empty address object.
    if (Object.keys(addressPatch).length > 0) payload.address = addressPatch;

    return payload;
  }

  function validate(): string {
    if (form.businessName.trim().length < 2) return 'Business name must be at least 2 characters.';
    if (form.ownerName.trim().length < 2) return 'Owner name must be at least 2 characters.';
    if (form.mobile.trim().length < 10) return 'Mobile must be at least 10 characters.';
    return '';
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setFormError('');

    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const payload = buildPayload();
    if (Object.keys(payload).length === 0) {
      toast.info('No changes to save.');
      onCancel();
      return;
    }

    mutation.mutate(payload);
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label className="full-field">
          Business name
          <input
            value={form.businessName}
            onChange={(event) => setField('businessName', event.target.value)}
            minLength={2}
            required
            disabled={pending}
          />
        </label>
        <label className="full-field">
          Owner name
          <input
            value={form.ownerName}
            onChange={(event) => setField('ownerName', event.target.value)}
            minLength={2}
            required
            disabled={pending}
          />
        </label>
        <label>
          Mobile
          <input
            value={form.mobile}
            onChange={(event) => setField('mobile', event.target.value)}
            minLength={10}
            required
            disabled={pending}
          />
        </label>
        <label>
          Alternate mobile
          <input
            value={form.alternateMobile}
            onChange={(event) => setField('alternateMobile', event.target.value)}
            disabled={pending}
          />
        </label>
        <label>
          GST number
          <input
            value={form.gstNumber}
            onChange={(event) => setField('gstNumber', event.target.value)}
            disabled={pending}
          />
        </label>
        <label>
          Business type
          <input
            value={form.businessType}
            onChange={(event) => setField('businessType', event.target.value)}
            disabled={pending}
          />
        </label>
      </div>

      <div className="form-section-title">ADDRESS</div>
      <div className="form-grid">
        <label className="full-field">
          Street
          <input
            value={form.address.street}
            onChange={(event) => setAddressField('street', event.target.value)}
            disabled={pending}
          />
        </label>
        <label>
          City
          <input
            value={form.address.city}
            onChange={(event) => setAddressField('city', event.target.value)}
            disabled={pending}
          />
        </label>
        <label>
          State
          <input
            value={form.address.state}
            onChange={(event) => setAddressField('state', event.target.value)}
            disabled={pending}
          />
        </label>
        <label>
          PIN code
          <input
            value={form.address.pincode}
            onChange={(event) => setAddressField('pincode', event.target.value)}
            disabled={pending}
          />
        </label>
        <label>
          Country
          <input
            value={form.address.country}
            onChange={(event) => setAddressField('country', event.target.value)}
            disabled={pending}
          />
        </label>
      </div>

      {formError && (
        <div className="form-error" role="alert">
          {formError}
        </div>
      )}

      <div className="modal-actions">
        <button type="button" className="secondary-button" onClick={onCancel} disabled={pending}>
          Cancel
        </button>
        <button type="submit" className="primary-button" disabled={pending}>
          {pending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
