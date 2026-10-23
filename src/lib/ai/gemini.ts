import "server-only";
import { z } from "zod";
import type { GeneratedRoadmap } from "@/lib/data/types";

// Tried in order. A busy or retired model falls through to the next one, so a
// spike in demand on Google's side doesn't break the feature mid-demo.
// gemini-3.6-flash answers in about 12 s; 3.8 was queuing for minutes when this was written.
const MODELS = [
  ...new Set([process.env.GEMINI_MODEL || "gemini-3.6-flash", "gemini-3.1-flash-lite", "gemini-3.5-flash-lite"]),
];
// Stay inside the route's maxDuration (120 s) with room to save the result.
const TOTAL_BUDGET_MS = 105_000;
const ATTEMPT_TIMEOUT_MS = 40_000;
const API_BASE = process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com/v1beta";

export const isAiConfigured = () => Boolean(process.env.GEMINI_API_KEY);

/** What Gemini must return. Checked again after parsing, since models can drift. */
const roadmapSchema = z.object({
  title: z.string().min(1).max(120),
  summary: z.string().min(1),
  keyPoints: z.array(z.string().min(1)).min(1).max(10),
  lessons: z
    .array(
      z.object({
        title: z.string().min(1),
        content: z.string().min(1),
        quiz: z
          .array(
            z
              .object({
                question: z.string().min(1),
                options: z.array(z.string().min(1)).min(2).max(6),
                answer: z.number().int().min(0),
                explanation: z.string().default(""),
              })
              .refine((q) => q.answer < q.options.length, "answer out of range"),
          )
          .min(1)
          .max(6),
      }),
    )
    .min(2)
    .max(12),
  cards: z.array(z.object({ front: z.string().min(1), back: z.string().min(1) })).max(30),
});

// The same shape in the OpenAPI subset Gemini uses for structured output.
const str = { type: "STRING" };
const responseSchema = {
  type: "OBJECT",
  properties: {
    title: str,
    summary: str,
    keyPoints: { type: "ARRAY", items: str },
    lessons: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: str,
          content: str,
          quiz: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                question: str,
                options: { type: "ARRAY", items: str },
                answer: { type: "INTEGER" },
                explanation: str,
              },
              required: ["question", "options", "answer", "explanation"],
              propertyOrdering: ["question", "options", "answer", "explanation"],
            },
          },
        },
        required: ["title", "content", "quiz"],
        propertyOrdering: ["title", "content", "quiz"],
      },
    },
    cards: {
      type: "ARRAY",
      items: { type: "OBJECT", properties: { front: str, back: str }, required: ["front", "back"] },
    },
  },
  required: ["title", "summary", "keyPoints", "lessons", "cards"],
  propertyOrdering: ["title", "summary", "keyPoints", "lessons", "cards"],
};

const PROMPT = `You are a friendly study coach. Turn the study material above into a learning roadmap for a student.

Return:
- title: a short name for the topic (at most 60 characters).
- summary: 3 to 5 sentences covering what the material is about.
- keyPoints: the 4 to 7 most important facts, formulas or ideas, one sentence each.
- lessons: 4 to 8 lessons ordered from the basics to the hardest ideas, like units on a Duolingo path. Each lesson has:
  - title: at most 40 characters.
  - content: 80 to 150 words that teach the idea. Use short paragraphs separated by blank lines, "- " bullet lines and **bold** for key terms. No headings.
  - quiz: exactly 3 multiple-choice questions on that lesson, each with 4 options, the index of the correct option (0 to 3) in "answer", and a one-sentence explanation. Vary where the correct option appears.
- cards: 6 to 12 flashcards (front: a question or term, back: a short answer).

Only use facts from the material, and write in the same language as the material.`;

export type AiInput = { kind: "file"; mimeType: string; data: Buffer; name: string } | { kind: "text"; text: string };

export class AiError extends Error {
  constructor(
    message: string,
    public status = 502,
  ) {
    super(message);
  }
}

/** Sends the material to Gemini and returns a validated roadmap. */
type GeminiResponse = {
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
};

/** Statuses where another model may succeed: overloaded, rate limited, retired or erroring. */
const TRY_NEXT = new Set([404, 429, 500, 503, 504]);

/** Sends the material to Gemini and returns a validated roadmap. */
export async function generateRoadmap(input: AiInput): Promise<GeneratedRoadmap> {
  const material =
    input.kind === "file"
      ? { inlineData: { mimeType: input.mimeType, data: input.data.toString("base64") } }
      : { text: `Study material:\n\n${input.text}` };
  const contents = [{ role: "user", parts: [material, { text: PROMPT }] }];

  const deadline = Date.now() + TOTAL_BUDGET_MS;
  let lastStatus = 0;
  let json: GeminiResponse | undefined;

  for (const model of MODELS) {
    const timeLeft = deadline - Date.now();
    if (timeLeft < 10_000) break;
    const body = {
      contents,
      generationConfig: {
        temperature: 0.4,
        responseMimeType: "application/json",
        responseSchema,
        // Full Gemini 3 models think before answering; a low level keeps it quick.
        ...(model.startsWith("gemini-3") && !model.includes("lite") ? { thinkingConfig: { thinkingLevel: "low" } } : {}),
      },
    };

    let res: Response;
    try {
      res = await fetch(`${API_BASE}/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY ?? "" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(Math.min(ATTEMPT_TIMEOUT_MS, timeLeft)),
      });
    } catch {
      console.error("Gemini timed out", model);
      lastStatus = 504;
      continue;
    }

    if (res.ok) {
      json = (await res.json()) as GeminiResponse;
      break;
    }
    lastStatus = res.status;
    const detail = await res.text().catch(() => "");
    console.error("Gemini error", model, res.status, detail.slice(0, 300));
    if (res.status === 400) throw new AiError("The AI couldn't read this file. Try a PDF, an image or plain text.", 400);
    if (res.status === 401 || res.status === 403) throw new AiError("The Gemini API key was rejected. Check GEMINI_API_KEY.", 502);
    if (!TRY_NEXT.has(res.status)) break;
  }

  if (!json) {
    if (lastStatus === 504) throw new AiError("The AI took too long to answer. Try a shorter file.", 504);
    throw new AiError("The AI is busy right now. Try again in a minute.", 503);
  }
  if (json.promptFeedback?.blockReason) throw new AiError("The AI declined to process this file.", 422);

  const text = json.candidates?.[0]?.content?.parts
    ?.filter((p) => !p.thought)
    .map((p) => p.text ?? "")
    .join("");
  if (!text) throw new AiError("The AI returned an empty answer. Try again.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new AiError("The AI answer was cut off. Try a shorter file.");
  }
  const result = roadmapSchema.safeParse(parsed);
  if (!result.success) {
    console.error("Gemini returned an unexpected shape", result.error.issues.slice(0, 5));
    throw new AiError("The AI answer didn't look right. Try again.");
  }
  return result.data;
}
