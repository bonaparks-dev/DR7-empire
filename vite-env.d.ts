// FIX: Manually define types for import.meta.env since vite/client types were not being found.
// This ensures that TypeScript recognizes environment variables from Vite.
interface ImportMetaEnv {
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string;
  // Add other environment variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
