-- Narrow public-footer aggregate. Apply before deploying portfolio-public-count.
-- This function is callable only by service_role; the Edge response exposes one
-- number. It does not read settings, run cleanup, acquire a row lock, or return
-- visitor identifiers, pages, destinations or individual events.
begin;

create or replace function public.portfolio_analytics_public_count()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object('visitors_90d', count(distinct visitor_id))
  from public.portfolio_analytics_events
  where site = 'adeebnoor.github.io'
    -- Match portfolio_analytics_stats(90): today and the preceding 89 calendar
    -- days in Riyadh, through this transaction's current timestamp.
    and occurred_at >= (
      date_trunc('day', now() at time zone 'Asia/Riyadh')
      - make_interval(days => 89)
    ) at time zone 'Asia/Riyadh'
    and occurred_at <= now();
$$;

revoke all on function public.portfolio_analytics_public_count() from public, anon, authenticated;
grant execute on function public.portfolio_analytics_public_count() to service_role;

notify pgrst, 'reload schema';
commit;
