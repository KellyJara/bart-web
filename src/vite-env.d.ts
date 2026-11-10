/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_URL_BACKEND: string;
  readonly VITE_URL_PRODUCCION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
