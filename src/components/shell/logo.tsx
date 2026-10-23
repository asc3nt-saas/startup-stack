import Link from "next/link";
import { siteConfig } from "@/lib/config";

export function Logo() {
  return (
    <Link href="/today" className="flex items-center gap-2.5 font-semibold tracking-tight">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon.svg" alt="" className="size-8" />
      <span className="text-[15px]">{siteConfig.name}</span>
    </Link>
  );
}
