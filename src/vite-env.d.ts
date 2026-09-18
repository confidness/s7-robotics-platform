/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** PIN that gates mentor registration. Set it in the deployment environment. */
  readonly VITE_MENTOR_PIN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
