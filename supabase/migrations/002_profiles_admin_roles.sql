-- ============================================================
-- PulseTrader — Profiles + Admin Roles
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    coalesce(new.email, ''),
    case
      when lower(coalesce(new.email, '')) = lower('parrotflowai@gmail.com') then 'admin'
      else 'user'
    end
  )
  on conflict (id) do update
    set email = excluded.email,
        role = excluded.role,
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

create or replace function public.touch_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profile_updated_at on public.profiles;
create trigger profile_updated_at
before update on public.profiles
for each row execute function public.touch_profile_updated_at();

insert into public.profiles (id, email)
select id, coalesce(email, '')
from auth.users
on conflict (id) do nothing;

create or replace function public.is_admin(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = check_user_id
      and p.role = 'admin'
  );
$$;

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile or admin can read all" on public.profiles;
create policy "Users can read own profile or admin can read all"
  on public.profiles
  for select
  using (id = auth.uid() or public.is_admin());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Seed dedicated admin account role
update public.profiles
set role = 'admin', updated_at = now()
where lower(email) = lower('parrotflowai@gmail.com');
