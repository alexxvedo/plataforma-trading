"use client";

import { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Copy,
  Plus,
  RefreshCw,
  Trash2,
  AlertCircle,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function TradingAccountsPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});

  // Form state
  const [formData, setFormData] = useState({
    accountNumber: "",
    broker: "",
    platform: "MT5" as "MT4" | "MT5",
    accountType: "Real",
    isMaster: false,
    isSlave: false,
  });

  // Queries - usando tRPC con queryOptions
  // Sistema inteligente de polling: solo consulta si hay EAs conectados
  const accountsQuery = useQuery({
    ...trpc.tradingAccount.getMyAccounts.queryOptions(),
    refetchInterval: (query) => {
      const data = query.state.data;
      
      // Si no hay datos, consultar cada 5 segundos
      if (!data || data.length === 0) {
        return 5000;
      }
      
      // Verificar si algún EA está activo (sincronizado en los últimos 30 segundos)
      const now = new Date().getTime();
      const hasActiveEA = data.some((account: any) => {
        if (!account.lastSync) return false;
        const lastSyncTime = new Date(account.lastSync).getTime();
        const timeSinceSync = now - lastSyncTime;
        return timeSinceSync < 30000; // 30 segundos
      });
      
      // Si hay EA activo, polling rápido (100ms)
      // Si no hay EA activo, polling lento (10 segundos) para detectar reconexión
      return hasActiveEA ? 100 : 10000;
    },
    refetchIntervalInBackground: true,
  });
  const accounts = accountsQuery.data;
  const isLoading = accountsQuery.isLoading;

  // Mutations - usando tRPC con mutationOptions
  const createAccountMutation = useMutation({
    ...trpc.tradingAccount.createAccount.mutationOptions(),
    onSuccess: (data: any) => {
      toast.success("Cuenta creada exitosamente");
      setIsAddDialogOpen(false);
      setSelectedAccount(data.id);
      setShowApiKey({ [data.id]: true });
      queryClient.invalidateQueries({ queryKey: trpc.tradingAccount.getMyAccounts.queryKey() });
      
      // Reset form
      setFormData({
        accountNumber: "",
        broker: "",
        platform: "MT5",
        accountType: "Real",
        isMaster: false,
        isSlave: false,
      });
    },
    onError: (error: any) => {
      toast.error("Error al crear cuenta: " + error.message);
    },
  });

  const deleteAccountMutation = useMutation({
    ...trpc.tradingAccount.deleteAccount.mutationOptions(),
    onSuccess: () => {
      toast.success("Cuenta eliminada");
      queryClient.invalidateQueries({ queryKey: trpc.tradingAccount.getMyAccounts.queryKey() });
    },
    onError: (error: any) => {
      toast.error("Error al eliminar: " + error.message);
    },
  });

  const regenerateApiKeyMutation = useMutation({
    ...trpc.tradingAccount.regenerateApiKey.mutationOptions(),
    onSuccess: () => {
      toast.success("API Key regenerada");
      queryClient.invalidateQueries({ queryKey: trpc.tradingAccount.getMyAccounts.queryKey() });
    },
    onError: (error: any) => {
      toast.error("Error al regenerar: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAccountMutation.mutate(formData);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado al portapapeles`);
  };

  const toggleApiKeyVisibility = (accountId: string) => {
    setShowApiKey((prev) => ({
      ...prev,
      [accountId]: !prev[accountId],
    }));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cuentas de Trading</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona tus cuentas de MetaTrader 4 y MetaTrader 5
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Añadir Cuenta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Añadir Cuenta de Trading</DialogTitle>
                <DialogDescription>
                  Registra una cuenta de MT4/MT5 para conectar tu Expert Advisor
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="accountNumber">Número de Cuenta</Label>
                  <Input
                    id="accountNumber"
                    placeholder="12345678"
                    value={formData.accountNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, accountNumber: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="broker">Broker</Label>
                  <Input
                    id="broker"
                    placeholder="ej: ICMarkets, XM, Pepperstone..."
                    value={formData.broker}
                    onChange={(e) =>
                      setFormData({ ...formData, broker: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="platform">Plataforma</Label>
                  <Select
                    value={formData.platform}
                    onValueChange={(value: "MT4" | "MT5") =>
                      setFormData({ ...formData, platform: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MT4">MetaTrader 4</SelectItem>
                      <SelectItem value="MT5">MetaTrader 5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="accountType">Tipo de Cuenta</Label>
                  <Select
                    value={formData.accountType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, accountType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Demo">Demo</SelectItem>
                      <SelectItem value="Real">Real</SelectItem>
                      <SelectItem value="Contest">Contest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createAccountMutation.isPending}>
                  {createAccountMutation.isPending ? "Creando..." : "Crear Cuenta"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alert para nueva cuenta */}
      {selectedAccount && showApiKey[selectedAccount] && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>¡Importante! Guarda tu API Key</AlertTitle>
          <AlertDescription>
            La API Key se muestra más abajo. Cópiala y configúrala en tu Expert Advisor.
            Puedes regenerarla en cualquier momento si la pierdes.
          </AlertDescription>
        </Alert>
      )}

      {/* Lista de cuentas */}
      {accounts?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground mb-4">
              No tienes cuentas de trading registradas
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Añadir Primera Cuenta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {accounts?.map((account: any) => {
            const latestSnapshot = account.snapshots[0];
            const isApiKeyVisible = showApiKey[account.id];

            return (
              <Card
                key={account.id}
                className={
                  selectedAccount === account.id ? "ring-2 ring-primary" : ""
                }
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {account.accountNumber}
                        {!account.isActive && (
                          <Badge variant="secondary">Inactiva</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {account.broker} • {account.platform}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {account.isMaster && (
                        <Badge variant="default">Master</Badge>
                      )}
                      {account.isSlave && (
                        <Badge variant="outline">Slave</Badge>
                      )}
                      {(() => {
                        if (!account.lastSync) {
                          return <Badge variant="secondary" className="bg-gray-500">Sin conexión</Badge>;
                        }
                        const timeSinceSync = Date.now() - new Date(account.lastSync).getTime();
                        if (timeSinceSync < 30000) {
                          return <Badge variant="default" className="bg-green-600">● Conectado</Badge>;
                        }
                        return <Badge variant="destructive">Desconectado</Badge>;
                      })()}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Métricas */}
                  {latestSnapshot && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Balance</p>
                        <p className="font-semibold">
                          ${latestSnapshot.balance.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Equity</p>
                        <p className="font-semibold">
                          ${latestSnapshot.equity.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Profit</p>
                        <p
                          className={`font-semibold ${
                            latestSnapshot.profit >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          ${latestSnapshot.profit.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Margin Level</p>
                        <p className="font-semibold">
                          {latestSnapshot.marginLevel?.toFixed(0) || "N/A"}%
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Posiciones */}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Posiciones abiertas
                    </span>
                    <span className="font-medium">{account.positions.length}</span>
                  </div>

                  {/* Ver detalles */}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push(`/dashboard/accounts/${account.id}`)}
                  >
                    Ver Detalles Completos
                  </Button>

                  {/* API Key */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">
                        API Key
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleApiKeyVisibility(account.id)}
                      >
                        {isApiKeyVisible ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <code className="flex-1 text-xs bg-muted p-2 rounded overflow-hidden">
                        {isApiKeyVisible
                          ? account.apiKey
                          : "•".repeat(20)}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(account.apiKey, "API Key")
                        }
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Last sync */}
                  {account.lastSync && (
                    <p className="text-xs text-muted-foreground">
                      Última sincronización:{" "}
                      {new Date(account.lastSync).toLocaleString()}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        if (
                          confirm(
                            "¿Regenerar API Key? El EA actual dejará de funcionar hasta que configures la nueva key."
                          )
                        ) {
                          regenerateApiKeyMutation.mutate({ id: account.id });
                        }
                      }}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Regenerar Key
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (
                          confirm(
                            "¿Eliminar esta cuenta? Esta acción no se puede deshacer."
                          )
                        ) {
                          deleteAccountMutation.mutate({ id: account.id });
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Link to instructions */}
                  <Button
                    variant="link"
                    size="sm"
                    className="w-full"
                    asChild
                  >
                    <a
                      href="/docs/ea-setup"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Cómo configurar el EA
                    </a>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
