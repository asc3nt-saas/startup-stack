export const siteConfig = {
  name: "StudyHub",
  tagline: "Everything a student needs, in one place.",
};

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Without Supabase keys the app runs in demo mode: no login, and data is kept
 * in the browser. Handy for local development and for showing the app to
 * judges before the backend is set up.
 */
export const isDemoMode = !supabaseUrl || !supabaseAnonKey;
