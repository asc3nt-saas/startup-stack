"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/shell/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isDemoMode, siteConfig, supabaseAnonKey, supabaseUrl } from "@/lib/config";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function nextPath() {
  const next = new URLSearchParams(window.location.search).get("next");
  return next?.startsWith("/") && !next.startsWith("//") ? next : "/today";
}

/**
 * Asks Supabase which sign-in methods are switched on, so the Google button
 * only appears once Google is set up in the dashboard.
 */
function useGoogleEnabled() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    if (isDemoMode) return;
    fetch(`${supabaseUrl}/auth/v1/settings`, { headers: { apikey: supabaseAnonKey } })
      .then((res) => res.json())
      .then((settings: { external?: { google?: boolean } }) => setEnabled(Boolean(settings.external?.google)))
      .catch(() => {});
  }, []);
  return enabled;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2-1.9 3.3-4.7 3.3-8Z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.9A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7H2.1a11 11 0 0 0 0 10l3.7-2.9Z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7l3.7 2.9C6.7 7.3 9.1 5.4 12 5.4Z" />
    </svg>
  );
}

export function LoginForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const googleEnabled = useGoogleEnabled();

  // The auth callback sends people back here when a link can't be used.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("error") !== "auth") return;
    toast.error("That sign-in link didn't work", {
      description:
        "It may have expired or been opened in a different browser. If you just confirmed your email, sign in with your password.",
      duration: 10_000,
    });
  }, []);

  async function signInWithGoogle() {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath())}`,
      },
    });
    if (error) toast.error(error.message);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const fullName = String(form.get("fullName") ?? "");
    const supabase = getSupabaseBrowserClient();
    setLoading(true);

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return toast.error(error.message);
      router.replace(nextPath());
      router.refresh();
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    if (data.session) router.replace("/today");
    else toast.success("Check your email to confirm your account.");
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col p-6 sm:p-10">
        <Logo />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="m-auto w-full max-w-sm py-10"
        >
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{siteConfig.tagline}</p>

          {isDemoMode ? (
            <div className="mt-8 space-y-4 rounded-xl border bg-card p-5 text-sm">
              <p>
                Accounts are off because Supabase keys are not set yet. You can explore everything in demo mode.
              </p>
              <Button asChild className="w-full">
                <Link href="/today">Open the demo</Link>
              </Button>
            </div>
          ) : (
            <>
              {googleEnabled && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Button variant="outline" className="mt-8 h-10 w-full" onClick={signInWithGoogle}>
                    <GoogleIcon /> Continue with Google
                  </Button>
                  <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="h-px flex-1 bg-border" /> or with email <span className="h-px flex-1 bg-border" />
                  </div>
                </motion.div>
              )}
              <form onSubmit={onSubmit} className="mt-6 space-y-3">
                {mode === "signup" && <Input name="fullName" placeholder="Full name" required autoComplete="name" />}
                <Input name="email" type="email" placeholder="you@school.edu" required autoComplete="email" />
                <Input
                  name="password"
                  type="password"
                  placeholder="Password"
                  required
                  minLength={8}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                />
                <Button type="submit" className="h-10 w-full" disabled={loading}>
                  {loading ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
                </Button>
              </form>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                {mode === "signin" ? "New here? " : "Already have an account? "}
                <button
                  className="cursor-pointer font-medium text-primary hover:underline"
                  onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                >
                  {mode === "signin" ? "Create an account" : "Sign in"}
                </button>
              </p>
            </>
          )}
        </motion.div>
      </div>

      <div className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_50%)]" />
        <div className="relative flex h-full flex-col justify-end p-12 text-white">
          <p className="max-w-md text-3xl font-semibold leading-tight tracking-tight">
            Timetable, deadlines, notes, grades, flashcards, focus timer, group chat and AI study roadmaps. All in one
            place.
          </p>
          <p className="mt-4 text-white/80">Built for students who have better things to do than juggle ten apps.</p>
        </div>
      </div>
    </div>
  );
}
