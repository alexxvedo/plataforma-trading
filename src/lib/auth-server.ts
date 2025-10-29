import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

// Export auth for use in other server-side code
export { auth };

/**
 * Get the current session from the server side
 * Use this in Server Components, Server Actions, and Route Handlers
 */
export async function getSession() {
  return await auth.api.getSession({
    headers: await headers(),
  });
}

/**
 * Require authentication for a server component or route
 * Redirects to login if not authenticated
 */
export async function requireAuth() {
  const session = await getSession();
  
  if (!session) {
    redirect("/login");
  }
  
  return session;
}

/**
 * Get the current user from the server side
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

/**
 * Check if user is authenticated on the server side
 */
export async function isAuthenticated() {
  const session = await getSession();
  return !!session;
}

