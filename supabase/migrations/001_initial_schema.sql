-- ============================================================
-- PulseTrader — Initial Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ── signals ─────────────────────────────────────────────────
create table if not exists public.signals (
  id               uuid primary key default gen_random_uuid(),
  ticker           text not null,
  signal           text not null check (signal in ('BUY', 'SELL', 'HOLD')),
  price            numeric(12, 4),
  rsi              numeric(6, 2),
  ma50             numeric(12, 4),
  ma200            numeric(12, 4),
  sentiment_score  numeric(8, 5),
  technical_score  numeric(8, 5),
  event_score      numeric(8, 5),
  fundamental_score numeric(8, 5),
  final_score      numeric(8, 5),
  created_at       timestamptz not null default now()
);

create index if not exists signals_ticker_idx     on public.signals (ticker);
create index if not exists signals_created_at_idx on public.signals (created_at desc);
create index if not exists signals_signal_idx     on public.signals (signal);

-- ── watchlists ───────────────────────────────────────────────
create table if not exists public.watchlists (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  ticker     text not null,
  created_at timestamptz not null default now(),
  unique (user_id, ticker)
);

create index if not exists watchlists_user_idx on public.watchlists (user_id);

-- ── news_items ───────────────────────────────────────────────
create table if not exists public.news_items (
  id               uuid primary key default gen_random_uuid(),
  ticker           text not null,
  title            text not null,
  source           text,
  url              text,
  published_at     timestamptz,
  sentiment_label  text check (sentiment_label in ('positive', 'negative', 'neutral')),
  sentiment_score  numeric(8, 5),
  news_category    text,
  impact_weight    numeric(4, 2),
  created_at       timestamptz not null default now()
);

create index if not exists news_ticker_idx     on public.news_items (ticker);
create index if not exists news_created_at_idx on public.news_items (created_at desc);

-- deduplicate by URL (regular unique index so PostgREST on_conflict=url can target it)
create unique index if not exists news_url_unique_idx
  on public.news_items (url);

-- ── market_data ──────────────────────────────────────────────
create table if not exists public.market_data (
  id         uuid primary key default gen_random_uuid(),
  ticker     text not null,
  open       numeric(12, 4),
  high       numeric(12, 4),
  low        numeric(12, 4),
  close      numeric(12, 4),
  volume     bigint,
  timestamp  timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists market_data_ticker_ts_idx on public.market_data (ticker, timestamp desc);

-- ── Row Level Security ────────────────────────────────────────
-- signals: readable by all authenticated users, writable by service role only
alter table public.signals enable row level security;

create policy "Authenticated users can read signals"
  on public.signals for select
  using (auth.role() = 'authenticated');

-- watchlists: users see only their own rows
alter table public.watchlists enable row level security;

create policy "Users manage their own watchlist"
  on public.watchlists for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- news_items: readable by authenticated users
alter table public.news_items enable row level security;

create policy "Authenticated users can read news"
  on public.news_items for select
  using (auth.role() = 'authenticated');

-- market_data: readable by authenticated users
alter table public.market_data enable row level security;

create policy "Authenticated users can read market data"
  on public.market_data for select
  using (auth.role() = 'authenticated');

-- ── Real-time ─────────────────────────────────────────────────
-- Enable Supabase Realtime for signals and news
alter publication supabase_realtime add table public.signals;
alter publication supabase_realtime add table public.news_items;
