-- Kinetic HR v0.6 pilot database blueprint (Supabase/Postgres)
-- Prepared only; not applied to any live project.
-- Design goals: hard tenant isolation, versioned datasets, append-only evidence, reviewer feedback.

create schema if not exists kinetic;

create table if not exists kinetic.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country_code text not null default 'SA',
  created_at timestamptz not null default now()
);

create table if not exists kinetic.memberships (
  tenant_id uuid not null references kinetic.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('reviewer','analyst','hr_lead','admin')),
  created_at timestamptz not null default now(),
  primary key (tenant_id,user_id)
);

create table if not exists kinetic.datasets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references kinetic.tenants(id) on delete cascade,
  dataset_type text not null check (dataset_type in ('position_snapshot','hr_event_log','ssco_master','skills_master')),
  source_name text,
  source_version text,
  as_of_date date,
  checksum_sha256 text,
  accepted_rows integer not null default 0,
  quarantined_rows integer not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists kinetic.position_snapshots (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references kinetic.tenants(id) on delete cascade,
  dataset_id uuid not null references kinetic.datasets(id) on delete cascade,
  source_row text not null,
  as_of_date date not null,
  sector text not null,
  location_code text not null,
  ssco_code text not null,
  level_code text not null,
  category_code text not null,
  demand_basis text not null,
  required_fte numeric not null check (required_fte >= 0),
  available_fte numeric not null check (available_fte >= 0),
  gap_onset_date date,
  median_time_to_fill_days numeric,
  scarcity_index numeric check (scarcity_index between 0 and 1),
  internal_substitute_fte numeric,
  service_criticality_weight numeric check (service_criticality_weight between 0 and 1),
  service_units_per_gap_fte numeric,
  unique (dataset_id,source_row)
);

create table if not exists kinetic.hr_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references kinetic.tenants(id) on delete cascade,
  dataset_id uuid not null references kinetic.datasets(id) on delete cascade,
  event_id text not null,
  position_id text,
  event_type text not null,
  event_date date not null,
  sector text not null,
  location_code text not null,
  ssco_code text not null,
  level_code text not null,
  category_code text not null,
  capacity_delta_fte numeric not null default 0,
  demand_delta_fte numeric not null default 0,
  unique (dataset_id,event_id)
);

create table if not exists kinetic.alert_cases (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references kinetic.tenants(id) on delete cascade,
  workforce_cell_code text not null,
  status text not null check (status in ('new','assigned','actioned','resolved')),
  owner_user_id uuid references auth.users(id),
  note text,
  signal_payload jsonb not null default '{}'::jsonb,
  opened_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists kinetic.scenarios (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references kinetic.tenants(id) on delete cascade,
  workforce_cell_code text not null,
  input_payload jsonb not null,
  result_payload jsonb not null,
  state_fingerprint text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists kinetic.audit_ledger (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references kinetic.tenants(id) on delete cascade,
  actor_user_id uuid references auth.users(id),
  event_kind text not null,
  entity_type text,
  entity_id text,
  basis_version text,
  state_fingerprint text,
  evidence jsonb not null default '{}'::jsonb,
  recorded_at timestamptz not null default now()
);

create table if not exists kinetic.reviewer_feedback (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references kinetic.tenants(id) on delete cascade,
  reviewer_user_id uuid references auth.users(id),
  reviewer_role text,
  reviewer_years integer,
  review_version text not null,
  state_fingerprint text not null,
  scores jsonb not null default '{}'::jsonb,
  use_intent text,
  strongest text,
  unclear text,
  must_fix text,
  internal_owner text,
  hardest_data text,
  created_at timestamptz not null default now()
);

-- Defense in depth even though `kinetic` should remain outside exposed Data API schemas.
alter table kinetic.tenants enable row level security;
alter table kinetic.memberships enable row level security;
alter table kinetic.datasets enable row level security;
alter table kinetic.position_snapshots enable row level security;
alter table kinetic.hr_events enable row level security;
alter table kinetic.alert_cases enable row level security;
alter table kinetic.scenarios enable row level security;
alter table kinetic.audit_ledger enable row level security;
alter table kinetic.reviewer_feedback enable row level security;

-- Intentionally no permissive policies in this blueprint.
-- Pilot API should be implemented through authenticated server/Edge Functions that verify tenant membership.
-- Do not expose service_role keys to the browser. Keep `kinetic` schema unexposed by default.
