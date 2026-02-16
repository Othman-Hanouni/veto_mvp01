-- Extensions
create extension if not exists pgcrypto;

-- Tables
create table if not exists public.vets (
  id uuid primary key references auth.users(id) on delete cascade,
  clinic_name text,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.owners (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  email text,
  address text,
  created_at timestamptz not null default now()
);

create table if not exists public.dogs (
  id uuid primary key default gen_random_uuid(),
  microchip_number text not null unique,
  name text not null,
  breed text,
  birthdate date,
  status text not null default 'normal' check (status in ('normal','lost','stolen','found')),
  owner_id uuid not null references public.owners(id),
  primary_vet_id uuid not null references public.vets(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vaccines (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs(id) on delete cascade,
  vaccine_name text not null,
  vaccine_date date not null,
  next_due_date date,
  created_by_vet_id uuid not null references public.vets(id),
  created_at timestamptz not null default now()
);

create table if not exists public.status_events (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs(id) on delete cascade,
  status text not null check (status in ('normal','lost','stolen','found')),
  notes text,
  created_by_vet_id uuid not null references public.vets(id),
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  entity text not null,
  entity_id uuid not null,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  created_by_vet_id uuid not null references public.vets(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_dogs_microchip_number on public.dogs (microchip_number);
create index if not exists idx_vaccines_dog_id on public.vaccines (dog_id);
create index if not exists idx_status_events_dog_id on public.status_events (dog_id);
create index if not exists idx_audit_logs_entity_id on public.audit_logs (entity, entity_id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_dogs_updated_at on public.dogs;
create trigger trg_dogs_updated_at
before update on public.dogs
for each row execute function public.set_updated_at();

-- RLS
alter table public.vets enable row level security;
alter table public.owners enable row level security;
alter table public.dogs enable row level security;
alter table public.vaccines enable row level security;
alter table public.status_events enable row level security;
alter table public.audit_logs enable row level security;

-- vets
create policy "vets_can_view_own_profile" on public.vets
for select to authenticated
using (auth.uid() = id);

create policy "vets_can_upsert_own_profile" on public.vets
for all to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- dogs are viewable by any authenticated vet
create policy "authenticated_can_view_dogs" on public.dogs
for select to authenticated
using (true);

-- only primary vet can insert dog with their uid as primary_vet_id
create policy "primary_vet_can_create_dogs" on public.dogs
for insert to authenticated
with check (
  auth.uid() = primary_vet_id
  and exists (select 1 from public.vets v where v.id = auth.uid())
);

-- only primary vet can edit critical dog fields + status
create policy "primary_vet_can_update_dogs" on public.dogs
for update to authenticated
using (auth.uid() = primary_vet_id)
with check (auth.uid() = primary_vet_id);

-- owners: readable by authenticated users
create policy "authenticated_can_view_owners" on public.owners
for select to authenticated
using (true);

-- any authenticated vet can create owner (new registration or transfer flow)
create policy "authenticated_can_insert_owners" on public.owners
for insert to authenticated
with check (true);

-- only primary vet of dog using this owner can update owner info
create policy "primary_vet_can_update_owner_linked_to_dog" on public.owners
for update to authenticated
using (
  exists (
    select 1 from public.dogs d
    where d.owner_id = owners.id and d.primary_vet_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.dogs d
    where d.owner_id = owners.id and d.primary_vet_id = auth.uid()
  )
);

-- vaccines: any authenticated vet can read/add
create policy "authenticated_can_view_vaccines" on public.vaccines
for select to authenticated
using (true);

create policy "authenticated_can_add_vaccines" on public.vaccines
for insert to authenticated
with check (auth.uid() = created_by_vet_id);

-- status events: any authenticated vet can read/add
create policy "authenticated_can_view_status_events" on public.status_events
for select to authenticated
using (true);

create policy "authenticated_can_add_status_events" on public.status_events
for insert to authenticated
with check (auth.uid() = created_by_vet_id);

-- audit logs visible to authenticated vets and insert limited to creator
create policy "authenticated_can_view_audit_logs" on public.audit_logs
for select to authenticated
using (true);

create policy "authenticated_can_insert_audit_logs" on public.audit_logs
for insert to authenticated
with check (auth.uid() = created_by_vet_id);
