-- CUIM / Moscow launch P0: READ-ONLY production baseline.
-- 2026-10-24. Safe SELECTs only. No DDL, DML, or RPC writes.
-- Run separately or as a batch in Supabase SQL editor.
-- Reference: https://github.com/nyaganmaksimov-sys/cuim-marketplace/issues/1

-- 1. Marketplace funnel baseline.
SELECT
  (SELECT count(*) FROM public.partners) AS partners_total,
  (SELECT count(*) FROM public.partner_products WHERE is_active = true) AS active_offers,
  (SELECT count(*) FROM public.partner_products
   WHERE is_active = true AND marketplace_visible = true) AS flagged_visible_offers,
  (SELECT count(*) FROM public.marketplace_catalog_products_v4()) AS public_catalog_offers,
  (SELECT count(*) FROM public.marketplace_orders) AS marketplace_orders,
  (SELECT count(*) FROM public.marketplace_checkout_requests) AS checkout_requests,
  (SELECT count(*) FROM public.partners
   WHERE marketplace_latitude IS NOT NULL AND marketplace_longitude IS NOT NULL) AS geocoded_partners;

-- 2. Seller readiness distribution; no seller PII returned.
SELECT
  (public.marketplace_partner_readiness(p.id)->>'score')::integer AS score,
  count(*)::integer AS seller_count
FROM public.partners AS p
GROUP BY 1
ORDER BY score DESC;

-- 3. Moscow district geometry coverage.
SELECT
  count(*)::integer AS districts_total,
  count(*) FILTER (WHERE boundary IS NULL)::integer AS districts_missing_boundary
FROM public.marketplace_geo_places
WHERE place_type = 'DISTRICT'
  AND active = true
  AND canonical_key LIKE 'ru:moscow:district:%';

-- 4. Current service-mode database constraint.
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.partners'::regclass
  AND pg_get_constraintdef(oid) ILIKE '%marketplace_service_mode%';

-- 5. Verify RPC signature, security context and exposure.
SELECT
  proname,
  pg_get_function_identity_arguments(oid) AS arguments,
  prosecdef AS security_definer,
  has_function_privilege('anon', oid, 'EXECUTE') AS anon_can_execute,
  has_function_privilege('authenticated', oid, 'EXECUTE') AS authenticated_can_execute
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'marketplace_catalog_products_v4',
    'marketplace_partner_readiness',
    'marketplace_partner_is_launch_ready',
    'marketplace_update_my_location_v2',
    'marketplace_partner_update_moscow_profile'
  )
ORDER BY proname;

-- RELEASE GATE (not implemented by this diagnostic):
-- [ ] Isolated staging database with test identities and masked seller data.
-- [ ] Review-only migration v2 passes all five canonical service modes
--     and four legacy aliases without overwriting offer-level geo.
-- [ ] District polygon contains seller point; points outside Moscow rejected.
-- [ ] Clearing coordinates clears stored geography; seller A cannot edit B.
-- [ ] Update server RPC first; then account.html CITY -> CITYWIDE.
-- [ ] One real Moscow seller scores 8/8; >=3 public offers; checkout + cancel.
-- [ ] Record p95 for catalog, geo search and checkout before expanding districts.
