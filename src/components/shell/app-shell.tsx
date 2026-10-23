"use client";

import type { ReactNode } from "react";
import { isDemoMode } from "@/lib/config";
import { CommandPaletteProvider, SearchButton } from "./command-palette";
import { MobileNav } from "./mobile-nav";
import { ReminderBell } from "./reminder-bell";
import { Sidebar } from "./sidebar";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <CommandPaletteProvider>
      <div className="flex min-h-dvh">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          {isDemoMode && (
            <div className="bg-accent px-4 py-1.5 text-center text-xs text-accent-foreground">
              Demo mode: data is saved in this browser only. Add Supabase keys to enable accounts.
            </div>
          )}
          <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
            <MobileNav />
            <SearchButton />
            <div className="ml-auto flex items-center gap-1">
              <ReminderBell />
              <ThemeToggle />
              <div className="ml-1">
                <UserMenu />
              </div>
            </div>
          </header>
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
        </div>
      </div>
    </CommandPaletteProvider>
  );
}
