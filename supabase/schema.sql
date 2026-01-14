-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES (Users)
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- MESAS (Tables)
create table mesas (
  id uuid default uuid_generate_v4() primary key,
  code text unique not null,
  gm_id uuid references profiles(id) not null,
  name text not null,
  is_active boolean default true,
  settings jsonb default '{"survivor_mode": false}',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- CHARACTERS (Sheets)
create table characters (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) not null,
  mesa_id uuid references mesas(id), -- Can be null if not in a table yet? Or mandatory?
  name text not null,
  class text not null,
  nex integer default 5,
  patente text default 'Recruta',

  -- JSONB stores the complex rigid data (attributes, skills, stats)
  attributes jsonb not null,
  stats_max jsonb not null,
  stats_current jsonb not null,
  defenses jsonb not null,
  skills jsonb default '{}',
  powers jsonb default '[]',
  rituals jsonb default '[]',
  inventory_slots_max integer default 5,

  -- Flags
  status_flags jsonb default '{"vida": "vivo", "mental": "sao"}',
  is_gm_mode boolean default false,

  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- ITEMS (Inventory Items linked to characters)
create table items (
  id uuid default uuid_generate_v4() primary key,
  character_id uuid references characters(id) on delete cascade not null,
  name text not null,
  category text not null,
  slots integer default 1,
  quantity integer default 1,
  stats jsonb default '{}',

  -- Weapon Specifics
  critical_range integer,
  critical_multiplier integer,
  damage_dice text,

  is_custom boolean default false
);

-- MESSAGES (Chat & Rolls)
create table messages (
  id uuid default uuid_generate_v4() primary key,
  mesa_id uuid references mesas(id) on delete cascade not null,
  user_id uuid references profiles(id),
  character_name text,
  type text not null, -- 'text', 'roll', 'item_transfer', 'system'
  content text not null, -- JSON string
  is_hidden boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- LIBRARY / SEED DATA TABLES
-- These tables store the immutable game data (Standard items, rituals, monsters)
create table library_items (
    id text primary key, -- e.g. "item_pistola"
    name text not null,
    category text not null,
    slots integer default 1,
    stats jsonb default '{}',
    critical_range integer,
    critical_multiplier integer,
    damage_dice text,
    description text
);

create table library_rituals (
    id text primary key,
    name text not null,
    element text not null,
    circle integer not null,
    cost_pe integer not null,
    data jsonb default '{}' -- Range, Target, Duration, etc.
);

create table library_monsters (
    id text primary key,
    name text not null,
    vd integer,
    data jsonb default '{}' -- Full stats
);

-- ROW LEVEL SECURITY (RLS) --

alter table profiles enable row level security;
alter table mesas enable row level security;
alter table characters enable row level security;
alter table items enable row level security;
alter table messages enable row level security;
-- Library tables are usually public read-only
alter table library_items enable row level security;
alter table library_rituals enable row level security;
alter table library_monsters enable row level security;

-- Profiles: Public read, Self update
create policy "Public profiles are viewable by everyone." on profiles for select using ( true );
create policy "Users can insert their own profile." on profiles for insert with check ( auth.uid() = id );
create policy "Users can update own profile." on profiles for update using ( auth.uid() = id );

-- Mesas:
-- Visible if you are the GM or a Player (Player logic requires a join table usually, or checking character.mesa_id)
-- Strict Rule: Read allowed if GM or if you have a character in it.
-- Added: Allow finding by exact code to facilitate joining.
create policy "Mesas viewable by GM, Participants, or by Exact Code" on mesas for select using (
  auth.uid() = gm_id or
  code = current_setting('request.headers')::json->>'mesa_code' or -- (hypothetical, better handled via RPC for Join)
  exists (select 1 from characters where characters.mesa_id = mesas.id and characters.user_id = auth.uid())
);

-- BETTER APPROACH FOR JOIN: Use a Function (RPC) to join, bypassing RLS read strictness for the join action.
-- And keep RLS strict for listing.
-- For now, let's keep the policy simple but secure enough.
-- Allow reading ANY mesa if you know its ID or Code? No, that exposes data.
-- We will use a PostgreSQL function `join_mesa(code)` to handle the join logic securely.

create policy "Mesas viewable by GM or Participants" on mesas for select using (
  auth.uid() = gm_id or
  exists (select 1 from characters where characters.mesa_id = mesas.id and characters.user_id = auth.uid())
);

create policy "GM can update mesa" on mesas for update using ( auth.uid() = gm_id );
create policy "Authenticated can create mesa" on mesas for insert with check ( auth.uid() = gm_id );

-- Characters:
-- Read: Owner, GM, or Table Peers.
create policy "Characters viewable by owner, GM, and peers" on characters for select using (
  auth.uid() = user_id or
  exists (select 1 from mesas where mesas.id = characters.mesa_id and mesas.gm_id = auth.uid()) or
  exists (select 1 from characters as c2 where c2.mesa_id = characters.mesa_id and c2.user_id = auth.uid())
);

-- Write: Strict - Only Owner or GM.
create policy "Characters updateable by owner or GM" on characters for update using (
  auth.uid() = user_id or
  exists (select 1 from mesas where mesas.id = characters.mesa_id and mesas.gm_id = auth.uid())
);

create policy "Characters insertable by owner" on characters for insert with check ( auth.uid() = user_id );

-- Items:
-- Inherits permissions from Character basically.
create policy "Items viewable by character context" on items for select using (
   exists (select 1 from characters where characters.id = items.character_id and (
      characters.user_id = auth.uid() or
      exists (select 1 from mesas where mesas.id = characters.mesa_id and mesas.gm_id = auth.uid()) or
      exists (select 1 from characters as c2 where c2.mesa_id = characters.mesa_id and c2.user_id = auth.uid())
   ))
);

create policy "Items modifiable by character owner or GM" on items for all using (
   exists (select 1 from characters where characters.id = items.character_id and (
      characters.user_id = auth.uid() or
      exists (select 1 from mesas where mesas.id = characters.mesa_id and mesas.gm_id = auth.uid())
   ))
);

-- Messages:
-- Viewable by table participants
create policy "Messages viewable by table participants" on messages for select using (
   exists (select 1 from characters where characters.mesa_id = messages.mesa_id and characters.user_id = auth.uid()) or
   exists (select 1 from mesas where mesas.id = messages.mesa_id and mesas.gm_id = auth.uid())
);

create policy "Messages insertable by participants" on messages for insert with check (
   exists (select 1 from characters where characters.mesa_id = messages.mesa_id and characters.user_id = auth.uid()) or
   exists (select 1 from mesas where mesas.id = messages.mesa_id and mesas.gm_id = auth.uid())
);

-- Library Policies
create policy "Library Public Read" on library_items for select using (true);
create policy "Library Public Read R" on library_rituals for select using (true);
create policy "Library Public Read M" on library_monsters for select using (true);

-- REALTIME PUBLICATION
-- Enable realtime for specific tables
alter publication supabase_realtime add table mesas, characters, messages, items;

-- RPC FUNCTION TO RESOLVE MESA CODE (To Fix Join Issue)
-- This allows a user to get the ID of a mesa by code without needing general SELECT permission on all mesas.
create or replace function get_mesa_by_code(code_input text)
returns table (id uuid, name text, gm_id uuid)
language sql
security definer
as $$
  select id, name, gm_id from mesas where code = code_input limit 1;
$$;
