// Feedback form → Cloudflare Worker relay (worker/) → public GitHub issue.
// The only network request KeepTabs makes, and only when the user presses Send.

export const FEEDBACK_ENDPOINT = "https://keeptabs-feedback.keeptabs.workers.dev";
export const ISSUES_URL = "https://github.com/thomas783/keeptabs/issues";

// Resolves to the created issue's URL; throws Error(code) on failure
// (codes mirror the Worker: too-short, rate-limited, … or "network").
export async function sendFeedback({ type, message, lang }) {
  let res;
  try {
    res = await fetch(FEEDBACK_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, message, lang, version: chrome.runtime.getManifest().version }),
    });
  } catch {
    throw new Error("network");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "failed");
  return data.url;
}
