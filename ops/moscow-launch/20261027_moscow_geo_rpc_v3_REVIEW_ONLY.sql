-- REVIEW ONLY / NOT DEPLOYED / DO NOT APPLY TO PRODUCTION.
-- 2026-10-27 Moscow seller geo RPC candidate, derived from current production function definitions.
-- Must be code-reviewed and executed on approved isolated staging with synthetic identities first.
-- PostgreSQL/PostGIS DDL: atomic transaction, no partner or offer data migration.
-- Preserves function signatures, SECURITY DEFINER, and existing grants via CREATE OR REPLACE.
-- Scope: normalize legacy service modes; validate Moscow polygon; clear stale point;
-- prevent offer-level coordinate overwrite; strengthen 8/8 readiness spatial checks.
-- Known limitation: districts lacking polygons cannot become launch-ready until boundaries exist.
-- Deploy server RPCs before changing account.html CITY -> CITYWIDE.

BEGIN;

CREATE OR REPLACE FUNCTION public.marketplace_update_my_location_v2(p_city_id uuid, p_area_id uuid DEFAULT NULL::uuid, p_address text DEFAULT NULL::text, p_latitude double precision DEFAULT NULL::double precision, p_longitude double precision DEFAULT NULL::double precision, p_service_mode text DEFAULT 'ONSITE'::text, p_service_radius_m integer DEFAULT 3000)
 RETURNS TABLE(partner_id uuid, city_id uuid, city_name text, area_id uuid, area_name text, marketplace_address text, marketplace_latitude double precision, marketplace_longitude double precision, service_mode text, service_radius_m integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_uid uuid := auth.uid();
  v_partner_id uuid;
  v_city public.marketplace_geo_places;
  v_area public.marketplace_geo_places;
  v_mode text := upper(coalesce(nullif(btrim(p_service_mode),''),'ONSITE'));
  v_radius integer := greatest(500,least(coalesce(p_service_radius_m,3000),50000));
begin
  v_mode := case v_mode when 'CITY' then 'CITYWIDE' when 'LOCAL' then 'ONSITE' when 'DELIVERY' then 'RADIUS' when 'BOTH' then 'HYBRID' else v_mode end;
  if v_uid is null then raise exception 'Authentication required'; end if;
  select pu.partner_id into v_partner_id
  from public.partner_users pu join public.partners pp on pp.id=pu.partner_id
  where pu.auth_user_id=v_uid and pu.is_active=true and pp.is_active=true
  limit 1;
  if v_partner_id is null then raise exception 'Partner profile not found'; end if;

  select * into v_city from public.marketplace_geo_places
  where id=p_city_id and place_type='CITY' and active=true and market_status<>'HIDDEN';
  if v_city.id is null then raise exception 'Invalid city'; end if;

  if p_area_id is not null then
    select * into v_area from public.marketplace_geo_places
    where id=p_area_id and active=true and market_status<>'HIDDEN'
      and place_type in ('ADMIN_DISTRICT','DISTRICT','SETTLEMENT','NEIGHBORHOOD');
    if v_area.id is null then raise exception 'Invalid area'; end if;
    if not public.marketplace_geo_is_related(v_area.id,v_city.id) then raise exception 'Area does not belong to city'; end if;
  end if;

  if p_latitude is not null and p_latitude not between -90 and 90 then raise exception 'Invalid latitude'; end if;
  if p_longitude is not null and p_longitude not between -180 and 180 then raise exception 'Invalid longitude'; end if;
  if (p_latitude is null) <> (p_longitude is null) then raise exception 'Latitude and longitude must be provided together'; end if;
  if v_mode not in ('ONSITE','RADIUS','CITYWIDE','REMOTE','HYBRID') then raise exception 'Invalid service mode'; end if;
  -- For Moscow, a selected district must contain the submitted point.
  if p_latitude is not null and v_city.canonical_key='city:moscow' then
    if v_area.id is null or v_area.place_type<>'DISTRICT' or v_area.boundary is null
       or v_area.canonical_key not like 'ru:moscow:district:%'
       or not extensions.st_covers(v_area.boundary,extensions.st_setsrid(extensions.st_makepoint(p_longitude,p_latitude),4326))
    then raise exception 'MOSCOW_DISTRICT_POINT_MISMATCH'; end if;
  end if;

  return query
  update public.partners p set
    marketplace_city=v_city.name,
    marketplace_geo_city_id=v_city.id,
    marketplace_geo_area_id=v_area.id,
    marketplace_address=nullif(btrim(p_address),''),
    marketplace_latitude=p_latitude,
    marketplace_longitude=p_longitude,
    marketplace_geo_point=case when p_latitude is not null then extensions.st_setsrid(extensions.st_makepoint(p_longitude,p_latitude),4326)::extensions.geography else null end,
    marketplace_service_mode=v_mode,
    marketplace_service_radius_m=v_radius,
    updated_at=now()
  where p.id=v_partner_id
  returning p.id,v_city.id,v_city.name,v_area.id,v_area.name,p.marketplace_address,p.marketplace_latitude,p.marketplace_longitude,p.marketplace_service_mode,p.marketplace_service_radius_m;
end;
$function$

CREATE OR REPLACE FUNCTION public.marketplace_partner_update_moscow_profile(p_description text, p_photo_url text, p_cover_url text, p_address text, p_latitude double precision, p_longitude double precision, p_service_mode text DEFAULT 'LOCAL'::text, p_service_radius_m integer DEFAULT 5000)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_partner_id uuid;
  v_city_id uuid;
  v_city_name text;
  v_district_id uuid;
  v_district_name text;
  v_metro_id uuid;
  v_metro_name text;
  v_metro_distance double precision;
  v_point public.partners.marketplace_geo_point%type;
  v_mode text := upper(coalesce(nullif(trim(p_service_mode),''),'LOCAL'));
  v_radius integer;
begin
  v_mode := case v_mode when 'CITY' then 'CITYWIDE' when 'LOCAL' then 'ONSITE' when 'DELIVERY' then 'RADIUS' when 'BOTH' then 'HYBRID' else v_mode end;
  v_radius := coalesce(p_service_radius_m,5000);
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select public.current_partner_id() into v_partner_id;
  if v_partner_id is null then raise exception 'PARTNER_REQUIRED'; end if;

  if coalesce(trim(p_description),'')='' then raise exception 'DESCRIPTION_REQUIRED'; end if;
  if length(p_description)>5000 then raise exception 'DESCRIPTION_TOO_LONG'; end if;
  if coalesce(trim(p_address),'')='' then raise exception 'ADDRESS_REQUIRED'; end if;
  if length(p_address)>500 then raise exception 'ADDRESS_TOO_LONG'; end if;
  if p_photo_url is null or trim(p_photo_url)='' then raise exception 'PHOTO_REQUIRED'; end if;
  if length(p_photo_url)>4096 or p_photo_url !~ '^https://' then raise exception 'INVALID_PHOTO_URL'; end if;
  if p_cover_url is not null and trim(p_cover_url)<>'' and (length(p_cover_url)>4096 or p_cover_url !~ '^https://') then raise exception 'INVALID_COVER_URL'; end if;
  if p_latitude is null or p_longitude is null then raise exception 'LOCATION_REQUIRED'; end if;
  if p_latitude not between -90 and 90 or p_longitude not between -180 and 180 then raise exception 'INVALID_LOCATION'; end if;
  if v_mode not in ('ONSITE','RADIUS','CITYWIDE','REMOTE','HYBRID') then raise exception 'INVALID_SERVICE_MODE'; end if;
  if v_radius<100 or v_radius>100000 then raise exception 'INVALID_SERVICE_RADIUS'; end if;

  select r.city_id,r.city_name,r.district_id,r.district_name,r.metro_id,r.metro_name,r.metro_distance_m
  into v_city_id,v_city_name,v_district_id,v_district_name,v_metro_id,v_metro_name,v_metro_distance
  from public.marketplace_geo_resolve_point(p_latitude,p_longitude) r
  limit 1;

  if v_city_id is null or not exists(
    select 1 from public.marketplace_geo_places g
    where g.id=v_city_id and g.place_type='CITY' and g.canonical_key='city:moscow' and g.active=true and g.market_status='ACTIVE'
  ) then raise exception 'LOCATION_OUTSIDE_MOSCOW'; end if;
  if v_district_id is null then raise exception 'MOSCOW_DISTRICT_NOT_RESOLVED'; end if;
  -- A city resolved by proximity is insufficient proof of being in Moscow.
  if not exists (
    select 1 from public.marketplace_geo_places d
    where d.id=v_district_id and d.place_type='DISTRICT' and d.active=true
      and d.market_status='ACTIVE' and d.canonical_key like 'ru:moscow:district:%'
      and d.boundary is not null
      and extensions.st_covers(d.boundary,extensions.st_setsrid(extensions.st_makepoint(p_longitude,p_latitude),4326))
  ) then raise exception 'MOSCOW_DISTRICT_POINT_MISMATCH'; end if;

  v_point := extensions.st_setsrid(extensions.st_makepoint(p_longitude,p_latitude),4326)::extensions.geography;

  update public.partners
  set marketplace_description=trim(p_description),
      marketplace_photo_url=trim(p_photo_url),
      marketplace_cover_url=nullif(trim(coalesce(p_cover_url,'')),''),
      marketplace_city='Москва',
      marketplace_address=trim(p_address),
      marketplace_latitude=p_latitude,
      marketplace_longitude=p_longitude,
      marketplace_geo_city_id=v_city_id,
      marketplace_geo_area_id=v_district_id,
      marketplace_geo_point=v_point,
      marketplace_service_mode=v_mode,
      marketplace_service_radius_m=v_radius,
      updated_at=now()
  where id=v_partner_id;

  return jsonb_build_object(
    'partner_id',v_partner_id,
    'city_id',v_city_id,
    'city',v_city_name,
    'district_id',v_district_id,
    'district',v_district_name,
    'nearest_metro_id',v_metro_id,
    'nearest_metro',v_metro_name,
    'nearest_metro_distance_m',case when v_metro_distance is null then null else round(v_metro_distance::numeric) end,
    'readiness',public.marketplace_partner_readiness(v_partner_id)
  );
end;
$function$

CREATE OR REPLACE FUNCTION public.marketplace_partner_readiness(p_partner_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v public.partners%rowtype;
  v_offer_count integer := 0;
  v_moscow_city uuid;
  v_area_ok boolean := false;
  v_point_ok boolean := false;
  v_score integer := 0;
  v_total integer := 8;
  v_missing text[] := array[]::text[];
begin
  select * into v from public.partners where id=p_partner_id;
  if not found then raise exception 'Partner not found'; end if;

  select id into v_moscow_city from public.marketplace_geo_places
  where canonical_key='city:moscow' and place_type='CITY' and active=true limit 1;

  if v.marketplace_geo_area_id is not null then
    select exists(
      select 1 from public.marketplace_geo_places g
      where g.id=v.marketplace_geo_area_id
        and g.place_type='DISTRICT'
        and g.active=true
        and g.market_status='ACTIVE'
        and g.canonical_key like 'ru:moscow:district:%'
        and g.boundary is not null
        and v.marketplace_geo_city_id=v_moscow_city
        and public.marketplace_geo_is_related(g.id,v_moscow_city)
    ) into v_area_ok;
  end if;

  -- Readiness requires the point, latitude/longitude and district to agree.
  if v_area_ok and v.marketplace_geo_point is not null
     and v.marketplace_latitude between -90 and 90
     and v.marketplace_longitude between -180 and 180 then
    select exists (
      select 1 from public.marketplace_geo_places g
      where g.id=v.marketplace_geo_area_id
        and extensions.st_covers(g.boundary,extensions.st_setsrid(extensions.st_makepoint(v.marketplace_longitude,v.marketplace_latitude),4326))
        and extensions.st_dwithin(v.marketplace_geo_point,extensions.st_setsrid(extensions.st_makepoint(v.marketplace_longitude,v.marketplace_latitude),4326)::extensions.geography,10)
    ) into v_point_ok;
  end if;

  select count(*)::int into v_offer_count
  from public.partner_products pp
  where pp.partner_id=p_partner_id
    and pp.is_active=true
    and pp.marketplace_visible=true
    and pp.marketplace_listing_status='ACTIVE'
    and pp.marketplace_moderation_status='APPROVED'
    and (pp.marketplace_expires_at is null or pp.marketplace_expires_at > now())
    and pp.marketplace_offer_type in ('PRODUCT','FOOD','SERVICE')
    and coalesce(nullif(trim(pp.title),''),'')<>''
    and pp.price is not null
    and pp.price>=0
    and coalesce(pp.currency,'RUB')='RUB'
    and nullif(btrim(coalesce(pp.unit,'')),'') is not null
    and upper(coalesce(pp.marketplace_details->>'stock_status',''))<>'OUT_OF_STOCK'
    and (pp.quantity is null or pp.quantity>0);

  if coalesce(nullif(trim(v.name),''),'')<>'' then v_score:=v_score+1; else v_missing:=array_append(v_missing,'name'); end if;
  if coalesce(nullif(trim(v.marketplace_description),''),'')<>'' then v_score:=v_score+1; else v_missing:=array_append(v_missing,'description'); end if;
  if coalesce(nullif(trim(v.phone),''),nullif(trim(v.email),'')) is not null then v_score:=v_score+1; else v_missing:=array_append(v_missing,'contact'); end if;
  if coalesce(nullif(trim(v.marketplace_photo_url),''),nullif(trim(v.marketplace_cover_url),'')) is not null then v_score:=v_score+1; else v_missing:=array_append(v_missing,'photo'); end if;
  if v.marketplace_geo_city_id=v_moscow_city then v_score:=v_score+1; else v_missing:=array_append(v_missing,'moscow_city'); end if;
  if v_area_ok then v_score:=v_score+1; else v_missing:=array_append(v_missing,'moscow_district'); end if;
  if v_point_ok and coalesce(nullif(trim(v.marketplace_address),''),nullif(trim(v.address),'')) is not null then v_score:=v_score+1; else v_missing:=array_append(v_missing,'location'); end if;
  if v_offer_count>=3 then v_score:=v_score+1; else v_missing:=array_append(v_missing,'offers_min_3'); end if;

  return jsonb_build_object(
    'partner_id',v.id,
    'ready',v_score=v_total,
    'score',v_score,
    'total',v_total,
    'percent',round((v_score::numeric/v_total::numeric)*100),
    'missing',to_jsonb(v_missing),
    'visible_offer_count',v_offer_count,
    'moscow_city_id',v_moscow_city
  );
end;
$function$

COMMIT;
