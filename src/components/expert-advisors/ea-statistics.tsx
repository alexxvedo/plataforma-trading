"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  BarChart3,
  DollarSign,
  Percent,
  Activity,
  Trash2,
} from "lucide-react";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogFooter } from "../ui/dialog";

interface EAStatisticsProps {
  accountId: string;
}

export function EAStatistics({ accountId }: EAStatisticsProps) {
  const trpc = useTRPC();
  const [isCreateEADialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Estados para el formulario de crear EA
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    symbol: "",
    magicNumber: "",
    version: ""
  });

  const easQuery = useQuery({
    ...trpc.expertAdvisor.getByAccount.queryOptions({ accountId }),
    refetchInterval: 10000,
  });

  const createEAMutation = useMutation({
    ...trpc.expertAdvisor.create.mutationOptions(),
    onSuccess: () => {
      // Refrescar la lista de EAs después de crear
      easQuery.refetch();
      // Cerrar el diálogo y limpiar el formulario
      setIsCreateDialogOpen(false);
      setFormData({
        name: "",
        description: "",
        symbol: "",
        magicNumber: "",
        version: ""
      });
    },
    onError: (error) => {
      console.error('Error al crear EA:', error);
      // Aquí podrías mostrar un toast o notificación de error
    }
  })

  const deleteEAMutation = useMutation({
    ...trpc.expertAdvisor.delete.mutationOptions(),
    onSuccess: () => {
      // Refrescar la lista de EAs después de eliminar
      easQuery.refetch();
    },
    onError: (error) => {
      console.error('Error al eliminar EA:', error);
      // Aquí podrías mostrar un toast o notificación de error
    }
  });

  const createEA = () => {
    if (!formData.name || !formData.symbol) {
      console.error('Nombre y símbolo son requeridos');
      return;
    }

    createEAMutation.mutate({
      accountId,
      name: formData.name,
      description: formData.description,
      symbol: formData.symbol,
      magicNumber: formData.magicNumber ? parseInt(formData.magicNumber) : undefined,
      version: formData.version
    });
  };

  function deleteEA(eaId: string) {
    console.log("EA ID: ", eaId)
    if (confirm('¿Estás seguro de que quieres eliminar este EA?')) {
      deleteEAMutation.mutate({ id: eaId });
    }
  };



  if (easQuery.isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    );
  }

  const eas = easQuery.data || [];

  if (eas.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <BarChart3 className="h-12 w-12 mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">
            No hay EAs configurados para mostrar estadísticas
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>Añadir EA</Button>
          <Dialog open={isCreateEADialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogTitle>Añadir Nuevo EA</DialogTitle>
              <DialogDescription>
                Introduce los detalles del Expert Advisor que deseas añadir a tu cuenta.
              </DialogDescription>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nombre
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="col-span-3"
                    placeholder="Ej: Scalping Pro"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="symbol" className="text-right">
                    Símbolo
                  </Label>
                  <Input
                    id="symbol"
                    value={formData.symbol}
                    onChange={(e) => setFormData({...formData, symbol: e.target.value})}
                    className="col-span-3"
                    placeholder="Ej: EURUSD"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="magicNumber" className="text-right">
                    Magic Number
                  </Label>
                  <Input
                    id="magicNumber"
                    type="number"
                    value={formData.magicNumber}
                    onChange={(e) => setFormData({...formData, magicNumber: e.target.value})}
                    className="col-span-3"
                    placeholder="Ej: 12345"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="version" className="text-right">
                    Versión
                  </Label>
                  <Input
                    id="version"
                    value={formData.version}
                    onChange={(e) => setFormData({...formData, version: e.target.value})}
                    className="col-span-3"
                    placeholder="Ej: 1.0.0"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="description" className="text-right pt-2">
                    Descripción
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="col-span-3"
                    placeholder="Describe la estrategia del EA..."
                    rows={3}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  onClick={createEA}
                  disabled={createEAMutation.isPending || !formData.name || !formData.symbol}
                >
                  {createEAMutation.isPending ? "Creando..." : "Crear EA"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen general */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">EAs Activos</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {eas.filter((ea: any) => ea.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              de {eas.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operaciones Totales</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {eas.reduce((sum: number, ea: any) => sum + ea.totalTrades, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Todas las EAs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Beneficio Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {(() => {
              const totalProfit = eas.reduce((sum: number, ea: any) => sum + ea.totalProfit - ea.totalLoss, 0);
              return (
                <>
                  <div
                    className={`text-2xl font-bold ${
                      totalProfit >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    ${totalProfit.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Todas las EAs
                  </p>
                </>
              );
            })()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate Promedio</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {(() => {
              const totalTrades = eas.reduce((sum: number, ea: any) => sum + ea.totalTrades, 0);
              const totalWins = eas.reduce((sum: number, ea: any) => sum + ea.winningTrades, 0);
              const avgWinRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;
              return (
                <>
                  <div className="text-2xl font-bold">
                    {avgWinRate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {totalWins}W / {totalTrades - totalWins}L
                  </p>
                </>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Estadísticas por EA */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {eas.map((ea: any) => {
          const winRate = ea.totalTrades > 0 ? (ea.winningTrades / ea.totalTrades) * 100 : 0;
          const avgProfit = ea.totalTrades > 0 ? ea.totalProfit / ea.totalTrades : 0;
          const profitFactor = ea.totalLoss > 0 ? Math.abs(ea.totalGain / ea.totalLoss) : 0;

          console.log(ea)
          return (
            <Card key={ea.id} className="relative">
              <div
                className="absolute top-0 left-0 w-1 h-full rounded-l-lg"
                style={{ backgroundColor: ea.color }}
              />
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    <Link href={`/dashboard/accounts/${accountId}/experts/${ea.id}`}>
                      <span className="hover:underline">{ea.name}</span>
                    </Link>
                  </CardTitle>
                  <div className="flex items-center space-x-2">

                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteEA(ea.id)}>
                    <Trash2 className="h-6 w-6 text-red-500 cursor-pointer" />
                  </Button>
                  <Badge variant={ea.isActive ? "default" : "secondary"}>
                    {ea.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                  </div>
                </div>
                <CardDescription>
                  Magic Number: {ea.magicNumber}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Métricas principales */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Operaciones</div>
                    <div className="text-xl font-bold">{ea.totalTrades}</div>
                    <div className="text-xs text-muted-foreground">
                      {ea.winningTrades}W / {ea.losingTrades}L
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Beneficio</div>
                    <div
                      className={`text-xl font-bold ${
                        ea.totalProfit >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      ${(ea.totalProfit - ea.totalLoss).toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Promedio: ${avgProfit.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Win Rate */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Win Rate</span>
                    <span className="font-medium">{winRate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        winRate >= 50 ? "bg-green-600" : "bg-red-600"
                      }`}
                      style={{ width: `${Math.min(winRate, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Métricas adicionales */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Drawdown</div>
                    <div className="font-medium text-red-600">
                      ${Math.abs(ea.maxDrawdown).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Profit Factor</div>
                    <div className="font-medium">
                      {profitFactor > 0 ? profitFactor.toFixed(2) : "N/A"}
                    </div>
                  </div>
                </div>

                {/* Posiciones actuales */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Posiciones Abiertas</span>
                  <Badge variant="outline">
                    {ea._count?.positions || 0}
                  </Badge>
                </div>

                

                {/* Indicadores visuales */}
                <div className="flex items-center gap-2 pt-2">
                  {winRate >= 60 && (
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <TrendingUp className="h-3 w-3" />
                      Alto Win Rate
                    </div>
                  )}
                  {ea.totalProfit > 0 && (
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <Target className="h-3 w-3" />
                      Rentable
                    </div>
                  )}
                  {ea.totalTrades > 50 && (
                    <div className="flex items-center gap-1 text-xs text-blue-600">
                      <Clock className="h-3 w-3" />
                      Experimentado
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}