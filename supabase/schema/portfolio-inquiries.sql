-- Additive personal-site intake. No changes to existing analytics or other projects.
begin;
create table public.portfolio_inquiries (
 request_id uuid primary key,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 kind text not null check (kind in ('inquiry','updates')),
 language text not null check (language in ('en','ar')),
 name text not null check (char_length(name) between 2 and 160),
 email text not null check (char_length(email) between 3 and 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
 organization text not null default '' check (char_length(organization)<=160),
 audience text not null default '' check (audience in ('','institution','company','researcher','student')),
 engagement text not null default '' check (engagement in ('','advisory','board','speaking','research','venture','other')),
 timeline text not null default '' check (timeline in ('','soon','quarter','later')),
 authority text not null default '' check (authority in ('','decision_maker','team','individual')),
 problem text not null default '' check (char_length(problem)<=4000),
 consent_at timestamptz not null default now(),
 consent_version text not null default '2026-09-14' check (consent_version='2026-09-14'),
 status text not null check (status in ('new','pending_confirmation','contacted','closed')),
 check (kind='updates' or (audience<>'' and engagement<>'' and timeline<>'' and authority<>'' and char_length(problem)>=20))
);
create index portfolio_inquiries_created_idx on public.portfolio_inquiries(created_at desc);
create table public.portfolio_inquiry_rate (
 bucket text primary key check (char_length(bucket) between 4 and 100),
 count integer not null check (count>0),
 expires_at timestamptz not null
);
alter table public.portfolio_inquiries enable row level security;
alter table public.portfolio_inquiry_rate enable row level security;
revoke all on public.portfolio_inquiries, public.portfolio_inquiry_rate from public, anon, authenticated;
grant select,insert,update,delete on public.portfolio_inquiries, public.portfolio_inquiry_rate to service_role;

create function public.portfolio_inquiry_cleanup() returns void
language sql security invoker set search_path='' as $$
 delete from public.portfolio_inquiries where created_at < now()-interval '180 days';
 delete from public.portfolio_inquiry_rate where expires_at < now();
$$;
revoke all on function public.portfolio_inquiry_cleanup() from public, anon, authenticated;
grant execute on function public.portfolio_inquiry_cleanup() to service_role;

create function public.portfolio_submit_inquiry(p_payload jsonb, p_ip_bucket text, p_email_bucket text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare
 v_id uuid;
 v_global text := 'global:'||to_char(now() at time zone 'UTC','YYYYMMDDHH24');
 v_email text;
 v_existing text;
 v_kind text;
begin
 if p_payload is null or jsonb_typeof(p_payload)<>'object' or (p_payload->>'consent') is distinct from 'true'
    or p_ip_bucket !~ '^ip:[0-9a-f]{64}$' or p_email_bucket !~ '^email:[0-9a-f]{64}$'
    or p_ip_bucket is null or p_email_bucket is null then
   return jsonb_build_object('ok',false,'error','invalid_request');
 end if;
 v_id := (p_payload->>'request_id')::uuid;
 v_email := lower(trim(p_payload->>'email'));
 v_kind := p_payload->>'kind';
 -- One small site, capped to 200 accepted submissions per hour. This transaction
 -- lock makes idempotency, abuse counters and the insert atomic across instances.
 perform pg_catalog.pg_advisory_xact_lock(2146091401);
 perform public.portfolio_inquiry_cleanup();
 select email into v_existing from public.portfolio_inquiries where request_id=v_id;
 if found then
   if v_existing = v_email then return jsonb_build_object('ok',true,'request_id',v_id); end if;
   return jsonb_build_object('ok',false,'error','conflict');
 end if;
 if coalesce((select count from public.portfolio_inquiry_rate where bucket=v_global),0)>=200
    or coalesce((select count from public.portfolio_inquiry_rate where bucket=p_ip_bucket),0)>=10
    or coalesce((select count from public.portfolio_inquiry_rate where bucket=p_email_bucket),0)>=3 then
   return jsonb_build_object('ok',false,'error','rate_limited');
 end if;
 insert into public.portfolio_inquiries(request_id,kind,language,name,email,organization,audience,engagement,timeline,authority,problem,status)
 values (v_id,v_kind,p_payload->>'language',trim(p_payload->>'name'),v_email,
 coalesce(p_payload->>'organization',''),coalesce(p_payload->>'audience',''),coalesce(p_payload->>'engagement',''),
 coalesce(p_payload->>'timeline',''),coalesce(p_payload->>'authority',''),coalesce(p_payload->>'problem',''),
 case when v_kind='updates' then 'pending_confirmation' else 'new' end);
 insert into public.portfolio_inquiry_rate(bucket,count,expires_at)
 values(v_global,1,now()+interval '2 days'),(p_ip_bucket,1,now()+interval '2 days'),(p_email_bucket,1,now()+interval '2 days')
 on conflict(bucket) do update set count=public.portfolio_inquiry_rate.count+1;
 return jsonb_build_object('ok',true,'request_id',v_id);
end;
$$;
revoke all on function public.portfolio_submit_inquiry(jsonb,text,text) from public, anon, authenticated;
grant execute on function public.portfolio_submit_inquiry(jsonb,text,text) to service_role;
commit;
