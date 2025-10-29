"use client";

import { useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle2,
  Edit,
  Key,
  Mail,
  Shield,
  User,
  Calendar,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if not authenticated
  if (!isPending && !session) {
    router.push("/login");
    return null;
  }

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600" />
      </div>
    );
  }

  const user = session?.user;
  const userSession = session?.session;

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      // Aquí iría la lógica para actualizar el perfil
      // Por ahora solo simulamos la actualización
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setMessage({
        type: "success",
        text: "Perfil actualizado correctamente",
      });
      setIsEditing(false);
    } catch {
      setMessage({
        type: "error",
        text: "Error al actualizar el perfil",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({
        type: "error",
        text: "Las contraseñas no coinciden",
      });
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setMessage({
        type: "error",
        text: "La contraseña debe tener al menos 8 caracteres",
      });
      setIsLoading(false);
      return;
    }

    try {
      // Aquí iría la lógica para cambiar la contraseña
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setMessage({
        type: "success",
        text: "Contraseña actualizada correctamente",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setMessage({
        type: "error",
        text: "Error al cambiar la contraseña",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="border-b bg-white dark:bg-zinc-900">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Dashboard
            </Link>
          </Button>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Profile Header */}
        <div className="mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-6 md:flex-row">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user?.image || undefined} alt={user?.name || ""} />
                  <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                    {user?.name}
                  </h1>
                  <p className="text-zinc-600 dark:text-zinc-400">{user?.email}</p>
                  <div className="mt-2 flex flex-wrap justify-center gap-2 md:justify-start">
                    <Badge variant="secondary">
                      <Shield className="mr-1 h-3 w-3" />
                      Cuenta Verificada
                    </Badge>
                    <Badge variant="outline">
                      <Calendar className="mr-1 h-3 w-3" />
                      Miembro desde{" "}
                      {new Date(user?.createdAt || "").toLocaleDateString("es-ES", {
                        month: "short",
                        year: "numeric",
                      })}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Messages */}
        {message && (
          <Alert
            variant={message.type === "error" ? "destructive" : "default"}
            className="mb-6"
          >
            {message.type === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">
              <User className="mr-2 h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="mr-2 h-4 w-4" />
              Seguridad
            </TabsTrigger>
            <TabsTrigger value="sessions">
              <Key className="mr-2 h-4 w-4" />
              Sesiones
            </TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>
                  Actualiza tu información de perfil y email
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      <User className="mr-2 inline h-4 w-4" />
                      Nombre completo
                    </Label>
                    <Input
                      id="name"
                      placeholder={user?.name || "Tu nombre"}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={!isEditing || isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      <Mail className="mr-2 inline h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={user?.email || "tu@email.com"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={!isEditing || isLoading}
                    />
                    <p className="text-xs text-zinc-500">
                      El email es usado para iniciar sesión y notificaciones
                    </p>
                  </div>

                  <Separator className="my-4" />

                  <div className="flex justify-end gap-2">
                    {isEditing ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false);
                            setName("");
                            setEmail("");
                          }}
                          disabled={isLoading}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? "Guardando..." : "Guardar cambios"}
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        variant="outline"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Editar perfil
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Cambiar Contraseña</CardTitle>
                <CardDescription>
                  Asegura tu cuenta con una contraseña segura
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Contraseña actual</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nueva contraseña</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isLoading}
                      minLength={8}
                    />
                    <p className="text-xs text-zinc-500">
                      Mínimo 8 caracteres
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Confirmar nueva contraseña
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                      minLength={8}
                    />
                  </div>

                  <Separator className="my-4" />

                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Actualizando..." : "Actualizar contraseña"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions">
            <Card>
              <CardHeader>
                <CardTitle>Sesión Activa</CardTitle>
                <CardDescription>
                  Información sobre tu sesión actual
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          Sesión actual
                        </p>
                        <p className="text-sm text-zinc-500">
                          {userSession?.ipAddress || "IP no disponible"}
                        </p>
                      </div>
                    </div>
                    <Badge>Activa</Badge>
                  </div>

                  <div className="grid gap-4 rounded-lg border p-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-zinc-500">
                        Session ID
                      </p>
                      <p className="mt-1 font-mono text-xs text-zinc-900 dark:text-zinc-100">
                        {userSession?.id.slice(0, 16)}...
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-500">
                        Expira el
                      </p>
                      <p className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                        {userSession?.expiresAt
                          ? new Date(userSession.expiresAt).toLocaleDateString(
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
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-500">
                        User Agent
                      </p>
                      <p className="mt-1 text-xs text-zinc-900 dark:text-zinc-100">
                        {userSession?.userAgent?.slice(0, 50) || "N/A"}...
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-500">
                        Creada el
                      </p>
                      <p className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                        {userSession?.createdAt
                          ? new Date(userSession.createdAt).toLocaleDateString(
                              "es-ES",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900">
                  <h4 className="mb-2 font-medium text-zinc-900 dark:text-zinc-100">
                    Información de Seguridad
                  </h4>
                  <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                      Las sesiones expiran automáticamente después de 7 días
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                      La sesión se renueva automáticamente cada 24 horas
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                      Puedes cerrar sesión en cualquier momento
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

