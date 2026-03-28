-- LeadPulse Database Schema

create table if not exists lp_contacts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  email text default '',
  phone text default '',
  company text default '',
  title text default '',
  source text default 'manual',
  tags jsonb default '[]',
  ai_score integer,
  ai_score_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists lp_deals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  contact_id uuid references lp_contacts(id) on delete cascade not null,
  title text not null,
  value integer default 0,
  stage text check (stage in ('lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost')) default 'lead',
  probability integer default 10,
  expected_close date,
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists lp_activities (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  contact_id uuid references lp_contacts(id) on delete cascade not null,
  deal_id uuid references lp_deals(id) on delete set null,
  type text check (type in ('email', 'call', 'meeting', 'note', 'task')) not null,
  description text not null,
  completed boolean default false,
  due_date timestamptz,
  created_at timestamptz default now()
);

-- RLS
alter table lp_contacts enable row level security;
alter table lp_deals enable row level security;
alter table lp_activities enable row level security;

create policy "Users manage their contacts" on lp_contacts for all using (auth.uid() = user_id);
create policy "Users manage their deals" on lp_deals for all using (auth.uid() = user_id);
create policy "Users manage their activities" on lp_activities for all using (auth.uid() = user_id);

-- Indexes
create index if not exists idx_lp_contacts_user_id on lp_contacts(user_id);
create index if not exists idx_lp_contacts_ai_score on lp_contacts(ai_score);
create index if not exists idx_lp_deals_user_id on lp_deals(user_id);
create index if not exists idx_lp_deals_stage on lp_deals(stage);
create index if not exists idx_lp_deals_contact_id on lp_deals(contact_id);
create index if not exists idx_lp_activities_contact_id on lp_activities(contact_id);
