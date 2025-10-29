"use client";

import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import {
  Activity,
  BarChart3,
  Copy,
  Database,
  GitBranch,
  LineChart,
  Network,
  Settings,
  Zap,
} from "lucide-react";

export function Features() {
  return (
    <section id="features" className="w-full bg-white py-20 dark:bg-zinc-950">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-3xl font-bold text-transparent md:text-5xl">
            Características Principales
          </h2>
          <p className="mx-auto max-w-2xl text-zinc-600 dark:text-zinc-400">
            Todo lo que necesitas para gestionar tus cuentas de trading de
            forma profesional
          </p>
        </div>

        <BentoGrid className="mx-auto max-w-6xl">
          {items.map((item) => (
            <BentoGridItem
              key={item.title}
              title={item.title}
              description={item.description}
              header={item.header}
              icon={item.icon}
              className={
                item.title === "Latencia Ultra-Baja" ||
                item.title === "Historial y Estadísticas Completas"
                  ? "md:col-span-2"
                  : ""
              }
            />
          ))}
        </BentoGrid>
      </div>
    </section>
  );
}

const Skeleton = () => (
  <div className="flex h-full min-h-[6rem] w-full flex-1 rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-900 dark:to-zinc-800" />
);

const items = [
  {
    title: "Monitoreo en Tiempo Real",
    description:
      "Visualiza todas tus cuentas MT4/MT5 en un solo dashboard con actualizaciones instantáneas de posiciones, balance y equity.",
    header: <Skeleton />,
    icon: <Activity className="h-4 w-4 text-blue-500" />,
  },
  {
    title: "Análisis por EA",
    description:
      "Segmenta tus operaciones por Magic Number para analizar el rendimiento individual de cada Expert Advisor.",
    header: <Skeleton />,
    icon: <BarChart3 className="h-4 w-4 text-purple-500" />,
  },
  {
    title: "CopyTrading Profesional",
    description:
      "Replica operaciones entre cuentas con configuración avanzada de símbolos, lotes y filtros personalizados.",
    header: <Skeleton />,
    icon: <Copy className="h-4 w-4 text-green-500" />,
  },
  {
    title: "Latencia Ultra-Baja",
    description:
      "Arquitectura optimizada para garantizar la menor latencia posible en la replicación de operaciones. Infraestructura diseñada para trading de alta frecuencia con tiempos de respuesta < 50ms.",
    header: <Skeleton />,
    icon: <Zap className="h-4 w-4 text-yellow-500" />,
  },
  {
    title: "Configuración Flexible",
    description:
      "Define reglas específicas por símbolo: multiplica lotes, establece límites, filtra por horarios o condiciones de mercado.",
    header: <Skeleton />,
    icon: <Settings className="h-4 w-4 text-orange-500" />,
  },
  {
    title: "Multi-Broker",
    description:
      "Compatible con cualquier broker que soporte MT4/MT5. Conecta cuentas de diferentes brokers sin restricciones.",
    header: <Skeleton />,
    icon: <Network className="h-4 w-4 text-cyan-500" />,
  },
  {
    title: "Historial y Estadísticas Completas",
    description:
      "Accede al historial detallado de todas las operaciones con métricas avanzadas: drawdown, win rate, profit factor, sharpe ratio y más. Exporta datos para análisis externos.",
    header: <Skeleton />,
    icon: <LineChart className="h-4 w-4 text-pink-500" />,
  },
  {
    title: "WebSocket Real-Time",
    description:
      "Conexión bidireccional con las EAs para actualizaciones instantáneas sin polling.",
    header: <Skeleton />,
    icon: <GitBranch className="h-4 w-4 text-indigo-500" />,
  },
  {
    title: "Base de Datos Robusta",
    description:
      "Almacenamiento eficiente de millones de operaciones con consultas optimizadas para análisis rápidos.",
    header: <Skeleton />,
    icon: <Database className="h-4 w-4 text-red-500" />,
  },  
];

