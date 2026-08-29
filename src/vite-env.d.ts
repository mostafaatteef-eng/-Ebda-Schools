/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_APPS_SCRIPT_URL?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_COMPANY_NAME?: string;
  readonly VITE_TIMEZONE?: string;
  readonly [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
