-- Dedicated personal-site analytics. Does not alter research/CPIT tables.
-- Apply as a project database owner, then initialize settings with a SHA-256
-- hash of a separately generated 32-byte random admin key. Never commit the key.
begin;

create table if not exists public.portfolio_analytics_settings (
  singleton boolean primary key default true check (singleton),
  admin_key_hash text not null check (admin_key_hash ~ '^[0-9a-f]{64}$'),
  initialized_at timestamptz not null default now(),
  next_cleanup_at timestamptz not null default now()
);

create table if not exists public.portfolio_analytics_events (
  event_id uuid primary key,
  occurred_at timestamptz not null default now(),
  site text not null default 'adeebnoor.github.io' check (site = 'adeebnoor.github.io'),
  visitor_id uuid not null,
  session_id uuid not null,
  type text not null check (type in (
    'page_view', 'link_click', 'project_click', 'outbound_click', 'contact_click',
    'language_switch', 'download_click', 'cv_print_request', 'demo_run'
  )),
  page text not null check (left(page, 1) = '/' and length(page) <= 512 and page !~ '[?#@]'),
  target text not null default '' check (length(target) <= 512 and target !~ '[?@]'),
  language text not null check (language in ('en', 'ar')),
  referrer_host text not null default '' check (length(referrer_host) <= 253 and referrer_host !~ '[/@?:#]'),
  device text not null default 'unknown' check (device in ('mobile', 'tablet', 'desktop', 'unknown'))
);

create index if not exists portfolio_analytics_events_time_idx
  on public.portfolio_analytics_events (occurred_at desc);
create index if not exists portfolio_analytics_events_visitor_time_idx
  on public.portfolio_analytics_events (visitor_id, occurred_at desc);

alter table public.portfolio_analytics_settings enable row level security;
alter table public.portfolio_analytics_events enable row level security;
revoke all on table public.portfolio_analytics_settings from public, anon, authenticated;
revoke all on table public.portfolio_analytics_events from public, anon, authenticated;
grant select, insert, update, delete on table public.portfolio_analytics_settings to service_role;
grant select, insert, update, delete on table public.portfolio_analytics_events to service_role;

create or replace function public.portfolio_analytics_cleanup()
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_due timestamptz;
  v_deleted integer := 0;
begin
  -- A shared row lock prevents concurrent cleanup and makes ingest caps atomic.
  select s.next_cleanup_at into v_due
  from public.portfolio_analytics_settings s where s.singleton = true for update;
  if not found then
    raise exception 'Portfolio analytics has not been initialized';
  end if;
  if v_due <= now() then
    delete from public.portfolio_analytics_events where occurred_at < now() - interval '90 days';
    get diagnostics v_deleted = row_count;
    update public.portfolio_analytics_settings set next_cleanup_at = now() + interval '1 day' where singleton = true;
  end if;
  return v_deleted;
end;
$$;

