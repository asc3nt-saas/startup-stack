# StudyHub

One dashboard for everything a student uses: timetable, assignments and exams,
notes, grades, flashcards, a focus timer, group chat and AI study roadmaps.

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 16 (App Router) + TypeScript | Industry standard, one codebase for UI and server code, deploys to Vercel in a click |
| UI | Tailwind CSS v4, Radix primitives, lucide icons | Clean, accessible components that are easy to restyle |
| Animation | Motion (Framer Motion) | Smooth page and card transitions, flip clock later |
| Data fetching | TanStack Query | Caching, optimistic updates, loading states |
| Database and auth | Supabase (Postgres, Auth, Realtime, Storage) | SQL database with row level security, Google and email login, live chat, file uploads |
| AI | Gemini API (server side) | File summaries and learning roadmaps |

All reads and writes go through one interface, `src/lib/data/repo.ts`. The UI
never talks to Supabase directly, so changing the backend later means writing
one new implementation of that interface.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. Without Supabase keys the app runs in **demo mode**
with sample data saved in your browser, so you can try everything right away.

## Connect Supabase (accounts and a real database)

1. Create a free project at https://supabase.com.
2. In the dashboard open **SQL Editor**, paste the contents of
   `supabase/migrations/0001_init.sql` and run it. This creates every table,
   the security rules, the chat functions and the file storage bucket.
3. Copy `.env.example` to `.env.local` and fill in the URL and anon key from
   **Project Settings > API**.
4. In **Authentication > URL Configuration** set the Site URL to
   `http://localhost:3000` (and your Vercel URL later), and add
   `http://localhost:3000/auth/callback` to the redirect URLs.
5. Optional, Google login: in **Authentication > Providers > Google** paste a
   client ID and secret from Google Cloud Console. The Google redirect URI is
   shown on that same Supabase page.

Restart `npm run dev`. You now get a real sign-in page, and each student only
ever sees their own data (enforced in the database by row level security).

## Deploy

Import the repo on https://vercel.com, add the same environment variables, and
deploy. Add the Vercel URL to Supabase's Site URL and redirect URLs.

## Project layout

```
src/
  app/
    (app)/          dashboard pages (today, timetable, assignments, ...)
    (auth)/login/   sign in and sign up
    auth/callback/  finishes Google and email-link sign in
  components/
    shell/          sidebar, top bar, Ctrl+K search, reminders, theme
    today/          the Today dashboard
    ui/             buttons, cards, inputs and other primitives
  lib/
    data/           the data layer: types, repo interface, Supabase and demo implementations
    supabase/       Supabase clients for browser, server and proxy
  proxy.ts          refreshes the login session and protects pages
supabase/migrations/ database schema
```

## Roadmap

1. **Foundation** (done): project setup, auth, database schema, dashboard
   shell, Today view, Ctrl+K search, reminders, dark mode, mobile layout.
2. **Core tools**: timetable, assignments and exams, notes, grades.
3. **Engagement**: flashcards, study timer with flip clock, group chat.
4. **AI and polish**: Gemini file summaries and roadmaps, landing page, demo data.
