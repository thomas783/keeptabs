import { test } from "node:test";
import assert from "node:assert";
import { tabMatches, filterSessions } from "../search.js";

test("tabMatches: blank query matches everything", () => {
  assert.equal(tabMatches({ title: "x", url: "y" }, ""), true);
  assert.equal(tabMatches({ title: "x", url: "y" }, "   "), true);
});

test("tabMatches: matches title or url, case-insensitive", () => {
  const tab = { title: "GitHub PR", url: "https://github.com/a" };
  assert.equal(tabMatches(tab, "github"), true); // title
  assert.equal(tabMatches(tab, "PR"), true); // title, mixed case
  assert.equal(tabMatches(tab, "GITHUB.COM"), true); // url, upper query
  assert.equal(tabMatches(tab, "figma"), false);
});

test("tabMatches: tolerates missing title/url", () => {
  assert.equal(tabMatches({ url: "https://x.com" }, "x.com"), true);
  assert.equal(tabMatches({ title: "hi" }, "hi"), true);
  assert.equal(tabMatches({}, "hi"), false);
});

test("filterSessions: blank query returns all sessions with all tabs", () => {
  const sessions = [{ name: "a", tabs: [{ title: "t", url: "u" }] }];
  const out = filterSessions(sessions, "");
  assert.equal(out.length, 1);
  assert.deepEqual(out[0].tabs, sessions[0].tabs);
});

test("filterSessions: session-name match keeps all its tabs", () => {
  const sessions = [
    {
      name: "Trip to Lisbon",
      tabs: [
        { title: "airbnb", url: "a" },
        { title: "flights", url: "b" },
      ],
    },
  ];
  const out = filterSessions(sessions, "lisbon");
  assert.equal(out.length, 1);
  assert.equal(out[0].tabs.length, 2); // name matched → all tabs shown
});

test("filterSessions: tab match keeps only the matching tabs", () => {
  const sessions = [
    {
      name: "",
      tabs: [
        { title: "Hacker News", url: "news.yc" },
        { title: "MDN", url: "mozilla" },
      ],
    },
  ];
  const out = filterSessions(sessions, "mdn");
  assert.equal(out.length, 1);
  assert.equal(out[0].tabs.length, 1);
  assert.equal(out[0].tabs[0].title, "MDN");
});

test("filterSessions: drops sessions with no match", () => {
  const sessions = [
    { name: "Research", tabs: [{ title: "arxiv", url: "arxiv.org" }] },
    { name: "Trip", tabs: [{ title: "airbnb", url: "airbnb.com" }] },
  ];
  const out = filterSessions(sessions, "arxiv");
  assert.equal(out.length, 1);
  assert.equal(out[0].session.name, "Research");
});

test("filterSessions: matches by url too", () => {
  const sessions = [
    { name: "", tabs: [{ title: "Home", url: "https://airbnb.com/lisbon" }] },
  ];
  const out = filterSessions(sessions, "airbnb.com");
  assert.equal(out.length, 1);
  assert.equal(out[0].tabs.length, 1);
});
