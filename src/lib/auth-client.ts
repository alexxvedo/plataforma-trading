import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL || "https://plataforma-trading-5vtrqethh-alejandros-projects-104c7543.vercel.app",
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
} = authClient;

