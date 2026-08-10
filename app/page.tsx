"use client";

import { useEffect, useMemo, useState } from "react";

type FormState = {
  asin: string; product: string; category: string; audience: string; price: string; rating: string;
  url: string; tag: string; features: string; pros: string; cons: string; verdict: string; reviewThemes: string;
};

type Research = Partial<FormState> & { sources?: { title: string; url: string }[] };

type Opportunity = {
  id: string; asin: string; product: string; category: string; keyword: string;
  demand: number; trend: number; intent: number; competition: number; commission: number; gap: number;
  status: "Idea" | "Shortlisted" | "Drafting"; notes: string;
};

const opportunityWeights = { demand: 20, trend: 15, intent: 20, competition: 15, commission: 10, gap: 20 };
const exampleOpportunity: Opportunity = {
  id: "example", asin: "B0C3HCD34R", product: "Soundcore Q20i Hybrid ANC Headphones",
  category: "Audio", keyword: "best budget noise cancelling headphones for commuting",
  demand: 7, trend: 7, intent: 9, competition: 5, commission: 6, gap: 8,
  status: "Shortlisted", notes: "Strong specific use case. Check the current SERP before publishing.",
};

function opportunityScore(item: Opportunity) {
  const positiveCompetition = 11 - item.competition;
  return Math.round((item.demand * opportunityWeights.demand + item.trend * opportunityWeights.trend + item.intent * opportunityWeights.intent + positiveCompetition * opportunityWeights.competition + item.commission * opportunityWeights.commission + item.gap * opportunityWeights.gap) / 10);
}

