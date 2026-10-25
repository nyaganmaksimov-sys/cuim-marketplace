-- CUIM / Moscow launch P0: geo-boundary preflight (READ ONLY)
-- Verified against production on 2026-10-25.
-- Safe to run on production or staging: SELECT only; no DDL, DML or impersonation.
-- Related: https://github.com/nyaganmaksimov-sys/cuim-marketplace/issues/1
--
-- IMPORTANT: marketplace_geo_resolve_point() chooses CITY by distance from
-- a city centre, NOT by a city polygon. A city_id alone is NOT evidence that
-- a seller's coordinates are inside Moscow. An active district polygon must
-- cover the point, and the district must be related to Moscow.
--
-- 1) Read-only boundary quality gate.
SELECT
  count(*)::integer AS active_moscow_districts,
  count(*) FILTER (WHERE boundary IS NULL)::integer AS missing_boundaries,
  count(*) FILTER (WHERE boundary IS NOT NULL)::integer AS available_boundaries,
  count(*) FILTER (WHERE boundary IS NOT NULL
                   AND NOT extensions.st_isvalid(boundary))::integer AS invalid_boundaries,
  count(*) FILTER (WHERE boundary IS NOT NULL
                   AND extensions.st_srid(boundary) <> 4326)::integer AS wrong_srid,
  count(*) FILTER (WHERE NOT public.marketplace_geo_is_related(
    id, (SELECT id FROM public.marketplace_geo_places
         WHERE place_type='CITY' AND canonical_key='city:moscow'
         AND active=true LIMIT 1)))::integer AS unrelated_districts
FROM public.marketplace_geo_places
WHERE place_type='DISTRICT' AND active=true
  AND canonical_key LIKE 'ru:moscow:district:%';

-- 2) Reproducible city-vs-district resolver probe.
-- Khimki is outside Moscow city; current resolver still reports city='Москва'
-- because its city selection uses distance. No seller records are modified.
WITH sample(label, lat, lng) AS (
  VALUES
    ('central_moscow_arbat',55.752::double precision,37.590::double precision),
    ('outside_moscow_khimki',55.897::double precision,37.429::double precision)
)
SELECT s.label, r.city_name, r.district_name,
       r.city_id IS NOT NULL AS city_resolved,
       r.district_id IS NOT NULL AS district_resolved,
       CASE
         WHEN s.label='outside_moscow_khimki'
           THEN r.district_id IS NULL
         ELSE r.city_name='Москва' AND r.district_id IS NOT NULL
       END AS rpc_geo_guard_can_distinguish
FROM sample s
LEFT JOIN LATERAL public.marketplace_geo_resolve_point(s.lat,s.lng) r ON true
ORDER BY s.label;

-- 3) Detect current profiles with coordinates that are NOT spatially
-- contained by their assigned Moscow district. Aggregate only; no PII.
WITH moscow AS (
  SELECT id FROM public.marketplace_geo_places
  WHERE place_type='CITY' AND canonical_key='city:moscow'
    AND active=true AND market_status='ACTIVE' LIMIT 1
)
SELECT count(*) FILTER (
         WHERE p.marketplace_latitude IS NOT NULL
           AND p.marketplace_longitude IS NOT NULL
       )::integer AS profiles_with_coordinate_pair,
       count(*) FILTER (
         WHERE p.marketplace_latitude IS NOT NULL
           AND p.marketplace_longitude IS NOT NULL
           AND NOT EXISTS (
             SELECT 1 FROM public.marketplace_geo_places g,moscow m
             WHERE g.id=p.marketplace_geo_area_id
               AND g.place_type='DISTRICT' AND g.active=true
               AND g.market_status='ACTIVE' AND g.boundary IS NOT NULL
               AND public.marketplace_geo_is_related(g.id,m.id)
               AND extensions.st_covers(
                 g.boundary,
                 extensions.st_setsrid(extensions.st_makepoint(
                   p.marketplace_longitude,p.marketplace_latitude),4326))
           )
       )::integer AS profiles_outside_assigned_district
FROM public.partners p;

-- 4) Ensure seller mutation RPCs are not executable by anon.
SELECT proname,
       has_function_privilege('anon',oid,'EXECUTE') AS anon_execute,
       has_function_privilege('authenticated',oid,'EXECUTE') AS authenticated_execute,
       prosecdef AS security_definer
FROM pg_proc
WHERE pronamespace='public'::regnamespace
  AND proname IN ('marketplace_update_my_location_v2',
                 'marketplace_partner_update_moscow_profile',
                 'marketplace_partner_readiness')
ORDER BY proname;

-- RELEASE GATE:
-- [ ] An isolated staging project/branch exists (not present on 2026-10-25).
-- [ ] Review-only migration v2 is tested with two seller identities.
-- [ ] Server RPCs enforce district ST_Covers and reject outside points.
-- [ ] Five canonical modes and four legacy aliases persist correctly.
-- [ ] Clearing location removes stale point; per-offer geo is unchanged.
-- [ ] account.html switched to CITYWIDE only AFTER compatible RPC rollout.
-- [ ] First seller 8/8, >=3 public offers, checkout + cancellation verified.
