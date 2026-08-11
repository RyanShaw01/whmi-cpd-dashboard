import { useState } from "react";
import { splitPeopleList, parsePerson } from "../lib/helpers";

// Compact presenter display for event cards: shows just the first presenter's name, plus a
// small hover-highlighted "+N more" toggle when there's more than one, so a card with several
// presenters doesn't force a long name list into limited card space by default.
//
// The toggle is a <span role="button"> rather than a real <button> - every card that uses this
// wraps its whole body in a single clickable <button onClick={() => openEvent(ev)}>, and a
// <button> nested inside another <button> is invalid HTML (browsers silently mis-parse it,
// closing the outer button early), so this stays nestable anywhere.
function Toggle({ children, onActivate }) {
  return (
    <span
      role="button" tabIndex={0}
      onClick={e => { e.preventDefault(); e.stopPropagation(); onActivate(); }}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onActivate(); } }}
      className="font-semibold cursor-pointer transition hover:underline"
      style={{ color: "var(--accent-secondary)" }}
    >
      {children}
    </span>
  );
}

export default function PresenterLine({ presenter, className }) {
  const [expanded, setExpanded] = useState(false);
  const people = splitPeopleList(presenter);
  if (people.length === 0) return null;

  const first = parsePerson(people[0]);
  if (people.length === 1) {
    return (
      <span className={className}>
        {first.name}{first.title && <span style={{ color: "var(--text-faint)" }}> — {first.title}</span>}
      </span>
    );
  }

  if (expanded) {
    return (
      <span className={className}>
        {people.map((p, i) => {
          const { name, title } = parsePerson(p);
          return <span key={i} className="block">{name}{title && <span style={{ color: "var(--text-faint)" }}> — {title}</span>}</span>;
        })}
        <Toggle onActivate={() => setExpanded(false)}>Show less</Toggle>
      </span>
    );
  }

  return (
    <span className={className}>
      {first.name}{" "}
      <Toggle onActivate={() => setExpanded(true)}>+{people.length - 1} more</Toggle>
    </span>
  );
}
