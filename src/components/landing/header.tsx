"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { UserNav } from "@/components/auth/user-nav";
import { TrendingUp } from "lucide-react";



export function Header() {
  const { data: session, isPending } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md dark:bg-zinc-950/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <TrendingUp className="h-6 w-6 text-blue-600" />
          <span className="text-xl font-bold">TradingSync Pro</span>
        </Link>

        <nav className="hidden items-center space-x-6 md:flex">
          <Link
            href="#features"
            className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Características
          </Link>
          <Link
            href="#how-it-works"
            className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Cómo Funciona
          </Link>
          
        </nav>

        <div className="flex items-center space-x-4">
          {isPending ? (
            // Loading state
            <div className="h-10 w-32 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
          ) : session ? (
            // Usuario autenticado - mostrar navegación de usuario
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <UserNav />
            </div>
          ) : (
            // Usuario no autenticado - mostrar botones de login/signup
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">Iniciar Sesión</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Comenzar Gratis</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

