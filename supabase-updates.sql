-- ============================================================
-- School Staff Management System — Supabase Update Script
-- Run ALL sections in your Supabase SQL Editor
-- ============================================================

-- ============================================================
-- SECTION 1: FIX SUBJECTS RLS
-- The old 'for all' policy conflicts with the separate read
-- policy. Split into explicit INSERT / UPDATE / DELETE policies.
-- ============================================================

drop policy if exists subjects_write  on subjects;
drop policy if exists subjects_read   on subjects;
drop policy if exists subjects_insert on subjects;
drop policy if exists subjects_update on subjects;
drop policy if exists subjects_delete on subjects;

-- Everyone authenticated can read subjects
create policy subjects_read on subjects
  for select using (auth.uid() is not null);

-- Only principal can add/edit/delete subjects (matches the Settings page UI)
create policy subjects_insert on subjects
  for insert with check (get_user_role() = 'principal');

create policy subjects_update on subjects
  for update using (get_user_role() = 'principal');

create policy subjects_delete on subjects
  for delete using (get_user_role() = 'principal');


-- ============================================================
-- SECTION 2: FIX TIMETABLE RLS
-- Split 'for all' into explicit policies so DELETE is clearly
-- principal-only (consistent with teacher delete security).
-- ============================================================

drop policy if exists timetable_write  on timetable;
drop policy if exists timetable_read   on timetable;
drop policy if exists timetable_insert on timetable;
drop policy if exists timetable_update on timetable;
drop policy if exists timetable_delete on timetable;

create policy timetable_read on timetable
  for select using (auth.uid() is not null);

create policy timetable_insert on timetable
  for insert with check (get_user_role() in ('principal', 'admin_clerk'));

create policy timetable_update on timetable
  for update using (get_user_role() in ('principal', 'admin_clerk'));

create policy timetable_delete on timetable
  for delete using (get_user_role() in ('principal', 'admin_clerk'));


-- ============================================================
-- SECTION 3: FIX EMPLOYMENT HISTORY RLS (same pattern)
-- ============================================================

drop policy if exists history_write  on employment_history;
drop policy if exists history_read   on employment_history;
drop policy if exists history_insert on employment_history;
drop policy if exists history_update on employment_history;
drop policy if exists history_delete on employment_history;

create policy history_read on employment_history
  for select using (auth.uid() is not null);

create policy history_insert on employment_history
  for insert with check (get_user_role() in ('principal', 'admin_clerk'));

create policy history_update on employment_history
  for update using (get_user_role() in ('principal', 'admin_clerk'));

create policy history_delete on employment_history
  for delete using (get_user_role() in ('principal', 'admin_clerk'));


-- ============================================================
-- SECTION 4: STORAGE RLS POLICIES FOR RESUME UPLOADS
-- Run AFTER creating the 'documents' bucket in the dashboard.
-- Supabase Dashboard → Storage → New bucket → name: "documents"
-- → Make it PUBLIC (so resume URLs work in the browser)
-- ============================================================

-- Allow any authenticated user to upload resumes
drop policy if exists documents_upload on storage.objects;
create policy documents_upload on storage.objects
  for insert with check (
    bucket_id = 'documents'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = 'resumes'
  );

-- Allow any authenticated user to read resumes
drop policy if exists documents_read on storage.objects;
create policy documents_read on storage.objects
  for select using (
    bucket_id = 'documents'
    and auth.uid() is not null
  );

-- Only principals and clerks can delete uploaded files
drop policy if exists documents_delete on storage.objects;
create policy documents_delete on storage.objects
  for delete using (
    bucket_id = 'documents'
    and get_user_role() in ('principal', 'admin_clerk')
  );


-- ============================================================
-- SECTION 5: AUTO-CREATE app_users ROW ON SIGNUP
-- When someone signs up via Supabase Auth, they need a matching
-- row in app_users so get_user_role() works. This trigger
-- creates a default 'teacher' row that the principal can later
-- update to the correct role.
-- ============================================================

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.app_users (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'teacher'  -- default role; principal upgrades as needed
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();


-- ============================================================
-- SECTION 6: ADD MISSING INDEXES FOR PERFORMANCE
-- These speed up the queries the dashboard and timetable use.
-- ============================================================

create index if not exists idx_teachers_status          on teachers(status);
create index if not exists idx_teachers_employment_type on teachers(employment_type);
create index if not exists idx_teachers_created_at      on teachers(created_at desc);
create index if not exists idx_timetable_teacher_id     on timetable(teacher_id);
create index if not exists idx_timetable_day_period     on timetable(day, period);
create index if not exists idx_employment_history_tid   on employment_history(teacher_id);


-- ============================================================
-- SECTION 7: SEED MISSING SUBJECT DEPARTMENTS
-- The new SubjectsManager uses these department names.
-- Update existing subjects to use the new standardised labels.
-- ============================================================

update subjects set department = 'Arts'             where department = 'Aesthetics';
update subjects set department = 'Physical Education' where name = 'Physical Education';
update subjects set department = 'Technology'       where name = 'Information Tech';

-- Add any subjects that may be missing
insert into subjects (name, department) values
  ('Combined Maths',    'Mathematics'),
  ('Business Studies',  'Commerce'),
  ('Health Science',    'Science')
on conflict (name) do nothing;


-- ============================================================
-- SECTION 8: ADD GRADE COLUMN TO TEACHERS TABLE
-- ============================================================
alter table teachers add column if not exists grade text;
