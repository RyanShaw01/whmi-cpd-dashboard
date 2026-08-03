import { useState } from "react";
import { BookOpen, ChevronRight, Search, Info, ImageOff } from "lucide-react";
import { HELP_CATEGORIES, HELP_ARTICLES } from "../data/helpContent";

// Lightweight **bold** markup, no markdown library needed — just wraps matched
// segments in <strong> so key terms/actions stand out in dense step lists.
function renderRich(text) {
  return text.split(/(\*\*.+?\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  );
}

function ArticleItem({ article, open, onToggle }) {
  return (
    <div>
      <button onClick={onToggle} className="w-full flex items-center justify-between gap-3 p-4 text-left">
        <span className="font-semibold text-[13px] flex items-center gap-2 min-w-0">
          <BookOpen size={14} style={{ color: "var(--accent-secondary)" }} className="shrink-0" />
          <span className="break-words">{article.title}</span>
        </span>
        <ChevronRight size={15} style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform .15s", color: "var(--text-faint)" }} className="shrink-0" />
      </button>
      {open && (
        <div className="px-4 pb-4 text-[12.5px] leading-relaxed space-y-2" style={{ color: "var(--text-dim)" }}>
          {article.image ? (
            <img src={article.image.src} alt={article.image.alt || ""} className="w-full rounded-lg" style={{ border: "1px solid var(--border)" }} />
          ) : article.imagePending && (
            <div className="flex items-center gap-1.5 p-3 rounded-lg text-[11px] italic" style={{ background: "var(--surface-2)", color: "var(--text-faint)" }}>
              <ImageOff size={13} className="shrink-0" />Screenshot coming soon
            </div>
          )}
          {article.body && <p>{renderRich(article.body)}</p>}
          {article.steps && (
            <ul className="pl-4 space-y-1.5" style={{ listStyleType: "disc" }}>
              {article.steps.map((s, i) => <li key={i}>{renderRich(s)}</li>)}
            </ul>
          )}
          {article.note && (
            <div className="flex items-start gap-1.5 p-2.5 rounded-lg text-[11.5px]" style={{ background: "var(--surface-2)" }}>
              <Info size={13} className="shrink-0 mt-0.5" style={{ color: "var(--accent-secondary)" }} />
              <span>{renderRich(article.note)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function HelpCentre({ role }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [openId, setOpenId] = useState(null);

  const q = query.trim().toLowerCase();
  const matchesQuery = (a) => {
    if (!q) return true;
    const haystack = [a.title, a.body, a.note, ...(a.steps || [])].filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(q);
  };

  const visibleArticles = role === "viewer" ? HELP_ARTICLES.filter(a => !a.adminOnly) : HELP_ARTICLES;
  const filtered = visibleArticles.filter(a => matchesQuery(a) && (q || category === "all" || a.category === category));

  return (
    <div className="whmi-fade-in p-6 max-w-[800px] mx-auto space-y-5">
      <div>
        <h1 className="disp text-[22px] font-extrabold">Help Centre</h1>
        <p className="text-[13px]" style={{ color: "var(--text-dim)" }}>Guides and answers for the WHMI Education Team.</p>
      </div>

      <div className="whmi-input flex items-center gap-2 px-3 py-2.5">
        <Search size={15} style={{ color: "var(--text-faint)" }} />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search help articles..." className="bg-transparent outline-none w-full text-[13px]" style={{ color: "var(--text)" }} />
      </div>

      {!q && (
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setCategory("all")} className="whmi-badge" style={{ background: category === "all" ? "var(--accent-primary)" : "var(--surface-2)", color: category === "all" ? "white" : "var(--text-dim)" }}>All</button>
          {HELP_CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setCategory(c.id)} className="whmi-badge" style={{ background: category === c.id ? "var(--accent-primary)" : "var(--surface-2)", color: category === c.id ? "white" : "var(--text-dim)" }}>
              {c.label}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="whmi-card p-6 text-center text-[12.5px]" style={{ color: "var(--text-faint)" }}>No articles match "{query}".</div>
      )}

      {q ? (
        <div className="whmi-card divide-y" style={{ borderColor: "var(--border)" }}>
          {filtered.map(a => (
            <ArticleItem key={a.id} article={a} open={openId === a.id} onToggle={() => setOpenId(openId === a.id ? null : a.id)} />
          ))}
        </div>
      ) : (
        HELP_CATEGORIES.filter(c => category === "all" || category === c.id).map(cat => {
          const catArticles = filtered.filter(a => a.category === cat.id);
          if (catArticles.length === 0) return null;
          return (
            <div key={cat.id} className="space-y-2">
              <h2 className="text-[11.5px] font-bold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>{cat.label}</h2>
              <div className="whmi-card divide-y" style={{ borderColor: "var(--border)" }}>
                {catArticles.map(a => (
                  <ArticleItem key={a.id} article={a} open={openId === a.id} onToggle={() => setOpenId(openId === a.id ? null : a.id)} />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
