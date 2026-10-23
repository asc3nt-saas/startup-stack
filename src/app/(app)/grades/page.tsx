import type { Metadata } from "next";
import { GradesView } from "@/components/grades/grades-view";

export const metadata: Metadata = { title: "Grades" };

export default function GradesPage() {
  return <GradesView />;
}
