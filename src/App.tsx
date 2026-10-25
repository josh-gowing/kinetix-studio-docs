import { useEffect, useMemo, useState } from "react";
import registryJson from "./generated/kx-api.json";
import type { GuideId, KxRegistry } from "./types";
import { parseRoute, type Route } from "./router";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { SearchPalette } from "./components/SearchPalette";
import { HomePage } from "./components/HomePage";
import { GuidePage } from "./components/GuidePage";
import { ApiIndexPage, NamespacePage } from "./components/ApiPage";
import { ExamplesPage } from "./components/ExamplesPage";

const registry = registryJson as KxRegistry;

export default function App() {
  const [route, setRoute] = useState<Route>(() => parseRoute());
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    if (!window.location.hash) window.location.hash = "/";
    const update = () => { setRoute(parseRoute()); setMobileNav(false); window.scrollTo({ top: 0 }); };
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);

  useEffect(() => {
    function key(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  const content = useMemo(() => {
    switch (route.type) {
      case "home": return <HomePage registry={registry} />;
      case "guide": return <GuidePage id={route.id as GuideId} />;
      case "api-index": return <ApiIndexPage registry={registry} />;
      case "api": return <NamespacePage registry={registry} namespace={route.namespace} item={route.item} />;
      case "examples": return <ExamplesPage activeFile={route.file} />;
      default: return <div className="page empty-state"><h1>Page not found</h1><p>The requested KX documentation route does not exist.</p></div>;
    }
  }, [route]);

  return <div className="app-shell">
    <div className={mobileNav ? "sidebar-wrap mobile-open" : "sidebar-wrap"}><div className="mobile-scrim" onClick={() => setMobileNav(false)} /><Sidebar registry={registry} route={route} onSearch={() => setSearchOpen(true)} /></div>
    <div className="main-shell"><Topbar registry={registry} onSearch={() => setSearchOpen(true)} onMenu={() => setMobileNav(true)} /><main className="content-shell">{content}<footer className="site-footer"><span>Kinetix Studio · KX v{registry.version}</span><span>Canonical language documentation</span></footer></main></div>
    <SearchPalette registry={registry} open={searchOpen} onClose={() => setSearchOpen(false)} />
  </div>;
}
