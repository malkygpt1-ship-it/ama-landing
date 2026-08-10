import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "AI research is not configured yet. Add OPENAI_API_KEY in Vercel." }, { status: 503 });
  const { asin, url } = await request.json();
  if (!/^[A-Z0-9]{10}$/.test(asin || "")) return NextResponse.json({ error: "Invalid ASIN." }, { status: 400 });

  const prompt = `Research the Amazon UK product with ASIN ${asin} and product URL ${url}. Use reliable public sources. Do not scrape, quote, or invent Amazon customer reviews. Summarise recurring buyer feedback only when supported by other accessible sources. Return only JSON with string fields product, category, audience, price, rating, features, pros, cons, verdict, reviewThemes and sources as an array of {title,url}. Use newline-separated items for features, pros and cons. If a current price or rating cannot be verified, use an empty string. Keep the verdict balanced and never claim hands-on testing.`;
  const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "content-type": "application/json" }, body: JSON.stringify({ model: "gpt-5-mini", tools: [{ type: "web_search" }], input: prompt }) });
  const payload = await response.json();
  if (!response.ok) return NextResponse.json({ error: payload.error?.message || "OpenAI research request failed." }, { status: response.status });
  const text = payload.output?.flatMap((item: { content?: { type: string; text?: string }[] }) => item.content || []).find((item: { type: string }) => item.type === "output_text")?.text || "";
  try { return NextResponse.json(JSON.parse(text.replace(/^```json\s*|\s*```$/g, ""))); }
  catch { return NextResponse.json({ error: "The research result was incomplete. Please try again." }, { status: 502 }); }
}
