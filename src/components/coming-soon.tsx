import { CircleCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { NavItem } from "@/components/shell/nav";

export function ComingSoon({
  item,
  step,
  features,
}: {
  item: Pick<NavItem, "label" | "description" | "icon">;
  step: number;
  features: string[];
}) {
  const Icon = item.icon;
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center py-16 text-center">
      <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
        <Icon className="size-7" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">{item.label}</h1>
      <p className="mt-2 text-muted-foreground">{item.description}. Arriving in step {step}.</p>
      <ul className="mt-8 w-full space-y-2 rounded-xl border bg-card p-5 text-left text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <CircleCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            {f}
          </li>
        ))}
      </ul>
      <Button asChild variant="outline" className="mt-8">
        <Link href="/today">Back to Today</Link>
      </Button>
    </div>
  );
}
