export const siteConfig = {
  name: "StudyHub",
  tagline: "Everything a student needs, in one place.",
};

// Tolerates the REST endpoint ("…supabase.co/rest/v1/") being pasted instead of the project URL.
export const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim().replace(/\/(rest\/v1\/?)?$/, "");
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Without Supabase keys the app runs in demo mode: no login, and data is kept
 * in the browser. Handy for local development and for showing the app to
 * judges before the backend is set up.
 */
export const isDemoMode = !supabaseUrl || !supabaseAnonKey;
