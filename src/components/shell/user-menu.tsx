"use client";

import { LogOut, Settings } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isDemoMode } from "@/lib/config";
import { getRepo } from "@/lib/data";
import { useProfile } from "@/lib/data/hooks";

export function initials(name: string | null | undefined) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function UserMenu() {
  const { data: profile } = useProfile();

  async function signOut() {
    await getRepo().signOut();
    // A full reload also clears every cached query from the previous session.
    window.location.assign(isDemoMode ? "/today" : "/login");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-xs font-semibold text-white"
        aria-label="Account menu"
      >
        {profile?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatarUrl} alt="" className="size-full object-cover" />
        ) : (
          initials(profile?.fullName)
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div className="font-medium text-foreground">{profile?.fullName ?? "Student"}</div>
          <div className="truncate">{profile?.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={signOut}>
          <LogOut /> {isDemoMode ? "Reset demo data" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
