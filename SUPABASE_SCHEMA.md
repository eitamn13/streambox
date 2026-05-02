# StreamBox Supabase Schema

## Required Tables

Run these SQL commands in your Supabase SQL Editor.

### 1. Subscriptions Table

```sql
create table if not exists public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text default 'free' check (plan in ('free', 'premium')),
  status text default 'active' check (status in ('active', 'cancelled', 'past_due', 'trialing')),
  customer_api_key text unique,
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

-- Enable RLS
alter table public.subscriptions enable row level security;

-- Users can read their own subscription
create policy "Users can view own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Only service role can insert/update
create policy "Service role can manage subscriptions"
  on public.subscriptions for all
  using (false)
  with check (false);

-- Index for customer_api_key lookups
create index idx_subscriptions_customer_api_key on public.subscriptions(customer_api_key);
create index idx_subscriptions_stripe_subscription_id on public.subscriptions(stripe_subscription_id);
```

### 2. Usage Table

```sql
create table if not exists public.usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  movies_watched integer default 0,
  bandwidth_used bigint default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, date)
);

alter table public.usage enable row level security;

create policy "Users can view own usage"
  on public.usage for select
  using (auth.uid() = user_id);

create policy "Service role can manage usage"
  on public.usage for all
  using (false)
  with check (false);
```

### 3. Active Sessions Table (for concurrent stream tracking)

```sql
create table if not exists public.active_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  session_token text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.active_sessions enable row level security;

create policy "Users can manage own sessions"
  on public.active_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

### 4. Increment Usage Function

```sql
create or replace function public.increment_usage(
  p_user_id uuid,
  p_date date
) returns void
language plpgsql
security definer
as $$
begin
  insert into public.usage (user_id, date, movies_watched)
  values (p_user_id, p_date, 1)
  on conflict (user_id, date)
  do update set movies_watched = public.usage.movies_watched + 1,
                updated_at = now();
end;
$$;
```

### 5. Generate Customer API Key Function

```sql
create or replace function public.generate_customer_key()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.customer_api_key is null then
    new.customer_api_key = encode(gen_random_bytes(32), 'hex');
  end if;
  return new;
end;
$$;

create trigger set_customer_api_key
  before insert on public.subscriptions
  for each row
  execute function public.generate_customer_key();
```

## Environment Variables

Add these to your Vercel project:

```
# Supabase (Server-side)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
STRIPE_SECRET_KEY=sk_test_... or sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_... (optional but recommended)
STRIPE_PRICE_ID=price_... (your 35 ILS/month price ID)

# Admin Debrid Keys (for SaaS mode)
ADMIN_RD_API_KEY=your_real_debrid_api_key
ADMIN_PM_API_KEY=your_premiumize_api_key (optional)
ADMIN_TB_API_KEY=your_torbox_api_key (optional)
```

## Stripe Setup

1. Create a Stripe account at https://stripe.com
2. Create a product "StreamBox Premium"
3. Create a price: 35 ILS, recurring monthly
4. Copy the Price ID to `STRIPE_PRICE_ID`
5. Add webhook endpoint: `https://streambox-n5uw.vercel.app/api/webhook`
6. Select events: `checkout.session.completed`, `invoice.payment_failed`, `customer.subscription.deleted`
7. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

## Frontend Environment Variables

```
VITE_TMDB_API_KEY=your_tmdb_key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_STRIPE_PRICE_ID=price_...
```
