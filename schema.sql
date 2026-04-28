-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.flights (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clerk_user_id text NOT NULL,
  flight_date date NOT NULL,
  flight_number text,
  aircraft_type text,
  aircraft_registration text,
  origin_iata text,
  destination_iata text,
  block_time_minutes integer CHECK (block_time_minutes IS NULL OR block_time_minutes >= 0),
  pic_time_minutes integer CHECK (pic_time_minutes IS NULL OR pic_time_minutes >= 0),
  sic_time_minutes integer CHECK (sic_time_minutes IS NULL OR sic_time_minutes >= 0),
  night_time_minutes integer CHECK (night_time_minutes IS NULL OR night_time_minutes >= 0),
  instrument_time_minutes integer CHECK (instrument_time_minutes IS NULL OR instrument_time_minutes >= 0),
  remarks text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT flights_pkey PRIMARY KEY (id),
  CONSTRAINT flights_clerk_user_id_fkey FOREIGN KEY (clerk_user_id) REFERENCES public.profiles(clerk_user_id)
);
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clerk_user_id text NOT NULL,
  subscription_id uuid,
  provider text NOT NULL DEFAULT 'razorpay'::text CHECK (provider = 'razorpay'::text),
  provider_order_id text,
  provider_payment_id text UNIQUE,
  provider_signature text,
  amount_in_paise integer NOT NULL CHECK (amount_in_paise >= 0),
  currency text NOT NULL DEFAULT 'INR'::text,
  status text NOT NULL CHECK (status = ANY (ARRAY['created'::text, 'authorized'::text, 'captured'::text, 'failed'::text, 'refunded'::text])),
  payment_method text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_clerk_user_id_fkey FOREIGN KEY (clerk_user_id) REFERENCES public.profiles(clerk_user_id),
  CONSTRAINT payments_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id)
);
CREATE TABLE public.plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  currency text NOT NULL DEFAULT 'INR'::text,
  amount_in_paise integer NOT NULL CHECK (amount_in_paise >= 0),
  billing_cycle text NOT NULL CHECK (billing_cycle = ANY (ARRAY['none'::text, 'monthly'::text, 'yearly'::text])),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT plans_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clerk_user_id text NOT NULL UNIQUE,
  email text,
  full_name text,
  avatar_url text,
  role text NOT NULL DEFAULT 'user'::text CHECK (role = ANY (ARRAY['user'::text, 'admin'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  rank USER-DEFINED,
  default_operating_capacity USER-DEFINED,
  organization text,
  license_type USER-DEFINED,
  license_number text CHECK (license_number IS NULL OR license_number ~ '^[A-Za-z0-9\/-]{3,32}$'::text),
  country text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.roster_imports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clerk_user_id text NOT NULL,
  source text NOT NULL,
  file_name text,
  status text NOT NULL CHECK (status = ANY (ARRAY['processing'::text, 'completed'::text, 'failed'::text])),
  imported_rows integer NOT NULL DEFAULT 0,
  error_message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT roster_imports_pkey PRIMARY KEY (id),
  CONSTRAINT roster_imports_clerk_user_id_fkey FOREIGN KEY (clerk_user_id) REFERENCES public.profiles(clerk_user_id)
);
CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clerk_user_id text NOT NULL,
  plan_code text NOT NULL,
  status text NOT NULL CHECK (status = ANY (ARRAY['trialing'::text, 'active'::text, 'past_due'::text, 'cancelled'::text, 'expired'::text])),
  provider text NOT NULL DEFAULT 'razorpay'::text CHECK (provider = 'razorpay'::text),
  provider_subscription_id text UNIQUE,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT subscriptions_clerk_user_id_fkey FOREIGN KEY (clerk_user_id) REFERENCES public.profiles(clerk_user_id),
  CONSTRAINT subscriptions_plan_code_fkey FOREIGN KEY (plan_code) REFERENCES public.plans(code)
);
CREATE TABLE public.webhook_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  provider text NOT NULL CHECK (provider = ANY (ARRAY['razorpay'::text, 'clerk'::text])),
  event_id text NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  processed boolean NOT NULL DEFAULT false,
  processed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT webhook_events_pkey PRIMARY KEY (id)
);