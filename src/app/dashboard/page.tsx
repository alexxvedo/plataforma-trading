"use client";

import { ProtectedRoute } from "@/components/auth/session-provider";
import { UserNav } from "@/components/auth/user-nav";
import { useSession } from "@/lib/auth-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CopyIcon } from "lucide-react";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b bg-white dark:bg-zinc-900">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold">Plataforma Trading</h1>
          <UserNav />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-2">
            <h2 className="text-3xl font-bold">
              Bienvenido, {session?.user.name}
            </h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" asChild onClick={() => navigator.clipboard.writeText(session?.user.id || "")} className="flex items-center space-x-2 cursor-pointer">
                    <div>
                      <CopyIcon className="h-4 w-4" />
                      <span>ID: {session?.user.id}</span>
                    </div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copiar ID</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Has iniciado sesión correctamente
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Tu Perfil</CardTitle>
              <CardDescription>Información de tu cuenta</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Nombre
                  </dt>
                  <dd className="text-sm">{session?.user.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Email
                  </dt>
                  <dd className="text-sm">{session?.user.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    ID
                  </dt>
                  <dd className="text-sm font-mono text-xs">
                    {session?.user.id}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sesión Activa</CardTitle>
              <CardDescription>Información de tu sesión actual</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Session ID
                  </dt>
                  <dd className="text-sm font-mono text-xs">
                    {session?.session.id}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    Expira
                  </dt>
                  <dd className="text-sm">
                    {session?.session.expiresAt
                      ? new Date(session.session.expiresAt).toLocaleDateString(
                          "es-ES",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )
                      : "N/A"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Próximos Pasos</CardTitle>
              <CardDescription>
                Funcionalidades que puedes explorar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>✅ Autenticación implementada</li>
                <li>✅ Protección de rutas</li>
                <li>✅ Gestión de sesiones</li>
                <li>🔜 Análisis de trading</li>
                <li>🔜 Configuración de estrategias</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

