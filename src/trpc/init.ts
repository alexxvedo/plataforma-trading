import { initTRPC } from "@trpc/server";
import { cache } from "react";
import { auth } from "@/lib/auth-server";
import { headers } from "next/headers";

export type TRPCContext = {
  userId: string;
};

export const createTRPCContext = cache(async (): Promise<TRPCContext> => {
  /**
   * @see: https://trpc.io/docs/server/context
   */
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    // Return a default userId for unauthenticated requests
    // Los procedimientos protegidos deberían verificar la autenticación
    return { userId: "" };
  }

  return { userId: session.user.id };
});

// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.context<TRPCContext>().create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  // transformer: superjson,
});

// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;

// Protected procedure that requires authentication
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new Error("UNAUTHORIZED");
  }
  return next({
    ctx: {
      userId: ctx.userId,
    },
  });
});
