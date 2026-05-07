/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_API_KEY: string;
  readonly VITE_ACTIVATION_ID: string;
  readonly VITE_VENDOR_ADDRESS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
