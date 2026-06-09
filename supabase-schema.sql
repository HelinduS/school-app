-- ============================================================
-- School Staff Management System — Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. App users table (linked to Supabase Auth)
create table if not exists app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role text not null check (role in ('principal', 'admin_clerk', 'teacher')),
  teacher_id uuid,
  created_at timestamptz default now()
);

-- 2. Subjects
create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  department text
);

-- 3. Teachers
create table if not exists teachers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Personal
  full_name text not null,
  name_with_initials text not null,
  date_of_birth date not null,
  gender text not null check (gender in ('male', 'female', 'other')),
  nic text not null unique,
  phone text not null,
  email text,
  address text not null,

  -- Employment
  designation text not null,
  grade text,
  employment_type text not null check (employment_type in ('permanent', 'contract', 'temporary')),
  status text not null default 'active' check (status in ('active', 'on_leave', 'transferred', 'retired')),
  date_joined date not null,
  subject_ids uuid[] default '{}',

  -- Transfer information
  transferred_to text,

  -- Education
  highest_qualification text not null,
  university_or_institute text,
  graduation_year integer,

  -- Resume
  resume_url text,

  notes text
);

-- Link app_users.teacher_id back to teachers
alter table app_users
  add constraint app_users_teacher_fk
  foreign key (teacher_id) references teachers(id) on delete set null;

-- 4. Employment history
create table if not exists employment_history (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references teachers(id) on delete cascade,
  school_name text not null,
  designation text not null,
  date_from date not null,
  date_to date,
  years_of_experience integer,
  reason_for_leaving text
);

-- 5. Timetable
create table if not exists timetable (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references teachers(id) on delete cascade,
  day text not null check (day in ('monday', 'tuesday', 'wednesday', 'thursday', 'friday')),
  period integer not null check (period between 1 and 12),
  subject_id uuid not null references subjects(id),
  grade text not null,
  class_name text not null,
  room text,
  unique (teacher_id, day, period)
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists teachers_updated_at on teachers;
create trigger teachers_updated_at before update on teachers
  for each row execute function update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table app_users enable row level security;
alter table teachers enable row level security;
alter table subjects enable row level security;
alter table timetable enable row level security;
alter table employment_history enable row level security;

-- Helper function to get role
create or replace function get_user_role()
returns text as $$
  select role from app_users where id = auth.uid()
$$ language sql security definer;

-- app_users: users can read their own profile; principals see all
drop policy if exists app_users_read on app_users;
create policy app_users_read on app_users for select
  using (auth.uid() = id or get_user_role() = 'principal');

drop policy if exists app_users_principal_insert on app_users;
create policy app_users_principal_insert on app_users for insert
  with check (get_user_role() = 'principal');

drop policy if exists app_users_principal_update on app_users;
create policy app_users_principal_update on app_users for update
  using (get_user_role() = 'principal');

-- teachers: authenticated users can read
drop policy if exists teachers_read on teachers;
create policy teachers_read on teachers for select
  using (auth.uid() is not null);

drop policy if exists teachers_write on teachers;
create policy teachers_write on teachers for all
  using (get_user_role() in ('principal', 'admin_clerk'))
  with check (get_user_role() in ('principal', 'admin_clerk'));

drop policy if exists teachers_delete on teachers;
create policy teachers_delete on teachers for delete
  using (get_user_role() = 'principal');

-- subjects: everyone reads, principal/clerk writes
drop policy if exists subjects_read on subjects;
create policy subjects_read on subjects for select using (auth.uid() is not null);

drop policy if exists subjects_write on subjects;
create policy subjects_write on subjects for all
  using (get_user_role() in ('principal', 'admin_clerk'))
  with check (get_user_role() in ('principal', 'admin_clerk'));

-- timetable: everyone reads, principal/clerk writes
drop policy if exists timetable_read on timetable;
create policy timetable_read on timetable for select using (auth.uid() is not null);

drop policy if exists timetable_write on timetable;
create policy timetable_write on timetable for all
  using (get_user_role() in ('principal', 'admin_clerk'))
  with check (get_user_role() in ('principal', 'admin_clerk'));

-- employment_history: same as timetable
drop policy if exists history_read on employment_history;
create policy history_read on employment_history for select using (auth.uid() is not null);

drop policy if exists history_write on employment_history;
create policy history_write on employment_history for all
  using (get_user_role() in ('principal', 'admin_clerk'))
  with check (get_user_role() in ('principal', 'admin_clerk'));

-- ============================================================
-- STORAGE BUCKET FOR DOCUMENTS
-- ============================================================

-- Create a storage bucket for resumes and other documents
-- In Supabase Dashboard → Storage → Create bucket named 'documents'
-- Make it private (not public) and set up RLS policies

-- RLS policies for storage (run these in SQL Editor after creating bucket):
-- Allow authenticated users to upload their own files
-- Allow principals and admin clerks to view all files

insert into subjects (name, department) values
  ('Sinhala',              'Languages'),
  ('Tamil',                'Languages'),
  ('English',              'Languages'),
  ('Mathematics',          'Mathematics'),
  ('Science',              'Science'),
  ('Physics',              'Science'),
  ('Chemistry',            'Science'),
  ('Biology',              'Science'),
  ('Information Tech',     'Technology'),
  ('History',              'Social Studies'),
  ('Geography',            'Social Studies'),
  ('Civic Education',      'Social Studies'),
  ('Buddhism',             'Religion'),
  ('Christianity',         'Religion'),
  ('Hinduism',             'Religion'),
  ('Islam',                'Religion'),
  ('Art',                  'Aesthetics'),
  ('Music',                'Aesthetics'),
  ('Dancing',              'Aesthetics'),
  ('Drama',                'Aesthetics'),
  ('Physical Education',   'PE'),
  ('Commerce',             'Commerce'),
  ('Accounting',           'Commerce'),
  ('Economics',            'Commerce'),
  ('Agriculture',          'Practical Studies'),
  ('Home Economics',       'Practical Studies')
on conflict (name) do nothing;
