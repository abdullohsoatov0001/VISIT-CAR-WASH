-- VISIT Car Wash — Database Schema
-- Запусти этот файл в Supabase SQL Editor

-- ─── PROFILES (расширение auth.users) ────────────────────
create table if not exists public.profiles (
  id            uuid references auth.users(id) on delete cascade primary key,
  name          text not null default '',
  phone         text unique,
  role          text not null default 'USER',
  avatar_url    text,
  loyalty_points int default 0,
  loyalty_tier  text default 'Bronze',
  is_verified   boolean default false,
  is_active     boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ─── VEHICLES ─────────────────────────────────────────────
create table if not exists public.vehicles (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references public.profiles(id) on delete cascade not null,
  make          text not null,
  model         text not null,
  year          int not null,
  color         text not null,
  plate_number  text,
  is_default    boolean default false,
  health_score  int default 100,
  last_washed_at timestamptz,
  created_at    timestamptz default now()
);

-- ─── ADDRESSES ────────────────────────────────────────────
create table if not exists public.addresses (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references public.profiles(id) on delete cascade not null,
  label         text not null,
  full_address  text not null,
  lat           float not null default 0,
  lng           float not null default 0,
  is_default    boolean default false,
  created_at    timestamptz default now()
);

-- ─── ORDERS ───────────────────────────────────────────────
create table if not exists public.orders (
  id              uuid default gen_random_uuid() primary key,
  order_number    text unique not null,
  user_id         uuid references public.profiles(id) on delete cascade not null,
  worker_id       uuid references public.profiles(id),
  service_type    text not null,
  addons          text[] default '{}',
  notes           text,
  address_id      uuid references public.addresses(id),
  location_lat    float default 0,
  location_lng    float default 0,
  location_name   text default '',
  scheduled_at    timestamptz,
  accepted_at     timestamptz,
  started_at      timestamptz,
  completed_at    timestamptz,
  estimated_minutes int,
  status          text default 'PENDING',
  base_price      float default 0,
  addons_price    float default 0,
  discount        float default 0,
  total_price     float default 0,
  before_photos   text[] default '{}',
  after_photos    text[] default '{}',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ─── PAYMENTS ─────────────────────────────────────────────
create table if not exists public.payments (
  id            uuid default gen_random_uuid() primary key,
  order_id      uuid references public.orders(id) on delete cascade unique not null,
  user_id       uuid references public.profiles(id) not null,
  amount        float not null,
  method        text not null,
  status        text default 'PENDING',
  transaction_id text,
  refunded_at   timestamptz,
  refund_amount float,
  created_at    timestamptz default now()
);

-- ─── SUBSCRIPTIONS ────────────────────────────────────────
create table if not exists public.subscriptions (
  id                    uuid default gen_random_uuid() primary key,
  user_id               uuid references public.profiles(id) on delete cascade unique not null,
  plan                  text not null,
  status                text default 'ACTIVE',
  washes_left           int not null,
  washes_total          int not null,
  price_per_cycle       float not null,
  current_period_start  timestamptz not null,
  current_period_end    timestamptz not null,
  auto_renew            boolean default true,
  cancelled_at          timestamptz,
  created_at            timestamptz default now()
);

-- ─── REVIEWS ──────────────────────────────────────────────
create table if not exists public.reviews (
  id            uuid default gen_random_uuid() primary key,
  order_id      uuid references public.orders(id) on delete cascade unique not null,
  user_id       uuid references public.profiles(id) not null,
  worker_id     uuid references public.profiles(id) not null,
  rating        int not null check (rating >= 1 and rating <= 5),
  comment       text,
  tags          text[] default '{}',
  worker_response text,
  created_at    timestamptz default now()
);

-- ─── NOTIFICATIONS ────────────────────────────────────────
create table if not exists public.notifications (
  id        uuid default gen_random_uuid() primary key,
  user_id   uuid references public.profiles(id) on delete cascade not null,
  type      text not null,
  title     text not null,
  body      text not null,
  is_read   boolean default false,
  data      jsonb,
  created_at timestamptz default now()
);

-- ─── AUTO-CREATE PROFILE ON SIGNUP ───────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), 'User'),
    'USER'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── ROW LEVEL SECURITY ───────────────────────────────────
alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.payments enable row level security;
alter table public.subscriptions enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;

-- Profiles
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Vehicles
create policy "Users can manage own vehicles" on public.vehicles for all using (auth.uid() = user_id);

-- Addresses
create policy "Users can manage own addresses" on public.addresses for all using (auth.uid() = user_id);

-- Orders
create policy "Users can view own orders" on public.orders for select using (auth.uid() = user_id);
create policy "Users can create orders" on public.orders for insert with check (auth.uid() = user_id);
create policy "Users can update own orders" on public.orders for update using (auth.uid() = user_id);

-- Payments
create policy "Users can view own payments" on public.payments for select using (auth.uid() = user_id);

-- Subscriptions
create policy "Users can view own subscription" on public.subscriptions for select using (auth.uid() = user_id);

-- Reviews
create policy "Reviews viewable by all" on public.reviews for select using (true);
create policy "Users can write reviews" on public.reviews for insert with check (auth.uid() = user_id);

-- Notifications
create policy "Users can view own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "Users can update own notifications" on public.notifications for update using (auth.uid() = user_id);
