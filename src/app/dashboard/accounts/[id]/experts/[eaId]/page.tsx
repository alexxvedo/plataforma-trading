"use client";

import { useParams } from "next/navigation";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, TrendingUp, TrendingDown, BarChart3, DollarSign, Target, Clock } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function EADetailPage() {
  const params = useParams();
  const accountId = params.id as string;
  const eaId = params.eaId as string;
  
  const trpc = useTRPC();

  // Obtener datos del EA
  const { data: ea, isLoading: eaLoading, error: eaError } = useQuery({
    ...trpc.expertAdvisor.getById.queryOptions({ id: eaId }),
    refetchInterval: 1000,
  });

  // Obtener estadísticas del EA
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    ...trpc.expertAdvisor.getStatistics.queryOptions({ id: eaId }),
    refetchInterval: 1000,
  });

  

  if (eaLoading || statsLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={_}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!ea) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-muted-foreground">EA no encontrado</h1>
          <p className="text-muted-foreground mt-2">El Expert Advisor que buscas no existe.</p>
          <Link href={`/dashboard/accounts/${accountId}`}>
            <Button className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a la cuenta
            </Button>
          </Link>
        </div>
      </div>
    );
  }

 
  if(stats?.statistics) {
    console.log(ea)

    const winRate = stats?.statistics?.totalTrades > 0 ? (stats.statistics.winningTrades / stats.statistics.totalTrades) * 100 : 0;

    const bestTrade = stats?.recentTrades?.reduce((best, trade) => {
      return trade.profit > (best?.profit || 0) ? trade : best;
    }, stats?.recentTrades?.[0]) || {};

    const worstTrade = stats?.recentTrades?.reduce((worst, trade) => {
      return trade.profit < (worst?.profit || 0) ? trade : worst;
    }, stats?.recentTrades?.[0]) || {};

    const averageProfit = stats?.statistics?.totalTrades > 0 ? ((stats.statistics.averageWin - stats.statistics.averageLoss) / 2) : 0;
    return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/accounts/${accountId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div
              className={`w-4 h-4 rounded-full`}
              style={{ backgroundColor: ea.color ?? undefined }}
            />
            <div>
              <h1 className="text-3xl font-bold">{ea.name}</h1>
              <p className="text-muted-foreground">Magic Number: {ea.magicNumber}</p>
            </div>
          </div>
        </div>
        <Badge variant={ea.isActive ? "default" : "secondary"} className="text-sm px-3 py-1">
          {ea.isActive ? "Activo" : "Inactivo"}
        </Badge>
      </div>

      {/* Descripción */}
      {ea.description && (
        <Card>
          <CardHeader>
            <CardTitle>Descripción</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{ea.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Beneficio Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              (stats?.statistics?.totalProfit || 0) >= 0 ? "text-green-600" : "text-red-600"
            }`}>
              ${((stats?.statistics?.totalProfit || 0) - (stats?.statistics?.totalLoss || 0)).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {winRate >= 50 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <div className="text-2xl font-bold">{winRate.toFixed(1)}%</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Operaciones</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.statistics?.totalTrades || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.statistics?.winningTrades || 0}W / {stats?.statistics?.losingTrades || 0}L
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posiciones Abiertas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.statistics?.currentPositions || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Estadísticas detalladas */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="positions">Posiciones Abiertas</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas de Trading</CardTitle>
                <CardDescription>Métricas detalladas de rendimiento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mejor operación:</span>
                  <span className="font-medium text-green-600">
                    ${(bestTrade?.profit || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Peor operación:</span>
                  <span className="font-medium text-red-600">
                    ${(worstTrade.profit || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Beneficio promedio:</span>
                  <span className={averageProfit >= 0 ? "font-medium text-green-600" : "font-medium text-red-600"}>
                    ${(averageProfit || 0).toFixed(2)}
                  </span>
                </div>
                
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Información del EA</CardTitle>
                <CardDescription>Detalles de configuración</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Magic Number:</span>
                  <span className=" font-medium">{ea.magicNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estado:</span>
                  <Badge variant={ea.isActive ? "default" : "secondary"}>
                    {ea.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Creado:</span>
                  <span className="font-medium">
                    {new Date(ea.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Última actualización:</span>
                  <span className="font-medium">
                    {new Date(ea.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="positions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Posiciones Abiertas</CardTitle>
              <CardDescription>
                Posiciones actualmente abiertas por este EA
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.statistics?.currentPositions > 0 ? (
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
                    {/* Aquí se mostrarían las posiciones abiertas */}
                    
                      
                    {ea.positions.map((position: any, index: number) => {
                      const netProfit = position.profit + (position.swap || 0) + (position.commission || 0);
                      return (
                        <TableRow key={position.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-mono text-xs">
                            {position.ticket}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {position.symbol}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={position.type === "BUY" ? "default" : "secondary"}
                            >
                              {position.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{position.volume}</TableCell>
                          <TableCell>{position.openPrice?.toFixed(5)}</TableCell>
                          <TableCell>{position.currentPrice?.toFixed(5) || "N/A"}</TableCell>
                          <TableCell className="text-xs">
                            {position.stopLoss > 0 && <div>SL: {position.stopLoss?.toFixed(5)}</div>}
                            {position.takeProfit > 0 && <div>TP: {position.takeProfit?.toFixed(5)}</div>}
                          </TableCell>
                          <TableCell
                            className={`font-semibold ${
                              netProfit >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            <div>${position.profit?.toFixed(2)}</div>
                            <div className="text-xs font-normal text-muted-foreground">
                              Neto: ${netProfit.toFixed(2)}
                            </div>
                          </TableCell>
                          <TableCell className={position.swap >= 0 ? "text-green-600" : "text-red-600"}>
                            ${(position.swap || 0).toFixed(2)}
                          </TableCell>
                          <TableCell className={position.commission >= 0 ? "text-green-600" : "text-red-600"}>
                            ${(position.commission || 0).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-xs">
                            {new Date(position.openTime).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No hay posiciones abiertas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Operaciones</CardTitle>
              <CardDescription>
                Últimas {stats?.recentTrades?.length || 0} operaciones cerradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.recentTrades && stats.recentTrades.length > 0 ? (
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
                    {ea.tradesHistory.map((trade: any, index: number) => {
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
                          <TableCell>{trade.openPrice?.toFixed(5)}</TableCell>
                          <TableCell>{trade.closePrice?.toFixed(5)}</TableCell>
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
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No hay historial de operaciones</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
  }
  
}