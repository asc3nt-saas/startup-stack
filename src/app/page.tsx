import { redirect } from "next/navigation";

// The landing page arrives in step 4. Until then the root opens the dashboard.
export default function Home() {
  redirect("/today");
}
