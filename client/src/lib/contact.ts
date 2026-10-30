// Fallback keeps the address visible if the deploy forgets to set the env var.
export const SUPPORT_EMAIL: string =
  import.meta.env.VITE_SUPPORT_EMAIL || "supportnoshbob@gmail.com";
