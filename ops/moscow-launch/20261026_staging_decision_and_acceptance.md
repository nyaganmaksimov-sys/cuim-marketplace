# Moscow launch P0 — staging decision and acceptance gate (2026-10-26)

Status: **REVIEW ONLY**. No migration has been applied; do not merge this draft PR as a launch fix.

## Verified baseline (production read-only, 2026-10-26)
- Project `qgakliolffnwkymoqvzn` (A4PRINT HUB): ACTIVE_HEALTHY.
- 5 active partners; readiness scores 4/8, 3/8, 1/8, 1/8, 1/8.
- 612 active offers, 15 flagged visible, **0 returned by `marketplace_catalog_products_v4()`**.
- 0 `marketplace_orders`, 0 `marketplace_checkout_requests`.
- 0 partners with a stored geo point; 45/132 active Moscow districts lack a boundary.
- `partners_marketplace_service_mode_check` accepts ONSITE/RADIUS/CITYWIDE/REMOTE/HYBRID.
- The live resolver identifies Khimki as city Moscow but returns no district; city alone is not a valid geo proof.
- No Supabase development branches exist for the production project.

## Existing project discovery — NOT an authorization to use it
A second Supabase project, `uvcdxppjtvwtpckpqlsb` (eu-west-1), exists in the same organization, status INACTIVE. Its purpose and data are unknown; table listing failed because the database is unavailable. **Do not restore, repurpose, copy production data into it, or incur costs without explicit owner approval.** MOTO TECH is an unrelated active production project and must not be used for testing.

## P0 decision / execution order
1. Owner chooses an **isolated, approved** staging target and confirms any cost. If an existing project is chosen, verify it is not serving another application. No production secrets, real user sessions or customer PII in staging.
2. Snapshot the current function definitions, grants, constraints and relevant schema; verify a working backup/restore route. Build an isolated schema/data fixture with two seller identities and synthetic offers.
3. Apply the existing local `20261021_moscow_geo_readiness_v2_REVIEW_ONLY.sql` draft **only on staging after code review**. It is not in this PR and is not validated.
4. Test all cases below and record SQL outputs, error codes and before/after snapshots. Fix defects in the migration, then commit the reviewed migration in a separate code PR.
5. Deploy backward-compatible RPCs before changing `account.html` from CITY to CITYWIDE; verify old clients remain functional.
6. Only after sign-off, use a reviewed rollout/rollback plan for production. Prepare a real Moscow seller, confirm >=3 public offers, then test checkout + cancellation.

## Mandatory staging acceptance matrix

| Test | Expected |
| --- | --- |
| ONSITE / RADIUS / CITYWIDE / REMOTE / HYBRID | Persist as-is |
| Legacy CITY / LOCAL / DELIVERY / BOTH | Persist CITYWIDE / ONSITE / RADIUS / HYBRID |
| Incomplete coordinate pair or invalid latitude/longitude | Reject without partial update |
| Khimki coordinate with Moscow selected | Reject (no matching Moscow district polygon) |
| Moscow district without boundary | Reject rather than guess |
| Point in a different district from selected area | Reject or consistently canonicalize, with explicit contract |
| Re-save valid Moscow address | Idempotent; same district/coordinates |
| Clear coordinates via location RPC | Clear `marketplace_geo_point` too; readiness must drop |
| Seller A attempts to change seller B | Denied; B's data unchanged |
| Save seller profile with per-offer custom coordinates | No `partner_products` geo/address changes |
| Readiness with mismatched city, district and point | Must not return 8/8 |
| `anon` calls seller mutation RPCs | Permission denied |
| Public catalog before/after ready seller | 0 before; >=3 eligible offers after |
| Checkout, order status, cancellation, stock recovery | All pass using synthetic data |

## Release gates
- Staging identified and owner-approved; backup/restore tested.
- SQL migration reviewed, applied and passed with two seller identities.
- No unexpected changes to shared A4PRINT HUB objects or offer-level geo.
- Rollback SQL and versioned GitHub commit exist.
- First Moscow seller is 8/8; >=3 visible offers; successful order and cancellation.
- Before expanding to 3 sellers / 30–50 offers, record p95 catalog, geo-search and checkout; review marketplace-specific RLS and SECURITY DEFINER access.

Related: #1 and PR #2. This document is an execution gate, **not** evidence that staging or the fix exists.
