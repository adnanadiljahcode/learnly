# Learnly workspace setup

## 1. Configure Supabase

1. Create or open a Supabase project.
2. In Supabase, open **SQL Editor** and run the complete script in [supabase/schema.sql](./supabase/schema.sql). It creates the workspace tables, row-level security policies, a profile trigger, and three sample courses with lessons.
3. In Supabase project settings, copy the Project URL and the publishable (or anon) key.\n4. If Learnly is already deployed, re-run the updated complete SQL script so the administrator role table and policies are installed.
5. Copy `.env.example` to `.env.local` in this `outputs` directory and set:

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

The sample course catalog is inserted by the SQL script. New accounts start with an empty enrolled-course list; use **Explore courses** to enroll.\n\n## 4. Enable the first administrator\n\n1. Create your Learnly account using the normal sign-up form.\n2. In Supabase **SQL Editor**, run the administrator-grant statement at the bottom of `supabase/schema.sql`, replacing `YOUR_ADMIN_EMAIL` with the exact email address used for that account.\n3. Sign out and sign back in. The **Administration** navigation item will appear.\n\nThe administrator workspace supports course creation, editing, publishing/unpublishing, deletion, user listing, and role assignment. Role assignment is protected by database policies. Instructor role records are available for the next instructor-workspace milestone; instructor-specific permissions and tools are not enabled yet. Never grant admin access to an untrusted account.

## Notes

- Configure email confirmation in Supabase Auth according to your desired sign-up flow.
- The frontend intentionally uses only the publishable/anon key; RLS is the security boundary for user data.
- If credentials are missing, the app displays setup instructions instead of crashing during startup.
