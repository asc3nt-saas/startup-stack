# StudyHub

One dashboard for everything a student uses: timetable, assignments and exams,
notes, grades, flashcards, a focus timer, group chat and AI study roadmaps.

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 16 (App Router) + TypeScript | Industry standard, one codebase for UI and server code, deploys to Vercel in a click |
| UI | Tailwind CSS v4, Radix primitives, lucide icons | Clean, accessible components that are easy to restyle |
| Animation | Motion (Framer Motion) | Smooth page and card transitions, flip clock, lesson effects |
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
2. In the dashboard open **SQL Editor**, then paste and run each file in
   `supabase/migrations/` in order (`0001_init.sql`, then `0002_...`). This
   creates every table, the security rules, the chat functions and the file
   storage bucket. When a new migration file appears in a later update, run
   just that file.
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

## Turn on the AI roadmap (Gemini)

1. Get a free API key at https://aistudio.google.com/apikey.
2. Add it to `.env.local` as `GEMINI_API_KEY=...` and restart.

The key is only read on the server (`src/app/api/ai/roadmap/route.ts`), so it
never reaches the browser. Without a key, uploading a file returns a sample
roadmap so the feature still works in a demo. Optional: set `GEMINI_MODEL` to
use a different model (the default is `gemini-3.6-flash`). If a model is busy,
the app falls back to a lighter one automatically.

Files can be PDFs (export slides as PDF), PNG/JPG/WebP images or text, up to
4 MB, which is the upload limit on Vercel.

## Deploy to Vercel

1. Push the repo to GitHub (already done if you're reading this there).
2. On https://vercel.com click **Add New > Project**, import the repo, and
   keep the detected Next.js settings.
3. Under **Environment Variables** add:
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (leave
     both out to deploy a public demo with no accounts)
   - `GEMINI_API_KEY`
4. Click **Deploy**. You get a URL like `https://your-app.vercel.app`.
5. In Supabase **Authentication > URL Configuration**, set the Site URL to
   that URL and add `https://your-app.vercel.app/auth/callback` to the
   redirect URLs.

Every push to `main` redeploys automatically, and every pull request gets its
own preview URL.

## Project layout

```
src/
  app/
    (app)/          dashboard pages (today, timetable, assignments, ...)
    (auth)/login/   sign in and sign up
    auth/callback/  finishes Google and email-link sign in
  components/
    shell/          sidebar, top bar, Ctrl+K search, reminders, theme
    ai/             AI roadmap: upload, Duolingo-style path, lesson player
    landing/        the public landing page
    today/          the Today dashboard
    ui/             buttons, cards, inputs and other primitives
  lib/
    ai/             Gemini client (server only) and sample roadmaps
    data/           the data layer: types, repo interface, Supabase and demo implementations
    supabase/       Supabase clients for browser, server and proxy
  proxy.ts          refreshes the login session and protects pages
supabase/migrations/ database schema
```

## Roadmap

1. **Foundation** (done): project setup, auth, database schema, dashboard
   shell, Today view, Ctrl+K search, reminders, dark mode, mobile layout.
2. **Core tools** (done): adjustable timetable with drag and resize,
   assignments and exams (list and board), rich text notes with auto-save,
   grades spreadsheet with weighted averages, GPA and a "what do I need"
   calculator, subjects and settings.
3. **Engagement** (done): flashcards with spaced repetition and flip
   animations, a flip clock focus timer that keeps running across pages with
   streaks and XP levels, and real-time group chat with invite codes.
4. **AI and polish** (done): Gemini turns uploaded files into a summary, a
   Duolingo-style roadmap of lessons with quizzes and XP, and a flashcard
   deck; public landing page; demo data; Vercel deploy guide.
