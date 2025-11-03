"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Wallet,
  PieChart,
  Clock,
  Copy,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

export default function AccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const trpc = useTRPC();
  const accountId = params.id as string;

  // Queries con polling periódico
  const accountQuery = useQuery({
    ...trpc.tradingAccount.getAccountById.queryOptions({ id: accountId }),
    refetchInterval: 5000, // Actualizar cada 5 segundos
    refetchIntervalInBackground: true,
  });

  const statsQuery = useQuery({
    ...trpc.tradingAccount.getAccountStats.queryOptions({ id: accountId }),
    refetchInterval: 5000,
  });

  const account = accountQuery.data as any;
  const stats = statsQuery.data as any;
  const isLoading = accountQuery.isLoading;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground mb-4">Cuenta no encontrada</p>
            <Button onClick={() => router.push("/dashboard/accounts")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Cuentas
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const latestSnapshot = account.snapshots?.[0];
  
  // Check if EA is sending data (lastSync within last 60 seconds)
  const isEAActive = account.lastSync && 
    (Date.now() - new Date(account.lastSync).getTime() < 60000);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/accounts")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{account.accountNumber}</h1>
              {isEAActive ? (
                <Badge className="bg-green-600">● EA Activa</Badge>
              ) : (
                <Badge variant="destructive">EA Inactiva</Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {account.broker} • {account.platform} • {account.accountType || "Real"}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => accountQuery.refetch()}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Métricas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${latestSnapshot?.balance.toLocaleString() || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">
              Equity: ${latestSnapshot?.equity.toLocaleString() || "0.00"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">P&L Abierto</CardTitle>
            {latestSnapshot?.profit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                latestSnapshot?.profit >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              ${latestSnapshot?.profit.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">
              {account.positions?.length || 0} posiciones abiertas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margen</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${latestSnapshot?.margin.toLocaleString() || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">
              Libre: ${latestSnapshot?.freeMargin.toLocaleString() || "0.00"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nivel Margen</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestSnapshot?.marginLevel?.toFixed(0) || "N/A"}%
            </div>
            <p className="text-xs text-muted-foreground">
              Leverage: {latestSnapshot?.leverage || "N/A"}:1
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Operaciones Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTrades}</div>
              <div className="flex items-center gap-2 text-sm mt-2">
                <span className="text-green-600">
                  ✓ {stats.winningTrades} ganadas
                </span>
                <span className="text-red-600">
                  ✗ {stats.losingTrades} perdidas
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.winRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                De {stats.totalTrades} operaciones
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Beneficio Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  stats.netProfit >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                ${stats.netProfit.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Incluye swap y comisiones
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs con información detallada */}
      <Tabs defaultValue="positions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="positions">
            Posiciones ({account.positions?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
          <TabsTrigger value="config">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="positions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Posiciones Abiertas</CardTitle>
              <CardDescription>
                Posiciones activas en tiempo real
              </CardDescription>
            </CardHeader>
            <CardContent>
              {account.positions?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay posiciones abiertas
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket</TableHead>
                      <TableHead>Símbolo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Volumen</TableHead>
                      <TableHead>Precio Apertura</TableHead>
                      <TableHead>Precio Actual</TableHead>
                      <TableHead>SL/TP</TableHead>
                      <TableHead>P&L</TableHead>
                      <TableHead>Swap</TableHead>
                      <TableHead>Comisión</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {account.positions?.map((pos: any) => {
                      const netProfit = pos.profit + (pos.swap || 0) + (pos.commission || 0);
                      return (
                        <TableRow key={pos.id}>
                          <TableCell className="font-mono text-xs">
                            {pos.ticket}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {pos.symbol}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={pos.type === "BUY" ? "default" : "secondary"}
                            >
                              {pos.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{pos.volume}</TableCell>
                          <TableCell>{pos.openPrice.toFixed(5)}</TableCell>
                          <TableCell>{pos.currentPrice?.toFixed(5) || "N/A"}</TableCell>
                          <TableCell className="text-xs">
                            {pos.stopLoss > 0 && <div>SL: {pos.stopLoss.toFixed(5)}</div>}
                            {pos.takeProfit > 0 && <div>TP: {pos.takeProfit.toFixed(5)}</div>}
                          </TableCell>
                          <TableCell
                            className={`font-semibold ${
                              netProfit >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            <div>${pos.profit.toFixed(2)}</div>
                            <div className="text-xs font-normal text-muted-foreground">
                              Neto: ${netProfit.toFixed(2)}
                            </div>
                          </TableCell>
                          <TableCell className={pos.swap >= 0 ? "text-green-600" : "text-red-600"}>
                            ${(pos.swap || 0).toFixed(2)}
                          </TableCell>
                          <TableCell className={pos.commission >= 0 ? "text-green-600" : "text-red-600"}>
                            ${(pos.commission || 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-xs">
                            {new Date(pos.openTime).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Operaciones</CardTitle>
              <CardDescription>
                Últimas operaciones cerradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {account.tradesHistory?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay historial de operaciones
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket</TableHead>
                      <TableHead>Símbolo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Volumen</TableHead>
                      <TableHead>Apertura</TableHead>
                      <TableHead>Cierre</TableHead>
                      <TableHead>P&L</TableHead>
                      <TableHead>Swap</TableHead>
                      <TableHead>Comisión</TableHead>
                      <TableHead>Neto</TableHead>
                      <TableHead>Fecha Cierre</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {account.tradesHistory?.slice(0, 20).map((trade: any) => {
                      const netProfit = trade.profit + (trade.swap || 0) + (trade.commission || 0);
                      return (
                        <TableRow key={trade.id}>
                          <TableCell className="font-mono text-xs">
                            {trade.ticket}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {trade.symbol}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={trade.type === "BUY" ? "default" : "secondary"}
                            >
                              {trade.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{trade.volume}</TableCell>
                          <TableCell>{trade.openPrice.toFixed(5)}</TableCell>
                          <TableCell>{trade.closePrice.toFixed(5)}</TableCell>
                          <TableCell
                            className={`font-semibold ${
                              trade.profit >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            ${trade.profit.toFixed(2)}
                          </TableCell>
                          <TableCell className={trade.swap >= 0 ? "text-green-600" : "text-red-600"}>
                            ${(trade.swap || 0).toFixed(2)}
                          </TableCell>
                          <TableCell className={trade.commission >= 0 ? "text-green-600" : "text-red-600"}>
                            ${(trade.commission || 0).toFixed(2)}
                          </TableCell>
                          <TableCell
                            className={`font-bold ${
                              netProfit >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            ${netProfit.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-xs">
                            {new Date(trade.closeTime).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de la Cuenta</CardTitle>
              <CardDescription>
                Información y configuración del EA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium mb-1">API Key</div>
                <div className="flex gap-2">
                  <code className="flex-1 text-xs bg-muted p-2 rounded">
                    {account.apiKey}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(account.apiKey, "API Key")}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-1">Última Sincronización</div>
                <p className="text-sm text-muted-foreground">
                  {account.lastSync
                    ? new Date(account.lastSync).toLocaleString()
                    : "Nunca"}
                </p>
              </div>

              <div>
                <div className="text-sm font-medium mb-1">Servidor</div>
                <p className="text-sm text-muted-foreground">
                  {latestSnapshot?.serverName || "N/A"}
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Badge variant={account.isActive ? "default" : "secondary"}>
                  {account.isActive ? "Activa" : "Inactiva"}
                </Badge>
                {account.isMaster && <Badge>Master</Badge>}
                {account.isSlave && <Badge variant="outline">Slave</Badge>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

