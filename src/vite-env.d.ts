/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REVERB_APP_KEY: string;
  readonly VITE_REVERB_HOST: string;
  readonly VITE_REVERB_PORT: string;
  readonly VITE_REVERB_SCHEME: string;
  readonly VITE_REVERB_CLUSTER: string;
  readonly VITE_AUTH_ENDPOINT: string;
  readonly VITE_DEBUG: string;
  readonly VITE_JWT_TOKEN: string;
  readonly VITE_R_AUTH_TOKEN: string;
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
