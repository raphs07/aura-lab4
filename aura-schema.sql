-- =====================================================
-- AURA - Estrutura inicial do banco (Supabase)
-- Rode UMA vez no SQL Editor.
-- =====================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  account_type text not null check (account_type in ('client', 'business')),
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.business_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  trade_name text not null,
  cnpj text not null unique check (cnpj ~ '^[0-9]{14}$'),
  establishment_type text not null,
  responsible_name text not null,
  phone text not null,
  safe_zone_opt_in boolean not null default false,
  safe_zone_status text not null default 'not_requested'
    check (safe_zone_status in ('not_requested', 'pending', 'approved', 'rejected'))
);

create table public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  phone text not null,
  relationship text,
  created_at timestamptz not null default now()
);

-- Cria o perfil automaticamente quando alguém se cadastra
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  account_type_value text;
  safe_zone_value boolean;
begin
  account_type_value := coalesce(new.raw_user_meta_data ->> 'account_type', 'client');

  if account_type_value not in ('client', 'business') then
    raise exception 'Tipo de conta inválido';
  end if;

  insert into public.profiles (id, account_type, full_name, phone)
  values (
    new.id,
    account_type_value,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', '')
  );

  if account_type_value = 'business' then
    safe_zone_value := coalesce(
      new.raw_user_meta_data ->> 'safe_zone_opt_in' = 'true',
      false
    );

    insert into public.business_profiles (
      user_id,
      trade_name,
      cnpj,
      establishment_type,
      responsible_name,
      phone,
      safe_zone_opt_in,
      safe_zone_status
    )
    values (
      new.id,
      new.raw_user_meta_data ->> 'trade_name',
      new.raw_user_meta_data ->> 'cnpj',
      new.raw_user_meta_data ->> 'establishment_type',
      new.raw_user_meta_data ->> 'responsible_name',
      new.raw_user_meta_data ->> 'phone',
      safe_zone_value,
      case when safe_zone_value then 'pending' else 'not_requested' end
    );
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Segurança: a função do gatilho não precisa ser chamável pela API
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Liga a RLS (cada pessoa só enxerga os próprios dados)
alter table public.profiles enable row level security;
alter table public.business_profiles enable row level security;
alter table public.emergency_contacts enable row level security;

create policy "Read own profile"
on public.profiles for select to authenticated
using (id = (select auth.uid()));

create policy "Update own profile"
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy "Read own business profile"
on public.business_profiles for select to authenticated
using (user_id = (select auth.uid()));

create policy "Update own business profile"
on public.business_profiles for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Manage own emergency contacts"
on public.emergency_contacts for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

-- Permissões mínimas
revoke all on public.profiles, public.business_profiles,
  public.emergency_contacts from anon, authenticated;

grant select on public.profiles, public.business_profiles to authenticated;
grant update (full_name, phone, avatar_url)
  on public.profiles to authenticated;
grant update (trade_name, establishment_type, responsible_name, phone)
  on public.business_profiles to authenticated;
grant select, insert, update, delete
  on public.emergency_contacts to authenticated;
