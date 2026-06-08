# School Staff Management System

A free, cloud-hosted teacher and timetable management system built for Sri Lankan government schools. No ongoing costs. Works on phone, tablet, and laptop.

---

## What this app does

- Keep a searchable directory of all teachers with personal, contact, employment, and education details
- Build weekly timetables for each teacher (up to 8 periods × 5 days)
- See a dashboard with staff stats at a glance
- Role-based access: Principal, Admin Clerk, and Teacher roles
- All data stored securely in the cloud, backed up automatically

---

## The stack (all free)

| Layer | Tech | Free tier limit | Enough for? |
|---|---|---|---|
| Framework | Next.js 14 | — | Unlimited |
| Database | Supabase | 500MB database, 1GB file storage | ~10,000 teachers |
| Hosting | Vercel | 100GB bandwidth/month | Easily 100+ daily users |
| Auth | Supabase Auth | 50,000 monthly active users | Unlimited for a school |

---

## Setup Guide

You only need to do this **once**. Takes about 20 minutes.

### Prerequisites

1. A GitHub account — [sign up free](https://github.com/signup)
2. A Supabase account — [sign up free](https://supabase.com)
3. A Vercel account — [sign up free](https://vercel.com/signup) (can use your GitHub login)
4. [Node.js](https://nodejs.org) installed on your computer (version 18 or newer)

---

### Step 1 — Set up the database (Supabase)

1. Go to [supabase.com](https://supabase.com) and log in.
2. Click **New Project**.
3. Fill in:
   - Name: `school-staff` (or whatever you like)
   - Database password: generate a strong one and **save it somewhere safe**
   - Region: choose **Singapore** (closest to Sri Lanka)
   - Plan: Free
4. Wait 2–3 minutes for the project to provision.

5. Once ready, go to the **SQL Editor** (left sidebar).
6. Click **New Query**.
7. Copy the entire contents of `supabase-schema.sql` (in this project) and paste it.
8. Click **Run**. You should see "Success" at the bottom.

9. Go to **Project Settings** → **API**. You'll need three values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (long string)
   - **service_role secret** key (long string) — keep this very private

---

### Step 2 — Create the first Principal user

1. In Supabase, go to **Authentication** → **Users**.
2. Click **Add User** → **Create new user**.
3. Enter an email (your mother's) and a strong password.
4. Copy the user's **UID** from the list after creating.

5. Go to **SQL Editor** and run this query, replacing the values:

```sql
insert into app_users (id, email, full_name, role)
values (
  'paste-uid-here',
  'mothers-email@example.com',
  'Mother Name',
  'principal'
);
```

Now the first Principal account is ready.

---

### Step 3 — Get the code running locally (optional but recommended)

Open a terminal and:

```bash
# 1. Copy this folder to your computer
# 2. Navigate into it
cd school-app

# 3. Install dependencies
npm install

# 4. Create environment file
cp .env.example .env.local
```

5. Open `.env.local` in any text editor and paste the three values from Step 1.9.

6. Start the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) — you should see the login page.

8. Log in with the Principal account you created in Step 2.

---

### Step 4 — Deploy to Vercel (make it public)

1. Push this project to a new GitHub repository:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
# Create a new empty repo on github.com first
git remote add origin https://github.com/YOUR_USERNAME/school-app.git
git push -u origin main
```

2. Go to [vercel.com](https://vercel.com) → **Add New Project**.
3. Select your `school-app` repository from GitHub.
4. In the configuration step, add these **Environment Variables** (same three from Step 1.9):

```
NEXT_PUBLIC_SUPABASE_URL     = https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...
SUPABASE_SERVICE_ROLE_KEY     = eyJ...
```

5. Click **Deploy**. Wait 2 minutes.

6. Done! Your app is live at `https://school-app-YOURNAME.vercel.app`. Share the link with staff.

---

## Creating more users

Only the Principal can create accounts right now (we can build a UI for this later). For now:

1. Create the user in Supabase → Authentication → Users
2. Add them to `app_users` with the right role:

```sql
-- For an Admin Clerk
insert into app_users (id, email, full_name, role)
values ('uid-from-auth', 'clerk@school.lk', 'Clerk Name', 'admin_clerk');

-- For a Teacher (optional — links the user to their own teacher record)
insert into app_users (id, email, full_name, role, teacher_id)
values ('uid-from-auth', 'teacher@school.lk', 'Teacher Name', 'teacher', 'their-teacher-id-from-teachers-table');
```

---

## How users interact with the app

### Principal
- Sees everything. Can add, edit, delete teachers. Manages timetables. Creates user accounts (for now, through Supabase dashboard).

### Admin Clerk
- Same as Principal but **cannot delete teachers** and **cannot manage users**. Perfect for day-to-day data entry.

### Teacher
- Logs in and sees the dashboard. Currently they can browse — we can restrict this to "own data only" in a later phase if needed.

---

## What's next (Phase 2 ideas)

- **Attendance tracking**: check-in/out for teachers, daily reports
- **Leave management**: request, approve, track leave balance
- **Student records**: full student profiles, class assignments
- **Student attendance**: per-period attendance marking
- **Reports**: generate PDFs of timetables, staff lists, attendance summaries
- **SMS/Email notifications**: via free services like Brevo or Resend
- **User management UI**: create and edit users without touching Supabase

None of these require changing the stack — they all build on what's already here.

---

## Troubleshooting

**"Invalid email or password"** — Make sure the user exists in both `auth.users` *and* `app_users`. Both are required.

**Database paused** — Supabase free tier pauses after 7 days of inactivity. Go to supabase.com → your project → **Restore** (one click).

**Timetable won't save** — Make sure subjects are loaded (they come from the seed data in `supabase-schema.sql`).

---

## Project Structure

```
school-app/
├── app/
│   ├── layout.tsx              Root layout
│   ├── page.tsx                Redirects to dashboard
│   ├── globals.css             Tailwind styles
│   ├── login/                  Login page
│   ├── dashboard/              Main dashboard
│   ├── teachers/               Teacher pages
│   │   ├── page.tsx            List all
│   │   ├── new/                Add new
│   │   └── [id]/               Profile + edit + timetable
│   └── timetable/              School-wide view
├── components/
│   ├── layout/Sidebar.tsx
│   ├── teachers/
│   │   ├── TeachersTable.tsx
│   │   ├── TeacherForm.tsx
│   │   └── DeleteTeacherButton.tsx
│   └── timetable/
│       ├── TimetableGrid.tsx   Read-only view
│       └── TimetableEditor.tsx Editable grid
├── lib/
│   ├── supabase.ts             Browser client
│   ├── supabase-server.ts      Server client
│   └── auth.ts                 Auth helpers
├── types/index.ts              TypeScript types
├── middleware.ts               Route protection
├── supabase-schema.sql         Database setup script
└── .env.example                Environment variables template
```

---

## Cost breakdown

**Ongoing monthly cost: LKR 0**

All within free tiers, which are very generous for a school of this size. If the school ever outgrows the free tiers (unlikely for years), the cheapest paid plans start at $25/month on Supabase and $20/month on Vercel.

---

Built with Next.js, Supabase, and Tailwind CSS.
