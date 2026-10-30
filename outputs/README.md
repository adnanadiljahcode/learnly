# Learnly workspace setup

## 1. Configure Supabase

1. Create or open a Supabase project.
2. In Supabase, open **SQL Editor** and run the complete script in [supabase/schema.sql](./supabase/schema.sql). It creates the workspace tables, row-level security policies, a profile trigger, and three sample courses with lessons.
3. In Supabase project settings, copy the Project URL and the publishable (or anon) key.
4. Copy `.env.example` to `.env.local` in this `outputs` directory and set:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
```

Never put a Supabase service-role key in this frontend app or commit real credentials.

## 2. Run the app

From the repository root:

```bash
cd outputs
npm install
npm run dev -- --host 0.0.0.0
```

Open the forwarded Vite port (normally 5173) in the Codespaces **Ports** tab.

## 3. What the workspace now supports

- Email/password sign-up and sign-in using Supabase Auth.
- Overview metrics based on the signed-in user's activity.
- Course discovery and enrollment.
- Bookmarks saved per user.
- Course lesson lists and completion tracking.
- Weekly learning activity recorded when a lesson is marked complete.
- Progress page and editable display name.
- Row-level security so private learning records are scoped to their owner.

The sample course catalog is inserted by the SQL script. New accounts start with an empty enrolled-course list; use **Explore courses** to enroll.

## Notes

- Configure email confirmation in Supabase Auth according to your desired sign-up flow.
- The frontend intentionally uses only the publishable/anon key; RLS is the security boundary for user data.
- If credentials are missing, the app displays setup instructions instead of crashing during startup.
