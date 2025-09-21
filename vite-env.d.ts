// FIX: Manually define types for environment variables since vite/client types were not being found.
// This ensures that TypeScript recognizes environment variables.

// `import.meta.env` definitions (Vite's standard).
interface ImportMetaEnv {
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string;
  // Add other environment variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// `process.env` definitions for a Node-like environment or polyfilled browser env.
declare namespace NodeJS {
  interface ProcessEnv {
    readonly VITE_STRIPE_PUBLISHABLE_KEY: string;
    // Add other env vars for client-side access here.
  }
}
