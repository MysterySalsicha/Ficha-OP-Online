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
-- Storing items in a separate table allows for easier querying/trading,
-- but JSONB inside character is also valid for NoSQL style.
-- Given the requirement for "Realtime" and "Trade", a separate table is better for atomic updates.
create table items (
  id uuid default uuid_generate_v4() primary key,
  character_id uuid references characters(id) on delete cascade not null,
  name text not null,
  category text not null,
  slots integer default 1,
  quantity integer default 1,
  stats jsonb default '{}',
  is_custom boolean default false
);

-- MESSAGES (Chat & Rolls)
create table messages (
  id uuid default uuid_generate_v4() primary key,
  mesa_id uuid references mesas(id) on delete cascade not null,
  user_id uuid references profiles(id),
  character_name text,
  type text not null, -- 'text', 'roll', 'system'
  content text not null, -- JSON string
  is_hidden boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- ROW LEVEL SECURITY (RLS) --

alter table profiles enable row level security;
alter table mesas enable row level security;
alter table characters enable row level security;
alter table items enable row level security;
alter table messages enable row level security;

-- Profiles: Public read, Self update
create policy "Public profiles are viewable by everyone." on profiles for select using ( true );
create policy "Users can insert their own profile." on profiles for insert with check ( auth.uid() = id );
create policy "Users can update own profile." on profiles for update using ( auth.uid() = id );

-- Mesas:
-- Visible if you are the GM or a Player (Player logic requires a join table usually, or checking character.mesa_id)
-- For simplified MVP: Mesas are public to join via code, but details restricted?
-- Let's say: Public read for now to find by ID, or strict check.
create policy "Mesas are viewable by participants" on mesas for select using (
  auth.uid() = gm_id or
  exists (select 1 from characters where characters.mesa_id = mesas.id and characters.user_id = auth.uid())
);
create policy "GM can update mesa" on mesas for update using ( auth.uid() = gm_id );
create policy "Authenticated can create mesa" on mesas for insert with check ( auth.uid() = gm_id );

-- Characters:
-- Viewable by owner AND GM of the table they are in.
-- Other players in same table: View basic info (handled in app or specific columns).
create policy "Characters viewable by owner, GM, and table peers" on characters for select using (
  auth.uid() = user_id or
  exists (select 1 from mesas where mesas.id = characters.mesa_id and mesas.gm_id = auth.uid()) or
  exists (select 1 from characters as c2 where c2.mesa_id = characters.mesa_id and c2.user_id = auth.uid())
);

create policy "Characters updateable by owner or GM" on characters for update using (
  auth.uid() = user_id or
  exists (select 1 from mesas where mesas.id = characters.mesa_id and mesas.gm_id = auth.uid())
);

create policy "Characters insertable by owner" on characters for insert with check ( auth.uid() = user_id );

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

-- REALTIME PUBLICATION
-- Enable realtime for specific tables
alter publication supabase_realtime add table mesas, characters, messages;