create or replace function public.portfolio_analytics_ingest(
  p_visitor_id uuid,
  p_session_id uuid,
  p_events jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_day_start timestamptz := date_trunc('day', now() at time zone 'Asia/Riyadh') at time zone 'Asia/Riyadh';
  v_visitor_count integer;
  v_global_count integer;
  v_accepted integer := 0;
  v_affected integer;
  v_limited boolean := false;
  v_event jsonb;
begin
  if p_visitor_id is null or p_session_id is null or p_events is null
     or jsonb_typeof(p_events) <> 'array' then
    raise exception 'Invalid analytics batch';
  end if;
  if jsonb_array_length(p_events) < 1 or jsonb_array_length(p_events) > 10 then
    raise exception 'Invalid analytics batch size';
  end if;

  -- The cleanup helper holds the singleton FOR UPDATE lock for this transaction.
  -- That serializes count+insert even when multiple Edge instances receive a batch.
  perform public.portfolio_analytics_cleanup();
  select count(*)::integer into v_global_count
    from public.portfolio_analytics_events where occurred_at >= v_day_start;
  select count(*)::integer into v_visitor_count
    from public.portfolio_analytics_events where visitor_id = p_visitor_id and occurred_at >= v_day_start;

  for v_event in select value from jsonb_array_elements(p_events) loop
    -- A retry of an already recorded event consumes no quota and writes no row.
    if exists (select 1 from public.portfolio_analytics_events where event_id = (v_event->>'event_id')::uuid) then
      continue;
    end if;
    if v_visitor_count >= 200 or v_global_count >= 50000 then
      v_limited := true;
      continue;
    end if;
    insert into public.portfolio_analytics_events (
      event_id, occurred_at, site, visitor_id, session_id, type, page, target, language, referrer_host, device
    ) values (
      (v_event->>'event_id')::uuid, now(), 'adeebnoor.github.io', p_visitor_id, p_session_id,
      v_event->>'type', v_event->>'page', coalesce(v_event->>'target', ''),
      v_event->>'language', coalesce(v_event->>'referrer_host', ''), coalesce(v_event->>'device', 'unknown')
    ) on conflict (event_id) do nothing;
    get diagnostics v_affected = row_count;
    v_accepted := v_accepted + v_affected;
    v_visitor_count := v_visitor_count + v_affected;
    v_global_count := v_global_count + v_affected;
  end loop;
  return jsonb_build_object('accepted', v_accepted, 'limited', v_limited);
end;
$$;

create or replace function public.portfolio_analytics_stats(p_days integer default 30)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_start timestamptz;
  v_end timestamptz := now();
  v_result jsonb;
begin
  if p_days is null or p_days not in (1, 7, 30, 90) then
    raise exception 'Unsupported analytics period';
  end if;
  perform public.portfolio_analytics_cleanup();
  -- Today plus preceding calendar days in the owner's timezone.
  v_start := (date_trunc('day', v_end at time zone 'Asia/Riyadh') - make_interval(days => p_days - 1)) at time zone 'Asia/Riyadh';

  with filtered as materialized (
    select * from public.portfolio_analytics_events
    where occurred_at >= v_start and occurred_at <= v_end
  ), totals as (
    select
      count(distinct visitor_id) as visitors,
      count(distinct session_id) as sessions,
      count(*) as total_events,
      count(*) filter (where type = 'page_view') as page_views,
      count(*) filter (where type in ('link_click', 'project_click', 'outbound_click', 'contact_click', 'language_switch', 'download_click')) as link_clicks,
      count(*) filter (where type = 'project_click') as project_clicks,
      count(*) filter (where type = 'outbound_click') as outbound_clicks,
      count(*) filter (where type = 'contact_click') as contact_clicks,
      count(*) filter (where type = 'language_switch') as language_switches,
      count(*) filter (where type = 'download_click') as download_clicks,
      count(*) filter (where type = 'cv_print_request') as print_requests,
      count(*) filter (where type = 'demo_run') as demo_runs
    from filtered
  ), days as (
    select day::date as date from generate_series(
      (v_start at time zone 'Asia/Riyadh')::date,
      (v_end at time zone 'Asia/Riyadh')::date, interval '1 day'
    ) day
  ), daily as (
    select to_char(d.date, 'YYYY-MM-DD') as date,
      count(distinct e.visitor_id) as visitors,
      count(distinct e.session_id) as sessions,
      count(e.event_id) as total_events,
      count(*) filter (where e.type = 'page_view') as page_views,
      count(*) filter (where e.type in ('link_click', 'project_click', 'outbound_click', 'contact_click', 'language_switch', 'download_click')) as link_clicks,
      count(*) filter (where e.type = 'project_click') as project_clicks,
      count(*) filter (where e.type = 'outbound_click') as outbound_clicks,
      count(*) filter (where e.type = 'contact_click') as contact_clicks,
      count(*) filter (where e.type = 'language_switch') as language_switches,
      count(*) filter (where e.type = 'download_click') as download_clicks,
      count(*) filter (where e.type = 'cv_print_request') as print_requests,
      count(*) filter (where e.type = 'demo_run') as demo_runs
    from days d left join filtered e on (e.occurred_at at time zone 'Asia/Riyadh')::date = d.date
    group by d.date order by d.date
  ), top_pages as (
    select page, count(*) as views, count(distinct visitor_id) as visitors
    from filtered where type = 'page_view' group by page order by views desc, page limit 30
  ), top_destinations as (
    select target, type, count(*) as clicks
    from filtered where type in ('link_click', 'project_click', 'outbound_click', 'contact_click', 'language_switch', 'download_click', 'cv_print_request')
    group by target, type order by clicks desc, target, type limit 30
  ), recent_events as (
    select occurred_at, type, page, target, visitor_id, session_id, language, referrer_host, device
    from filtered order by occurred_at desc, event_id desc limit 100
  )
  select jsonb_build_object(
    'site', 'adeebnoor.github.io',
    'generated_at', v_end,
    'period', jsonb_build_object('days', p_days, 'start', v_start, 'end', v_end, 'timezone', 'Asia/Riyadh'),
    'collection_started_at', (select initialized_at from public.portfolio_analytics_settings where singleton = true),
    'retention_days', 90,
    'visitors_approximate', true,
    'totals', (select to_jsonb(t) from totals t),
    'daily', coalesce((select jsonb_agg(to_jsonb(d) order by d.date) from daily d), '[]'::jsonb),
    'top_pages', coalesce((select jsonb_agg(to_jsonb(p) order by p.views desc, p.page) from top_pages p), '[]'::jsonb),
    'top_destinations', coalesce((select jsonb_agg(to_jsonb(t) order by t.clicks desc, t.target, t.type) from top_destinations t), '[]'::jsonb),
    'recent_events', coalesce((select jsonb_agg(to_jsonb(r) order by r.occurred_at desc) from recent_events r), '[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$$;

revoke all on function public.portfolio_analytics_cleanup() from public, anon, authenticated;
revoke all on function public.portfolio_analytics_ingest(uuid, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.portfolio_analytics_stats(integer) from public, anon, authenticated;
grant execute on function public.portfolio_analytics_cleanup() to service_role;
grant execute on function public.portfolio_analytics_ingest(uuid, uuid, jsonb) to service_role;
grant execute on function public.portfolio_analytics_stats(integer) to service_role;

notify pgrst, 'reload schema';
commit;
