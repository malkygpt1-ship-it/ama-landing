"use client";

import { useMemo, useState } from "react";

type FormState = {
  product: string; category: string; audience: string; price: string; rating: string;
  url: string; tag: string; features: string; pros: string; cons: string; verdict: string;
};

const initial: FormState = {
  product: "Soundcore Q20i Hybrid ANC Headphones",
  category: "wireless headphones",
  audience: "commuters and home-office users",
  price: "£49.99",
  rating: "4.6",
  url: "https://www.amazon.co.uk/dp/B0C3HCD34R",
  tag: "",
  features: "Hybrid active noise cancellation\n40-hour battery with ANC\nHi-Res audio\nDual-device connection",
  pros: "Strong noise cancellation for the price\nLong battery life\nComfortable for longer sessions",
  cons: "Mostly plastic construction\nApp required for advanced EQ",
  verdict: "A strong-value choice for buyers who want useful noise cancellation and long battery life without paying premium-brand prices.",
};

const lines = (value: string) => value.split("\n").map((item) => item.trim()).filter(Boolean);

function affiliateUrl(url: string, tag: string) {
  if (!url) return "#";
  try {
    const parsed = new URL(url);
    if (tag.trim()) parsed.searchParams.set("tag", tag.trim());
    return parsed.toString();
  } catch { return url; }
}

export default function Home() {
  const [form, setForm] = useState<FormState>(initial);
  const [copied, setCopied] = useState(false);
  const update = (key: keyof FormState, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const link = useMemo(() => affiliateUrl(form.url, form.tag), [form.url, form.tag]);
  const score = Number(form.rating) || 4.5;

  const article = useMemo(() => `${form.product} review: is it worth buying?\n\n${form.verdict}\n\nBest for: ${form.audience}\nPrice checked: ${form.price}\n\nKey features\n${lines(form.features).map((x) => `• ${x}`).join("\n")}\n\nWhat we like\n${lines(form.pros).map((x) => `• ${x}`).join("\n")}\n\nWhat to consider\n${lines(form.cons).map((x) => `• ${x}`).join("\n")}\n\nVerdict\n${form.verdict}\n\nAs an Amazon Associate, we earn from qualifying purchases.`, [form]);

  async function copyArticle() {
    await navigator.clipboard.writeText(article);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function downloadArticle() {
    const blob = new Blob([article], { type: "text/plain;charset=utf-8" });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `${form.product.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "review"}.txt`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  }

  return <main>
    <header className="topbar"><a className="brand" href="#top" aria-label="AMA Review Builder home"><span>ama</span> Review Builder</a><div className="status"><i /> Private draft</div></header>
    <section className="hero" id="top"><div><p className="eyebrow">Affiliate content, without the faff</p><h1>Turn product facts into a review page that’s ready to publish.</h1><p className="lede">Add what you genuinely know. We’ll shape it into a useful, disclosure-ready review—without inventing hands-on experience.</p></div><div className="hero-card"><strong>Built for honest recommendations</strong><span>Facts in</span><b>→</b><span>Polished review out</span></div></section>

    <section className="workspace">
      <div className="panel editor">
        <div className="panel-heading"><div><p className="step">01 · Product details</p><h2>Build your review</h2></div><button className="ghost" onClick={() => setForm(initial)}>Load example</button></div>
        <div className="grid two"><Field label="Product name" value={form.product} onChange={(v) => update("product", v)} /><Field label="Category" value={form.category} onChange={(v) => update("category", v)} /></div>
        <Field label="Best for" hint="Who benefits most?" value={form.audience} onChange={(v) => update("audience", v)} />
        <div className="grid two"><Field label="Current price" value={form.price} onChange={(v) => update("price", v)} /><Field label="Amazon rating" value={form.rating} onChange={(v) => update("rating", v)} /></div>
        <Field label="Amazon product URL" value={form.url} onChange={(v) => update("url", v)} />
        <Field label="Associate tag" hint="Optional — added safely to the link" value={form.tag} onChange={(v) => update("tag", v)} />
        <TextField label="Key features" hint="One per line" value={form.features} onChange={(v) => update("features", v)} />
        <div className="grid two"><TextField label="Pros" hint="One per line" value={form.pros} onChange={(v) => update("pros", v)} /><TextField label="Cons" hint="One per line" value={form.cons} onChange={(v) => update("cons", v)} /></div>
        <TextField label="Your verdict" hint="Use your own evidence and judgement" value={form.verdict} onChange={(v) => update("verdict", v)} />
        <div className="note"><strong>Truth check</strong><span>Only publish claims you can support. Amazon prices and ratings can change, so date-check them before publishing.</span></div>
      </div>

      <aside className="panel preview-wrap">
        <div className="preview-actions"><div><p className="step">02 · Live preview</p><h2>Your review page</h2></div><div><button className="ghost" onClick={downloadArticle}>Download</button><button className="primary" onClick={copyArticle}>{copied ? "Copied ✓" : "Copy article"}</button></div></div>
        <article className="review">
          <div className="review-meta"><span>BUYING GUIDE</span><span>5 min read</span></div>
          <h1>{form.product || "Your product"} review: is it worth buying?</h1>
          <p className="intro">{form.verdict || "Add your verdict to generate the opening summary."}</p>
          <div className="score-card"><div className="score"><strong>{score.toFixed(1)}</strong><span>Amazon rating</span></div><div><strong>Best for</strong><p>{form.audience}</p></div><div><strong>Price checked</strong><p>{form.price}</p></div></div>
          <a className="amazon-button" href={link} target="_blank" rel="nofollow sponsored noopener">Check price on Amazon <span>→</span></a>
          <small className="disclosure">As an Amazon Associate, we earn from qualifying purchases. This does not affect the price you pay.</small>
          <Section title="Key features" items={lines(form.features)} />
          <div className="pros-cons"><Section title="What we like" items={lines(form.pros)} tone="good" /><Section title="What to consider" items={lines(form.cons)} tone="caution" /></div>
          <section className="verdict"><p className="eyebrow">The bottom line</p><h2>Our verdict</h2><p>{form.verdict}</p><a href={link} target="_blank" rel="nofollow sponsored noopener">View {form.product || "product"} on Amazon →</a></section>
        </article>
      </aside>
    </section>
    <footer><span>AMA Review Builder</span><span>Human judgement. Better structure. Clear disclosure.</span></footer>
  </main>;
}

function Field({ label, hint, value, onChange }: { label: string; hint?: string; value: string; onChange: (value: string) => void }) {
  return <label><span>{label}{hint && <em>{hint}</em>}</span><input value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}
function TextField({ label, hint, value, onChange }: { label: string; hint?: string; value: string; onChange: (value: string) => void }) {
  return <label><span>{label}{hint && <em>{hint}</em>}</span><textarea rows={4} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}
function Section({ title, items, tone }: { title: string; items: string[]; tone?: "good" | "caution" }) {
  return <section className={`content-section ${tone || ""}`}><h2>{title}</h2><ul>{items.length ? items.map((item) => <li key={item}>{item}</li>) : <li>Add an item in the editor.</li>}</ul></section>;
}
