import type { GuideId } from "../types";

export const guides: Array<{ id: GuideId; label: string; description: string }> = [
  { id: "getting-started", label: "Getting Started", description: "Write and run your first KX script." },
  { id: "language-basics", label: "Language Basics", description: "Series, scalars, control flow, missing values and collections." },
  { id: "script-types", label: "Script Types", description: "Indicators, Studies, Strategies, Pipelines and Libraries." },
  { id: "data", label: "Data & Datasets", description: "Use chart data, Data Library datasets and other instruments." },
  { id: "strategies", label: "Strategies & Orders", description: "Entries, exits, sizing, broker state and deterministic execution." },
  { id: "multi-asset", label: "Multi-Asset Portfolios", description: "Shared capital, instrument routing and dynamic universes." },
  { id: "point-in-time", label: "Point-in-Time Data", description: "Availability timestamps, causal alignment and event research." },
  { id: "research", label: "Research & Reports", description: "Reports, saved runs, sweeps and train/OOS workflows." }
];

export const apiGroups: Array<{ label: string; namespaces: string[] }> = [
  { label: "Technical Analysis", namespaces: ["ta", "stats", "math", "series"] },
  { label: "Data & Time", namespaces: ["data", "time", "session"] },
  { label: "Visualisation", namespaces: ["plot", "pane", "draw"] },
  { label: "Research", namespaces: ["report", "input"] },
  { label: "Collections", namespaces: ["array", "map", "set", "object"] },
  { label: "Execution", namespaces: ["strategy"] },
  { label: "Utilities", namespaces: ["log", "console"] }
];
