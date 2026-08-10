import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "AI images are not configured yet. Add OPENAI_API_KEY in Vercel." }, { status: 503 });
  const incoming = await request.formData(); const image = incoming.get("image"); const prompt = String(incoming.get("prompt") || ""); const product = String(incoming.get("product") || "product");
  if (!(image instanceof File) || !image.type.startsWith("image/")) return NextResponse.json({ error: "Upload a valid image." }, { status: 400 });
  if (image.size > 15 * 1024 * 1024) return NextResponse.json({ error: "Image must be under 15MB." }, { status: 400 });
  const body = new FormData(); body.append("model", "gpt-image-1.5"); body.append("image[]", image); body.append("prompt", `Create a realistic affiliate editorial lifestyle image of ${product}. ${prompt} Preserve the exact product identity and do not add claims, awards, pricing, logos, or accessories that are not present in the reference. No text overlay.`); body.append("size", "1536x1024"); body.append("quality", "medium");
  const response = await fetch("https://api.openai.com/v1/images/edits", { method: "POST", headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body }); const payload = await response.json();
  if (!response.ok) return NextResponse.json({ error: payload.error?.message || "Image generation failed." }, { status: response.status });
  return NextResponse.json({ image: payload.data?.[0]?.b64_json });
}
