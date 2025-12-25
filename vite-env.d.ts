/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ZAI_API_KEY?: string;
  readonly API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
