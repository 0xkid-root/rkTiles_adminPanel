/**
 * RK Tiles — Admin Dealer Management API types.
 *
 * Backend contract: /api/v1/admin/dealers (admin-only).
 * Statuses match backend `config/constants.js` exactly.
 */

/** Approval status of a dealer application. */
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

/** Dealer account status. */
export type AccountStatus = 'active' | 'suspended';

/** Dealer verification progress/result. */
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

/** Supported business-name sorts. Default backend order is newest created first. */
export type DealerSort = 'businessName_asc' | 'businessName_desc';

/** Approval actions supported by PATCH /admin/dealers/:id/approval. */
export type DealerApprovalStatus = 'approved' | 'rejected';

export const APPROVAL_STATUSES: ApprovalStatus[] = ['pending', 'approved', 'rejected'];
export const ACCOUNT_STATUSES: AccountStatus[] = ['active', 'suspended'];
export const VERIFICATION_STATUSES: VerificationStatus[] = ['unverified', 'pending', 'verified', 'rejected'];

/** Dealer business address. All fields optional/nullable. */
export interface DealerAddress {
  street?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  country?: string | null;
}

/**
 * Reference to the admin who approved/rejected a dealer.
 * Backend populates `name` and `email`; when empty it may be `null` or absent.
 * Depending on Mongoose serialization a raw ObjectId string may appear.
 */
export interface DealerAdminRef {
  _id?: string | null;
  name?: string | null;
  email?: string | null;
}

export type DealerAdminActor = DealerAdminRef | string | null;

/** Complete dealer object as returned by list/detail endpoints. */
export interface Dealer {
  _id: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;

  businessName?: string | null;
  dealerId?: string | null;
  ownerName?: string | null;
  mobile?: string | null;
  alternateMobile?: string | null;
  gstNumber?: string | null;
  businessType?: string | null;
  address?: DealerAddress | null;

  approvalStatus?: ApprovalStatus | null;
  accountStatus?: AccountStatus | null;
  verificationStatus?: VerificationStatus | null;
  verificationRemarks?: string | null;

  approvedBy?: DealerAdminActor;
  approvedAt?: string | null;
  rejectedBy?: DealerAdminActor;
  rejectedAt?: string | null;

  isActive?: boolean | null;
  lastLoginAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

/** Backend pagination metadata (`totalPages` minimum 1). */
export interface DealerPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Query parameters for GET /admin/dealers. */
export interface DealerListQuery {
  /** Page number, minimum 1. Default 1. */
  page?: number;
  /** Records per page, 1–100. Default 10. */
  limit?: number;
  /** Searches businessName, ownerName, email, dealerId, mobile. */
  search?: string;
  approvalStatus?: ApprovalStatus;
  accountStatus?: AccountStatus;
  verificationStatus?: VerificationStatus;
  /** Filter by city. */
  city?: string;
  /** `businessName_asc` | `businessName_desc`. Default newest created first. */
  sort?: DealerSort;
}

/** Editable dealer profile fields for PATCH /admin/dealers/:id. */
export interface UpdateDealerPayload {
  /** Minimum 2 characters. */
  businessName?: string;
  /** Minimum 2 characters. */
  ownerName?: string;
  /** Minimum 10 characters. */
  mobile?: string;
  alternateMobile?: string;
  gstNumber?: string;
  businessType?: string;
  /**
   * Individual address fields are assigned onto the existing address.
   * Only send fields the user edited; do not send an empty address object.
   */
  address?: Partial<DealerAddress>;
}

/** PATCH /admin/dealers/:id/approval */
export interface DealerApprovalPayload {
  status: DealerApprovalStatus;
  /** Optional; `verificationRemarks` updated only when non-empty. */
  remarks?: string;
}

/** PATCH /admin/dealers/:id/status */
export interface DealerAccountStatusPayload {
  status: AccountStatus;
  /** Optional; saved into `verificationRemarks`. */
  remarks?: string;
}

/** PATCH /admin/dealers/:id/verification */
export interface DealerVerificationPayload {
  status: VerificationStatus;
  /** Optional; `verificationRemarks` updated only when provided. */
  remarks?: string;
}

/** Standard success envelope. */
export interface DealerApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

/** GET /admin/dealers response. */
export interface DealerListResponse extends DealerApiResponse<Dealer[]> {
  pagination: DealerPagination;
}

/** GET /admin/dealers/:id response. */
export type DealerDetailResponse = DealerApiResponse<Dealer>;

/**
 * Mutation responses. Backend returns the updated dealer object;
 * treat populated/nullable fields leniently.
 */
export type DealerMutationResponse = DealerApiResponse<Partial<Dealer> & { _id?: string } | null>;
