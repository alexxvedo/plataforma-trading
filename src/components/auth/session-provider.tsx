"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  fallback,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.push(redirectTo);
    }
  }, [session, isPending, router, redirectTo]);

  if (isPending) {
    return (
      fallback || (
        <div className="flex min-h-screen items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      )
    );
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}

export function PublicRoute({
  children,
  redirectIfAuthenticated = "/",
}: {
  children: React.ReactNode;
  redirectIfAuthenticated?: string;
}) {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && session) {
      router.push(redirectIfAuthenticated);
    }
  }, [session, isPending, router, redirectIfAuthenticated]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (session) {
    return null;
  }

  return <>{children}</>;
}

