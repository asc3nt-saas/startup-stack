"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { mainNav, secondaryNav, type NavItem } from "./nav";

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active ? "text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {active && (
        <motion.span
          layoutId="nav-active"
          className="absolute inset-0 rounded-md bg-accent"
          transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
        />
      )}
      <Icon className="relative size-[18px]" />
      <span className="relative">{item.label}</span>
    </Link>
  );
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-6">
      <div className="px-3 pt-1">
        <Logo />
      </div>
      <nav className="flex flex-1 flex-col gap-0.5">
        {mainNav.map((item) => (
          <NavLink key={item.href} item={item} onNavigate={onNavigate} />
        ))}
      </nav>
      <nav className="flex flex-col gap-0.5">
        {secondaryNav.map((item) => (
          <NavLink key={item.href} item={item} onNavigate={onNavigate} />
        ))}
      </nav>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r bg-sidebar p-4 lg:block">
      <SidebarNav />
    </aside>
  );
}
