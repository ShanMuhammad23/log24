-- Initial schema for Log24
-- Stack assumptions:
-- - Auth: Clerk (clerk_user_id stored in app tables)
-- - Payments: Razorpay (payment + subscription ids stored for reconciliation)

create extension if not exists pgcrypto;

-- =========================
-- Core user/profile tables
-- =========================
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique,
  email text,
  full_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_clerk_user_id on public.profiles(clerk_user_id);

-- =========================
-- Billing/plans
-- =========================
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique, -- e.g. free, pro_monthly, pro_yearly
  name text not null,
  currency text not null default 'INR',
  amount_in_paise integer not null check (amount_in_paise >= 0),
  billing_cycle text not null check (billing_cycle in ('none', 'monthly', 'yearly')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null references public.profiles(clerk_user_id) on delete cascade,
  plan_code text not null references public.plans(code),
  status text not null check (status in ('trialing', 'active', 'past_due', 'cancelled', 'expired')),
  provider text not null default 'razorpay' check (provider in ('razorpay')),
  provider_subscription_id text unique, -- razorpay_subscription_id
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_subscriptions_user on public.subscriptions(clerk_user_id);
create index if not exists idx_subscriptions_status on public.subscriptions(status);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null references public.profiles(clerk_user_id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  provider text not null default 'razorpay' check (provider in ('razorpay')),
  provider_order_id text,            -- razorpay_order_id
  provider_payment_id text unique,   -- razorpay_payment_id
  provider_signature text,           -- razorpay_signature
  amount_in_paise integer not null check (amount_in_paise >= 0),
  currency text not null default 'INR',
  status text not null check (status in ('created', 'authorized', 'captured', 'failed', 'refunded')),
  payment_method text,               -- card, upi, netbanking, wallet, etc.
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payments_user on public.payments(clerk_user_id);
create index if not exists idx_payments_order_id on public.payments(provider_order_id);

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('razorpay', 'clerk')),
  event_id text not null,
  event_type text not null,
  payload jsonb not null,
  processed boolean not null default false,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, event_id)
);

create index if not exists idx_webhook_events_processed on public.webhook_events(processed);

-- =========================
-- App domain tables (MVP)
-- =========================
create table if not exists public.flights (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null references public.profiles(clerk_user_id) on delete cascade,
  flight_date date not null,
  flight_number text,
  aircraft_type text,
  aircraft_registration text,
  origin_iata text,
  destination_iata text,
  block_time_minutes integer check (block_time_minutes is null or block_time_minutes >= 0),
  pic_time_minutes integer check (pic_time_minutes is null or pic_time_minutes >= 0),
  sic_time_minutes integer check (sic_time_minutes is null or sic_time_minutes >= 0),
  night_time_minutes integer check (night_time_minutes is null or night_time_minutes >= 0),
  instrument_time_minutes integer check (instrument_time_minutes is null or instrument_time_minutes >= 0),
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_flights_user_date on public.flights(clerk_user_id, flight_date desc);

create table if not exists public.roster_imports (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null references public.profiles(clerk_user_id) on delete cascade,
  source text not null, -- airline/system name
  file_name text,
  status text not null check (status in ('processing', 'completed', 'failed')),
  imported_rows integer not null default 0,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_roster_imports_user on public.roster_imports(clerk_user_id, created_at desc);

-- =========================
-- Timestamp helper trigger
-- =========================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_plans_updated_at on public.plans;
create trigger trg_plans_updated_at
before update on public.plans
for each row execute function public.set_updated_at();

drop trigger if exists trg_subscriptions_updated_at on public.subscriptions;
create trigger trg_subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

drop trigger if exists trg_payments_updated_at on public.payments;
create trigger trg_payments_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

drop trigger if exists trg_flights_updated_at on public.flights;
create trigger trg_flights_updated_at
before update on public.flights
for each row execute function public.set_updated_at();

drop trigger if exists trg_roster_imports_updated_at on public.roster_imports;
create trigger trg_roster_imports_updated_at
before update on public.roster_imports
for each row execute function public.set_updated_at();

-- =========================
-- Seed plans
-- =========================
insert into public.plans (code, name, currency, amount_in_paise, billing_cycle, is_active)
values
  ('free', 'Free', 'INR', 0, 'none', true),
  ('pro_monthly', 'Pro Monthly', 'INR', 49900, 'monthly', true),
  ('pro_yearly', 'Pro Yearly', 'INR', 499900, 'yearly', true)
on conflict (code) do update
set
  name = excluded.name,
  currency = excluded.currency,
  amount_in_paise = excluded.amount_in_paise,
  billing_cycle = excluded.billing_cycle,
  is_active = excluded.is_active;
