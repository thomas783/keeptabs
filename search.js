// Pure search/filter helpers — shared by the popup (current-window tabs) and the
// vault (saved sessions). No DOM/chrome deps, so they're unit-testable in Node.

// Does a tab match the query? Empty/blank query matches everything.
export function tabMatches(tab, query) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return true;
  return (
    (tab.title || "").toLowerCase().includes(q) ||
    (tab.url || "").toLowerCase().includes(q)
  );
}

// Filter saved sessions. A session survives if its name matches (then all its
// tabs are shown) or any tab matches (then only the matching tabs are shown).
// Returns [{ session, tabs }] for the surviving sessions.
export function filterSessions(sessions, query) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return sessions.map((s) => ({ session: s, tabs: s.tabs }));

  const out = [];
  for (const s of sessions) {
    const nameMatch = (s.name || "").toLowerCase().includes(q);
    const tabs = nameMatch ? s.tabs : s.tabs.filter((tb) => tabMatches(tb, q));
    if (nameMatch || tabs.length) out.push({ session: s, tabs });
  }
  return out;
}
