export type Route =
  | { type: "home" }
  | { type: "guide"; id: string }
  | { type: "studio"; id: string; anchor?: string }
  | { type: "api-index" }
  | { type: "api"; namespace: string; item?: string }
  | { type: "examples"; file?: string }
  | { type: "not-found" };

export function routeTo(path: string) {
  const next = path.startsWith("/") ? path : `/${path}`;
  if (window.location.hash.slice(1) === next) {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  } else {
    window.location.hash = next;
  }
}

export function parseRoute(): Route {
  let hash: string;
  try { hash = decodeURIComponent(window.location.hash.replace(/^#/, "") || "/"); } catch { return { type: "not-found" }; }
  const parts = hash.split("/").filter(Boolean);
  if (!parts.length) return { type: "home" };
  if (parts[0] === "studio" && parts[1]) return { type: "studio", id: parts[1], anchor: parts[2] };
  if (parts[0] === "guide" && parts[1]) return { type: "guide", id: parts[1] };
  if (parts[0] === "api" && !parts[1]) return { type: "api-index" };
  if (parts[0] === "api" && parts[1]) return { type: "api", namespace: parts[1], item: parts[2] };
  if (parts[0] === "examples") return { type: "examples", file: parts.slice(1).join("/") || undefined };
  return { type: "not-found" };
}
