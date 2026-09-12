import { useState } from "react";
import { BookOpen, ChevronRight, Search, Info } from "lucide-react";
import { HELP_CATEGORIES, HELP_ARTICLES } from "../data/helpContent";
import MailtoLink from "../components/MailtoLink";

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
          {/* `imagePending` is kept in the data as a to-do marker for whoever captures the
              screenshots, but it isn't rendered - a reader gained nothing from being told a
              picture was coming, and five "coming soon" panels against one real screenshot
              made the whole section look unfinished. */}
          {article.image && (
            <img src={article.image.src} alt={article.image.alt || ""} className="w-full rounded-lg" style={{ border: "1px solid var(--border)" }} />
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
  // Most categories are entirely admin-only, so a viewer was being offered filter chips that
  // could only ever resolve to an empty list. Only offer a category someone can actually open.
  const visibleCategories = HELP_CATEGORIES.filter(c => visibleArticles.some(a => a.category === c.id));

  return (
    <div className="whmi-fade-in p-6 max-w-[800px] mx-auto space-y-5">
      <div>
        <h1 className="disp text-[22px] font-extrabold">Help Centre</h1>
        {/* Viewers (WH staff and external participants alike) see this page too - telling them
            it's "for the Education Team" reads as though they're in the wrong place. */}
        <p className="text-[13px]" style={{ color: "var(--text-dim)" }}>
          {role === "viewer"
            ? "Guides and answers for registering, reflections and your CPD certificates."
            : "Guides and answers for the WHMI Education Team."}
        </p>
      </div>

      <div className="whmi-input flex items-center gap-2 px-3 py-2.5">
        <Search size={15} style={{ color: "var(--text-faint)" }} />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search help articles..." className="bg-transparent outline-none w-full text-[13px]" style={{ color: "var(--text)" }} />
      </div>

      {!q && (
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setCategory("all")} className="whmi-badge" style={{ background: category === "all" ? "var(--accent-primary)" : "var(--surface-2)", color: category === "all" ? "white" : "var(--text-dim)" }}>All</button>
          {visibleCategories.map(c => (
            <button key={c.id} onClick={() => setCategory(c.id)} className="whmi-badge" style={{ background: category === c.id ? "var(--accent-primary)" : "var(--surface-2)", color: category === c.id ? "white" : "var(--text-dim)" }}>
              {c.label}
            </button>
          ))}
        </div>
      )}

      {/* Guard on `q` - this used to render an empty pair of quotes whenever a category simply
          had nothing in it for this role. */}
      {filtered.length === 0 && (
        <div className="whmi-card p-6 text-center text-[12.5px]" style={{ color: "var(--text-faint)" }}>
          {q ? `No articles match "${query}".` : "Nothing in this section yet."}
        </div>
      )}

      {q ? (
        <div className="whmi-card divide-y" style={{ borderColor: "var(--border)" }}>
          {filtered.map(a => (
            <ArticleItem key={a.id} article={a} open={openId === a.id} onToggle={() => setOpenId(openId === a.id ? null : a.id)} />
          ))}
        </div>
      ) : (
        visibleCategories.filter(c => category === "all" || category === c.id).map(cat => {
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

      {/* Escape hatch: without this, someone who can't find their answer here has nowhere
          obvious to go next - the contact address only appeared on the login screen. */}
      <div className="whmi-card p-4 text-center text-[12.5px]" style={{ color: "var(--text-dim)" }}>
        Can't find what you need? Email the Education Team at{" "}
        <MailtoLink email="whmieducation@wh.org.au" style={{ color: "var(--accent-secondary)", fontWeight: 600 }} />
      </div>
    </div>
  );
}
