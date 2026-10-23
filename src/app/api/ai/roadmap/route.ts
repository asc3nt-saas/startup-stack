import { NextResponse, type NextRequest } from "next/server";
import { AiError, generateRoadmap, isAiConfigured, type AiInput } from "@/lib/ai/gemini";
import { sampleRoadmap } from "@/lib/ai/samples";
import { isDemoMode } from "@/lib/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// Gemini can take a while on long files, and may fall back to a second model.
export const maxDuration = 120;

// Vercel rejects request bodies over 4.5 MB.
const MAX_BYTES = 4 * 1024 * 1024;
const MAX_TEXT = 120_000;
const ACCEPTED = new Set(["application/pdf", "text/plain", "text/markdown", "image/png", "image/jpeg", "image/webp"]);

// A simple per-visitor limit so a public demo can't burn through the API key.
const WINDOW_MS = 10 * 60_000;
const LIMIT = 8;
const hits = new Map<string, number[]>();

function rateLimited(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) return true;
  hits.set(key, [...recent, now]);
  return false;
}

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(request: NextRequest) {
  let visitor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!isDemoMode) {
    const supabase = await getSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return fail("Please sign in first.", 401);
    visitor = data.user.id;
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("Upload a file or paste some text.", 400);
  }

  const file = form.get("file");
  const text = String(form.get("text") ?? "").trim();
  let input: AiInput;

  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_BYTES) return fail("That file is over 4 MB. Try a smaller one or paste the text.", 413);
    // Some browsers send .md files without a type.
    const mimeType = file.type || (file.name.endsWith(".md") ? "text/markdown" : "");
    if (!ACCEPTED.has(mimeType)) {
      return fail("Upload a PDF, an image (PNG, JPG) or a text file. For slides, export them as PDF first.", 415);
    }
    const data = Buffer.from(await file.arrayBuffer());
    input = mimeType.startsWith("text/")
      ? { kind: "text", text: data.toString("utf8").slice(0, MAX_TEXT) }
      : { kind: "file", mimeType, data, name: file.name };
  } else if (text.length >= 200) {
    input = { kind: "text", text: text.slice(0, MAX_TEXT) };
  } else {
    return fail(text ? "Paste a bit more text (at least a paragraph or two)." : "Upload a file or paste some text.", 400);
  }

  if (!isAiConfigured()) {
    // No key yet: show a sample so the whole flow still works in a demo.
    await new Promise((r) => setTimeout(r, 2500));
    return NextResponse.json({ roadmap: sampleRoadmap, sample: true });
  }

  if (rateLimited(visitor)) return fail("You've made a lot of roadmaps. Take a short break and try again in a few minutes.", 429);

  try {
    return NextResponse.json({ roadmap: await generateRoadmap(input), sample: false });
  } catch (error) {
    if (error instanceof AiError) return fail(error.message, error.status);
    console.error(error);
    return fail("Something went wrong. Try again.", 500);
  }
}