const initial: FormState = {
  asin: "B0C3HCD34R",
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
  reviewThemes: "Buyers commonly praise the battery life and value for money. Some owners say the companion app makes it easier to tune the sound.",
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
  const [view, setView] = useState<"research" | "builder">("research");
  const [form, setForm] = useState<FormState>(initial);
  const [draftOpportunity, setDraftOpportunity] = useState<Opportunity>({ ...exampleOpportunity, id: "draft", product: "", asin: "", keyword: "", notes: "", status: "Idea" });
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [imagePrompt, setImagePrompt] = useState("Show this exact product being used naturally at a tidy home-office desk, realistic editorial photography. Keep its shape, colours, branding and controls accurate.");
  const [generatedImage, setGeneratedImage] = useState("");
  const [sources, setSources] = useState<{ title: string; url: string }[]>([]);
  const [busy, setBusy] = useState<"research" | "image" | "">("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const update = (key: keyof FormState, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const link = useMemo(() => affiliateUrl(form.url, form.tag), [form.url, form.tag]);
  const score = Number(form.rating) || 4.5;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("ama-opportunities-v1");
      if (saved) setOpportunities(JSON.parse(saved) as Opportunity[]);
    } catch { /* Browser storage is optional. */ }
  }, []);

  useEffect(() => {
    try { window.localStorage.setItem("ama-opportunities-v1", JSON.stringify(opportunities)); }
    catch { /* Browser storage is optional. */ }
  }, [opportunities]);

  function saveOpportunity() {
    if (!draftOpportunity.product.trim() || !draftOpportunity.keyword.trim()) return;
    const item = { ...draftOpportunity, id: crypto.randomUUID() };
    setOpportunities((current) => [item, ...current]);
    setDraftOpportunity((current) => ({ ...current, id: "draft", product: "", asin: "", keyword: "", notes: "", status: "Idea" }));
  }

  function buildFromOpportunity(item: Opportunity) {
    setForm((current) => ({ ...current, asin: item.asin, product: item.product, category: item.category, url: item.asin.length === 10 ? `https://www.amazon.co.uk/dp/${item.asin}` : current.url }));
    setOpportunities((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: "Drafting" } : entry));
    setView("builder");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateAsin(value: string) {
    const asin = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
    setForm((current) => ({ ...current, asin, url: asin.length === 10 ? `https://www.amazon.co.uk/dp/${asin}` : current.url }));
  }

  function addPhotos(files: FileList | null) {
    if (!files) return;
    const selected = Array.from(files).filter((file) => file.type.startsWith("image/")).slice(0, 4 - photoFiles.length);
    setPhotoFiles((current) => [...current, ...selected].slice(0, 4));
    setPhotos((current) => [...current, ...selected.map(URL.createObjectURL)].slice(0, 4));
  }

  async function researchProduct() {
    if (form.asin.length !== 10) return setError("Enter a valid 10-character ASIN first.");
    setBusy("research"); setError("");
    try {
      const response = await fetch("/api/research", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ asin: form.asin, url: form.url, tag: form.tag }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Research failed");
      const research = data as Research;
      setForm((current) => ({ ...current, ...Object.fromEntries(Object.entries(research).filter(([key, value]) => key in current && typeof value === "string")) }));
      setSources(research.sources || []);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Research failed"); }
    finally { setBusy(""); }
  }

  async function createLifestyleImage() {
    if (!photoFiles[0]) return setError("Upload a photo you own or have permission to edit first.");
    setBusy("image"); setError("");
    try {
      const body = new FormData(); body.append("image", photoFiles[0]); body.append("prompt", imagePrompt); body.append("product", form.product);
      const response = await fetch("/api/image", { method: "POST", body }); const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Image generation failed");
      setGeneratedImage(`data:image/png;base64,${data.image}`);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Image generation failed"); }
    finally { setBusy(""); }
  }

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
    <header className="topbar"><a className="brand" href="#top" aria-label="AMA Review Builder home"><span>ama</span> Review Builder</a><nav className="app-nav" aria-label="App sections"><button className={view === "research" ? "active" : ""} onClick={() => setView("research")}>Research</button><button className={view === "builder" ? "active" : ""} onClick={() => setView("builder")}>Page builder</button></nav><div className="status"><i /> Saved on this device</div></header>
    <section className="hero" id="top"><div><p className="eyebrow">Affiliate research, without the faff</p><h1>{view === "research" ? "Find ideas worth writing before you spend on content." : "Turn product facts into a review page that’s ready to publish."}</h1><p className="lede">{view === "research" ? "Score real evidence, reject weak ideas and move the best opportunities into your writing pipeline." : "Add what you genuinely know. We’ll shape it into a useful, disclosure-ready review—without inventing hands-on experience."}</p></div><div className="hero-card"><strong>{view === "research" ? "A simple publishing pipeline" : "Built for honest recommendations"}</strong><span>{view === "research" ? "Score idea" : "Facts in"}</span><b>→</b><span>{view === "research" ? "Build page" : "Polished review out"}</span></div></section>

    {view === "research" ? <ResearchDashboard draft={draftOpportunity} setDraft={setDraftOpportunity} opportunities={opportunities} onSave={saveOpportunity} onBuild={buildFromOpportunity} onDelete={(id) => setOpportunities((current) => current.filter((item) => item.id !== id))} /> :

    <section className="workspace">
      <div className="panel editor">
        <div className="panel-heading"><div><p className="step">01 · Product details</p><h2>Build your review</h2></div><button className="ghost" onClick={() => setForm(initial)}>Load example</button></div>
        <div className="research-box"><div><p className="step">Start with Amazon</p><h3>Research by ASIN</h3><p>We research public sources and draft balanced copy. Check every claim before publishing.</p></div><div className="asin-row"><Field label="Amazon ASIN" hint="10 characters" value={form.asin} onChange={updateAsin} /><button className="primary research-button" disabled={busy === "research"} onClick={researchProduct}>{busy === "research" ? "Researching…" : "Research product"}</button></div></div>
        {error && <div className="error" role="alert">{error}</div>}
        <div className="grid two"><Field label="Product name" value={form.product} onChange={(v) => update("product", v)} /><Field label="Category" value={form.category} onChange={(v) => update("category", v)} /></div>
        <Field label="Best for" hint="Who benefits most?" value={form.audience} onChange={(v) => update("audience", v)} />
        <div className="grid two"><Field label="Current price" value={form.price} onChange={(v) => update("price", v)} /><Field label="Amazon rating" value={form.rating} onChange={(v) => update("rating", v)} /></div>
        <Field label="Amazon product URL" value={form.url} onChange={(v) => update("url", v)} />
        <Field label="Associate tag" hint="Optional — added safely to the link" value={form.tag} onChange={(v) => update("tag", v)} />
        <TextField label="Key features" hint="One per line" value={form.features} onChange={(v) => update("features", v)} />
        <div className="grid two"><TextField label="Pros" hint="One per line" value={form.pros} onChange={(v) => update("pros", v)} /><TextField label="Cons" hint="One per line" value={form.cons} onChange={(v) => update("cons", v)} /></div>
        <TextField label="Your verdict" hint="Use your own evidence and judgement" value={form.verdict} onChange={(v) => update("verdict", v)} />
        <TextField label="Customer review themes" hint="Summarise patterns; don't copy whole reviews" value={form.reviewThemes} onChange={(v) => update("reviewThemes", v)} />
        <div className="image-studio"><p className="step">Product image studio</p><h3>Create an in-use image</h3><p>Upload up to four photos that you own or are licensed to edit. Amazon catalogue images should not be altered.</p><label className="upload"><input type="file" accept="image/*" multiple onChange={(event) => addPhotos(event.target.files)} /><span>＋ Add product photos</span></label>{photos.length > 0 && <div className="photo-grid">{photos.map((photo, index) => <img src={photo} alt={`Uploaded product ${index + 1}`} key={photo} />)}</div>}<TextField label="Lifestyle scene" value={imagePrompt} onChange={setImagePrompt} /><button className="primary image-button" disabled={busy === "image" || !photoFiles.length} onClick={createLifestyleImage}>{busy === "image" ? "Creating image…" : "Create AI lifestyle image"}</button><small>Generated images are labelled AI-created in the finished review.</small></div>
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
          {(generatedImage || photos[0]) && <figure className="product-visual"><img src={generatedImage || photos[0]} alt={`${form.product} shown in use`} />{generatedImage && <figcaption>AI-created illustrative image based on an authorised product photo.</figcaption>}</figure>}
          <Section title="Key features" items={lines(form.features)} />
          <div className="pros-cons"><Section title="What we like" items={lines(form.pros)} tone="good" /><Section title="What to consider" items={lines(form.cons)} tone="caution" /></div>
          <section className="verdict"><p className="eyebrow">The bottom line</p><h2>Our verdict</h2><p>{form.verdict}</p><a href={link} target="_blank" rel="nofollow sponsored noopener">View {form.product || "product"} on Amazon →</a></section>
          <section className="review-themes"><p className="eyebrow">What buyers mention</p><h2>Customer review themes</h2><p>{form.reviewThemes || "Research or add a concise summary of recurring customer feedback."}</p><a href={`${form.url}#customerReviews`} target="_blank" rel="nofollow sponsored noopener">Read customer reviews on Amazon →</a>{sources.length > 0 && <div className="sources"><strong>Research sources</strong>{sources.map((source) => <a href={source.url} target="_blank" rel="noopener noreferrer" key={source.url}>{source.title}</a>)}</div>}</section>
        </article>
      </aside>
    </section>}
    <footer><span>AMA Review Builder</span><span>Human judgement. Better structure. Clear disclosure.</span></footer>
  </main>;
}

function ResearchDashboard({ draft, setDraft, opportunities, onSave, onBuild, onDelete }: { draft: Opportunity; setDraft: (item: Opportunity) => void; opportunities: Opportunity[]; onSave: () => void; onBuild: (item: Opportunity) => void; onDelete: (id: string) => void }) {
  const score = opportunityScore(draft);
  const update = <K extends keyof Opportunity>(key: K, value: Opportunity[K]) => setDraft({ ...draft, [key]: value });
  return <section className="research-dashboard">
    <div className="panel score-editor">
      <div className="panel-heading"><div><p className="step">01 · Capture evidence</p><h2>Score a product opportunity</h2></div><div className={`score-badge ${score >= 70 ? "strong" : ""}`}><strong>{score}</strong><span>/ 100</span></div></div>
      <p className="helper">These are your evidence ratings, not made-up keyword data. Use Google Trends, Amazon listings and a manual search until paid SEO tools are connected.</p>
      <div className="grid two"><Field label="Product name" value={draft.product} onChange={(value) => update("product", value)} /><Field label="ASIN" hint="Optional for now" value={draft.asin} onChange={(value) => update("asin", value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10))} /></div>
      <div className="grid two"><Field label="Category / niche" value={draft.category} onChange={(value) => update("category", value)} /><label><span>Pipeline status</span><select value={draft.status} onChange={(event) => update("status", event.target.value as Opportunity["status"])}><option>Idea</option><option>Shortlisted</option><option>Drafting</option></select></label></div>
      <Field label="Target keyword" hint="Prefer a specific buyer and use case" value={draft.keyword} onChange={(value) => update("keyword", value)} />
      <div className="signal-grid">
        <Signal label="Demand" value={draft.demand} help="Visible interest and searches" onChange={(value) => update("demand", value)} />
        <Signal label="Trend" value={draft.trend} help="Rising rather than fading" onChange={(value) => update("trend", value)} />
        <Signal label="Buyer intent" value={draft.intent} help="Close to a purchase" onChange={(value) => update("intent", value)} />
        <Signal label="Competition" value={draft.competition} help="10 = hardest SERP" onChange={(value) => update("competition", value)} />
        <Signal label="Commission" value={draft.commission} help="Value per likely sale" onChange={(value) => update("commission", value)} />
        <Signal label="Content gap" value={draft.gap} help="Room to make something better" onChange={(value) => update("gap", value)} />
      </div>
      <TextField label="Evidence and notes" hint="Sources, angles, warnings, competing pages" value={draft.notes} onChange={(value) => update("notes", value)} />
      <button className="primary save-opportunity" disabled={!draft.product.trim() || !draft.keyword.trim()} onClick={onSave}>Save opportunity</button>
    </div>
    <div className="panel pipeline">
      <div className="panel-heading"><div><p className="step">02 · Publishing pipeline</p><h2>Saved opportunities</h2></div><span className="item-count">{opportunities.length} saved</span></div>
      {opportunities.length === 0 ? <div className="empty-state"><strong>No ideas saved yet</strong><p>Score your first opportunity. It stays privately in this browser until we add accounts and a database.</p></div> : <div className="opportunity-list">{opportunities.map((item) => { const itemScore = opportunityScore(item); return <article className="opportunity" key={item.id}><div className="opportunity-score"><strong>{itemScore}</strong><span>score</span></div><div className="opportunity-copy"><div className="opportunity-top"><span className={`status-chip ${item.status.toLowerCase()}`}>{item.status}</span><small>{item.category || "Uncategorised"}</small></div><h3>{item.product}</h3><p className="keyword">“{item.keyword}”</p>{item.notes && <p className="opportunity-notes">{item.notes}</p>}<div className="opportunity-actions"><button className="primary" onClick={() => onBuild(item)}>Build page →</button><button className="ghost danger" onClick={() => onDelete(item.id)}>Delete</button></div></div></article>; })}</div>}
    </div>
  </section>;
}

function Signal({ label, value, help, onChange }: { label: string; value: number; help: string; onChange: (value: number) => void }) {
  return <label className="signal"><span><b>{label}</b><em>{value}/10</em></span><input type="range" min="1" max="10" value={value} onChange={(event) => onChange(Number(event.target.value))} /><small>{help}</small></label>;
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
