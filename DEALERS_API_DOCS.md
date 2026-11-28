# RK Tiles — Admin Dealer Management API

Frontend integration for the **Admin Dealer Management** module. Reuses the shared `httpClient`, cookie auth, and `ApiError`.

**Base URL:** `http://localhost:5000/api/v1` · **Prefix:** `/admin/dealers` · **Auth:** Admin required (`authenticate` + `authorizeRoles(ROLES.ADMIN)`) · **Content-Type:** `application/json`

Service: `services/dealers/dealer.service.ts` → `dealerService`. Types: `services/dealers/dealer.types.ts`.
UI: `components/admin/dealers/` (`DealersView`, `DealerDetailView`). Routes: `/admin/dealers`, `/admin/dealers/:id`.

## Endpoints (one service function each)

| # | Method | Endpoint | Service fn | Purpose |
| - | ------ | -------- | ---------- | ------- |
| 1 | GET    | `/admin/dealers`                  | `getDealers`                 | List (search, filters, sort, pagination) |
| 2 | GET    | `/admin/dealers/:id`              | `getDealer`                  | Detail |
| 3 | PATCH  | `/admin/dealers/:id`              | `updateDealer`               | Update editable profile fields |
| 4 | PATCH  | `/admin/dealers/:id/approval`     | `updateDealerApproval`       | Approve / reject |
| 5 | PATCH  | `/admin/dealers/:id/status`       | `updateDealerAccountStatus`  | Activate / suspend |
| 6 | PATCH  | `/admin/dealers/:id/verification` | `updateDealerVerification`   | Update verification |
| 7 | DELETE | `/admin/dealers/:id`              | `deleteDealer`               | Delete dealer + associated cart |

## GET /admin/dealers — query

`page` (≥1, default 1) · `limit` (1–100, default 10) · `search` (businessName, ownerName, email, dealerId, mobile) · `approvalStatus` · `accountStatus` · `verificationStatus` · `city` · `sort` (`businessName_asc` | `businessName_desc`; default `createdAt` desc).

**Response:** `{ success, message, data: Dealer[], pagination: { page, limit, total, totalPages } }`. Use returned pagination; `totalPages` ≥ 1. Search debounced; search/filters/sort preserved across pages.

## Statuses (exact backend values)

- **approvalStatus:** `pending` | `approved` | `rejected`
- **accountStatus:** `active` | `suspended`
- **verificationStatus:** `unverified` | `pending` | `verified` | `rejected`

Independent fields. New dealers default: approval `pending`, account `active`, verification `unverified`, `isActive` true.

## PATCH /admin/dealers/:id — editable fields

`businessName` (min 2), `ownerName` (min 2), `mobile` (min 10), `alternateMobile`, `gstNumber`, `businessType`, `address: { street?, city?, state?, pincode?, country? }`.
Partial updates; provided address fields are assigned individually onto the existing address; only send edited fields; never send an empty `address`. (Note: read-only fields — `name`, `email`, `role`, `dealerId`, statuses, `approvedBy/At`, `rejectedBy/At`, `isActive`, `lastLoginAt`, timestamps, `password` — are not sent. No password fields shown.)

## Action payloads

- **Approval:** `{ status: 'approved'|'rejected', remarks? }`. Approving sets `approvedBy`/`approvedAt` and clears `rejectedBy`/`rejectedAt`; rejecting sets `rejectedBy`/`rejectedAt`. `verificationRemarks` updated only when non-empty `remarks`.
- **Account status:** `{ status: 'active'|'suspended', remarks? }`. `active`→`isActive:true`; `suspended`→`isActive:false`. `remarks` saved to `verificationRemarks`.
- **Verification:** `{ status: VerificationStatus, remarks? }`. Updates `verificationStatus` (+`verificationRemarks` when provided); does not change approval/account/`isActive`.
- **Delete:** no body. Removes dealer + associated cart (`Cart.findOneAndDelete({ dealer: id })`). Confirmation dialog notes this.

All mutations refresh affected dealer data (React Query invalidation of `['dealers']`). Confirmation dialogs for approve, reject, suspend, activate, delete. `remarks` optional.

## Dealer object

`{ _id, name, email, role:'dealer', businessName, dealerId, ownerName, mobile, alternateMobile, gstNumber, businessType, address{street,city,state,pincode,country}, approvalStatus, accountStatus, verificationStatus, verificationRemarks, approvedBy, approvedAt, rejectedBy, rejectedAt, isActive, lastLoginAt, createdAt, updatedAt }`.

`approvedBy`/`rejectedBy`: populated `{ _id, name, email }`, `null`, absent, or raw id. `password` excluded; `__v` removed. Handle missing/null fields. `approvedBy/approvedAt/rejectedBy/rejectedAt` nullable. **`GET /:id` and mutation responses return the actual dealer object; serialized null/populated values can vary.**

## Response standards

Success `{ success:true, message, data }`; paginated adds `pagination`. `DELETE` → `data: null`. Errors handled flexibly via `ApiError` (backend error middleware not assumed).

## Rules

Reuse shared API client + auth; don't modify Admin Authentication; don't redesign admin layout; keep dealer list consistent with dashboard theme; backend pagination; debounce search; preserve filters/sort across pages; separate service fn per endpoint; refresh after mutations; loading/empty/error/success states; confirmations; no password fields; handle nulls; no faked success; **no Dealer Cart or Dashboard APIs in this phase**.
