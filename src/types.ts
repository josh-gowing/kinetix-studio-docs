export type ApiItem = {
  label: string;
  insertText?: string;
  detail?: string;
  documentation: string;
  kind?: string;
};

export type ApiDeclaration = {
  label: string;
  signature: string;
  documentation: string;
};

export type KxRegistry = {
  language: string;
  version: string;
  declarations: ApiDeclaration[];
  globals: string[];
  globalItems: ApiItem[];
  namespaces: Record<string, ApiItem[]>;
  items: ApiItem[];
};

export type GuideId =
  | "getting-started"
  | "language-basics"
  | "script-types"
  | "data"
  | "strategies"
  | "multi-asset"
  | "point-in-time"
  | "research";
