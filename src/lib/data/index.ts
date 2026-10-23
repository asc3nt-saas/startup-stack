import { isDemoMode } from "@/lib/config";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { createDemoRepo } from "./demo-repo";
import type { Repo } from "./repo";
import { createSupabaseRepo } from "./supabase-repo";

let repo: Repo | undefined;

/** The single entry point to app data. Browser only. */
export function getRepo(): Repo {
  repo ??= isDemoMode ? createDemoRepo() : createSupabaseRepo(getSupabaseBrowserClient());
  return repo;
}

export type { Repo } from "./repo";
export * from "./types";
