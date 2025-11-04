"use client";

import { useState } from "react";
import Link from "next/link";
import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Settings,
  MoreHorizontal,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface EAListProps {
  accountId: string;
}

interface EAFormData {
  name: string;
  description: string;
  magicNumber: number;
  isActive: boolean;
  color: string;
}

const defaultColors = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#84cc16", // lime
  "#f97316", // orange
];

export function EAList({ accountId }: EAListProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingEA, setEditingEA] = useState<any>(null);
  const [deletingEA, setDeletingEA] = useState<any>(null);
  const [formData, setFormData] = useState<EAFormData>({
    name: "",
    description: "",
    magicNumber: 0,
    isActive: true,
    color: defaultColors[0],
  });

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Queries
  const easQuery = useQuery({
    ...trpc.expertAdvisor.getByAccount.queryOptions({ accountId }),
    refetchInterval: 10000, // Actualizar cada 10 segundos
  });

  // Mutations
  const createEA = useMutation({
    ...trpc.expertAdvisor.create.mutationOptions(),
    onSuccess: () => {
      toast.success("EA creado exitosamente");
      setIsCreateDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["expertAdvisor", "getByAccount"] });
    },
    onError: (error) => {
      toast.error(error.message || "Error al crear EA");
    },
  });

  const updateEA = useMutation({
    ...trpc.expertAdvisor.update.mutationOptions(),
    onSuccess: () => {
      toast.success("EA actualizado exitosamente");
      setIsEditDialogOpen(false);
      setEditingEA(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["expertAdvisor", "getByAccount"] });
    },
    onError: (error) => {
      toast.error(error.message || "Error al actualizar EA");
    },
  });

  const deleteEA = useMutation({
    ...trpc.expertAdvisor.delete.mutationOptions(),
    onSuccess: () => {
      toast.success("EA eliminado exitosamente");
      queryClient.invalidateQueries({ queryKey: ["expertAdvisor", "getByAccount"] });
    },
    onError: (error) => {
      toast.error(error.message || "Error al eliminar EA");
    },
  });

  const recalculateStats = useMutation({
    ...trpc.expertAdvisor.recalculateStatistics.mutationOptions(),
    onSuccess: () => {
      toast.success("Estadísticas recalculadas");
      queryClient.invalidateQueries({ queryKey: ["expertAdvisor", "getByAccount"] });
    },
    onError: (error) => {
      toast.error(error.message || "Error al recalcular estadísticas");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      magicNumber: 0,
      isActive: true,
      color: defaultColors[0],
    });
  };

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    if (formData.magicNumber <= 0) {
      toast.error("El magic number debe ser mayor a 0");
      return;
    }

    createEA.mutate({
      accountId,
      ...formData,
    });
  };

  const handleEdit = (ea: any) => {
    setEditingEA(ea);
    setFormData({
      name: ea.name,
      description: ea.description || "",
      magicNumber: ea.magicNumber,
      isActive: ea.isActive,
      color: ea.color,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!formData.name.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    if (formData.magicNumber <= 0) {
      toast.error("El magic number debe ser mayor a 0");
      return;
    }

    updateEA.mutate({
      id: editingEA.id,
      ...formData,
    });
  };

  const handleDelete = (ea: any) => {
    setDeletingEA(ea);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deletingEA) {
      deleteEA.mutate({ id: deletingEA.id });
      setIsDeleteDialogOpen(false);
      setDeletingEA(null);
    }
  };

  const handleRecalculateStats = (ea: any) => {
    recalculateStats.mutate({ id: ea.id });
  };

  if (easQuery.isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const eas = easQuery.data || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Expert Advisors</CardTitle>
            <CardDescription>
              Gestiona tus EAs y visualiza sus estadísticas
            </CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo EA
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Expert Advisor</DialogTitle>
                <DialogDescription>
                  Configura un nuevo EA para asociar operaciones automáticamente
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ej. ORO Scalper"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción opcional del EA"
                  />
                </div>
                <div>
                  <Label htmlFor="magicNumber">Magic Number</Label>
                  <Input
                    id="magicNumber"
                    type="number"
                    value={formData.magicNumber || ""}
                    onChange={(e) => setFormData({ ...formData, magicNumber: parseInt(e.target.value) || 0 })}
                    placeholder="ej. 1234"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive">Activo</Label>
                </div>
                <div>
                  <Label>Color</Label>
                  <div className="flex gap-2 mt-2">
                    {defaultColors.map((color) => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full border-2 ${
                          formData.color === color ? "border-gray-800" : "border-gray-300"
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData({ ...formData, color })}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate} disabled={createEA.isPending}>
                  {createEA.isPending ? "Creando..." : "Crear EA"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {eas.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No hay EAs configurados</p>
            <p className="text-sm mb-4">
              Crea tu primer Expert Advisor para comenzar a rastrear operaciones automáticamente
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear primer EA
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>EA</TableHead>
                <TableHead>Magic Number</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Beneficio</TableHead>
                <TableHead>Win Rate</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eas.map((ea: any) => {
                const winRate = ea.totalTrades > 0 ? (ea.winningTrades / ea.totalTrades) * 100 : 0;
                return (
                  <TableRow key={ea.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: ea.color }}
                        />
                        <div>
                          <Link 
                            href={`/dashboard/accounts/${accountId}/experts/${ea.id}`}
                            className="font-medium hover:text-primary hover:underline cursor-pointer"
                          >
                            {ea.name}
                          </Link>
                          {ea.description && (
                            <div className="text-xs text-muted-foreground">
                              {ea.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{ea.magicNumber}</TableCell>
                    <TableCell>
                      <Badge variant={ea.isActive ? "default" : "secondary"}>
                        {ea.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div
                        className={`font-semibold ${
                          ea.totalProfit >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        ${ea.totalProfit.toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {winRate >= 50 ? (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-600" />
                        )}
                        <span className="text-sm">{winRate.toFixed(1)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(ea)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRecalculateStats(ea)}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Recalcular Stats
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(ea)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Expert Advisor</DialogTitle>
            <DialogDescription>
              Modifica la configuración del EA
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nombre</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ej. ORO Scalper"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Descripción</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción opcional del EA"
              />
            </div>
            <div>
              <Label htmlFor="edit-magicNumber">Magic Number</Label>
              <Input
                id="edit-magicNumber"
                type="number"
                value={formData.magicNumber || ""}
                onChange={(e) => setFormData({ ...formData, magicNumber: parseInt(e.target.value) || 0 })}
                placeholder="ej. 1234"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="edit-isActive">Activo</Label>
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex gap-2 mt-2">
                {defaultColors.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.color === color ? "border-gray-800" : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={updateEA.isPending}>
              {updateEA.isPending ? "Actualizando..." : "Actualizar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación de eliminación */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el Expert Advisor "{deletingEA?.name}"?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setDeletingEA(null);
              }}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteEA.isPending}
            >
              {deleteEA.isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}