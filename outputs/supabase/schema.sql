-- Learnly workspace schema
-- Run this file in Supabase SQL Editor before using the dashboard.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  topic text not null default 'General',
  description text not null default '',
  level text not null default 'Beginner',
  lessons_count integer not null default 0 check (lessons_count >= 0),
  estimated_minutes integer not null default 0 check (estimated_minutes >= 0),
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, course_id)
);

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  position integer not null default 1,
  duration_minutes integer not null default 15 check (duration_minutes >= 0),
  content text not null default '',
  unique (course_id, position)
);

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create table if not exists public.learning_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_date date not null default current_date,
  minutes integer not null default 0 check (minutes >= 0),
  unique (user_id, activity_date)
);

create index if not exists enrollments_user_idx on public.enrollments(user_id);
create index if not exists bookmarks_user_idx on public.bookmarks(user_id);
create index if not exists lessons_course_idx on public.lessons(course_id, position);
create index if not exists lesson_progress_user_idx on public.lesson_progress(user_id);
create index if not exists learning_activity_user_date_idx on public.learning_activity(user_id, activity_date);

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.enrollments enable row level security;
alter table public.bookmarks enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.learning_activity enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile" on public.profiles for select to authenticated using (auth.uid() = id);
drop policy if exists "Users can create own profile" on public.profiles;
create policy "Users can create own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Published courses are readable" on public.courses;
create policy "Published courses are readable" on public.courses for select to authenticated using (is_published = true);
drop policy if exists "Published lessons are readable" on public.lessons;
create policy "Published lessons are readable" on public.lessons for select to authenticated using (exists (select 1 from public.courses c where c.id = public.lessons.course_id and c.is_published = true));

drop policy if exists "Users manage own enrollments" on public.enrollments;
create policy "Users manage own enrollments" on public.enrollments for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users manage own bookmarks" on public.bookmarks;
create policy "Users manage own bookmarks" on public.bookmarks for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users manage own lesson progress" on public.lesson_progress;
create policy "Users manage own lesson progress" on public.lesson_progress for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users manage own activity" on public.learning_activity;
create policy "Users manage own activity" on public.learning_activity for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

insert into public.courses (id, title, topic, description, level, lessons_count, estimated_minutes)
values
('10000000-0000-4000-8000-000000000001','UI Design Fundamentals','Design','Learn visual hierarchy, layout, typography, and practical interface design.','Beginner',3,75),
('10000000-0000-4000-8000-000000000002','JavaScript: The Essentials','Development','Build a strong foundation in JavaScript syntax, functions, and browser interactions.','Beginner',3,90),
('10000000-0000-4000-8000-000000000003','Brand Strategy 101','Marketing','Understand positioning, audience research, and the foundations of a memorable brand.','Beginner',3,60)
on conflict (id) do nothing;

insert into public.lessons (id, course_id, title, position, duration_minutes, content)
values
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Design principles and visual hierarchy',1,25,'Explore contrast, alignment, proximity, and the visual order that helps people understand an interface.'),
('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','Layout, spacing, and grids',2,25,'Learn to build consistent layouts with spacing systems and responsive grids.'),
('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000001','Typography and accessible color',3,25,'Choose readable type scales and color combinations that support accessible interfaces.'),
('20000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000002','JavaScript values and variables',1,30,'Understand values, data types, and variables in modern JavaScript.'),
('20000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-000000000002','Functions and control flow',2,30,'Use functions, conditions, and loops to express program logic.'),
('20000000-0000-4000-8000-000000000006','10000000-0000-4000-8000-000000000002','Working with the DOM',3,30,'Connect JavaScript to the browser document and respond to user events.'),
('20000000-0000-4000-8000-000000000007','10000000-0000-4000-8000-000000000003','Audience and positioning',1,20,'Define the audience and the distinct position your brand can own.'),
('20000000-0000-4000-8000-000000000008','10000000-0000-4000-8000-000000000003','Brand voice and identity',2,20,'Create a consistent verbal and visual identity.'),
('20000000-0000-4000-8000-000000000009','10000000-0000-4000-8000-000000000003','Building a brand strategy',3,20,'Bring research and positioning together into a practical strategy.')
on conflict (id) do nothing;
