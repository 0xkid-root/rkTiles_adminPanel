import { httpClient, type ApiResponse } from '@/lib/http';
import type {
  AccountStatus,
  DealerAccountStatusPayload,
  DealerApprovalPayload,
  DealerDetailResponse,
  DealerListQuery,
  DealerListResponse,
  DealerMutationResponse,
  DealerVerificationPayload,
  UpdateDealerPayload,
} from './dealer.types';

/** Admin Dealer Management base route (admin-only). */
const DEALERS_BASE = '/admin/dealers';

function idPath(id: string, suffix = ''): string {
  return `${DEALERS_BASE}/${encodeURIComponent(id)}${suffix}`;
}

/**
 * Separate service function per Dealer Management endpoint.
 * Reuses the shared `httpClient` (cookie auth, standard error handling).
 */
export const dealerService = {
  /**
   * GET /admin/dealers
   * Paginated dealer list with search, filters and sorting.
   */
  async getDealers(params?: DealerListQuery): Promise<DealerListResponse> {
    return httpClient.get<DealerListResponse>(DEALERS_BASE, {
      params: {
        page: params?.page,
        limit: params?.limit,
        search: params?.search?.trim() || undefined,
        approvalStatus: params?.approvalStatus || undefined,
        accountStatus: params?.accountStatus || undefined,
        verificationStatus: params?.verificationStatus || undefined,
        city: params?.city?.trim() || undefined,
        sort: params?.sort || undefined,
      },
    });
  },

  /**
   * GET /admin/dealers/:id
   * Full dealer details (approvedBy / rejectedBy populated with name + email).
   */
  async getDealer(id: string): Promise<DealerDetailResponse> {
    return httpClient.get<DealerDetailResponse>(idPath(id));
  },

  /**
   * PATCH /admin/dealers/:id
   * Update editable profile fields only. Partial updates supported;
   * provided address fields are assigned individually onto the existing address.
   */
  async updateDealer(id: string, payload: UpdateDealerPayload): Promise<DealerMutationResponse> {
    return httpClient.patch<DealerMutationResponse>(idPath(id), payload);
  },

  /**
   * PATCH /admin/dealers/:id/approval
   * Approve or reject a dealer. `remarks` optional.
   */
  async updateDealerApproval(id: string, payload: DealerApprovalPayload): Promise<DealerMutationResponse> {
    return httpClient.patch<DealerMutationResponse>(idPath(id, '/approval'), payload);
  },

  /**
   * PATCH /admin/dealers/:id/status
   * Activate or suspend a dealer account. `remarks` optional.
   */
  async updateDealerAccountStatus(
    id: string,
    payload: DealerAccountStatusPayload
  ): Promise<DealerMutationResponse> {
    return httpClient.patch<DealerMutationResponse>(idPath(id, '/status'), payload);
  },

  /**
   * PATCH /admin/dealers/:id/verification
   * Update verification status. `remarks` optional.
   * Does not change approval status, account status or isActive.
   */
  async updateDealerVerification(id: string, payload: DealerVerificationPayload): Promise<DealerMutationResponse> {
    return httpClient.patch<DealerMutationResponse>(idPath(id, '/verification'), payload);
  },

  /**
   * DELETE /admin/dealers/:id
   * Deletes the dealer and their associated cart.
   */
  async deleteDealer(id: string): Promise<ApiResponse<null>> {
    return httpClient.delete<ApiResponse<null>>(idPath(id));
  },
};

/** Convenience re-export for suspend/activate flows. */
export type { AccountStatus };

export default dealerService;
