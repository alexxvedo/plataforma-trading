"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Spotlight } from "@/components/ui/spotlight";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Globe,
  TrendingUp,
  Zap,
} from "lucide-react";

export function Hero() {
  return (
    <div className="relative flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-black/[0.96] antialiased bg-grid-white/[0.02] md:items-center md:justify-center">
      <Spotlight
        className="-top-40 left-0 md:-top-20 md:left-60"
        fill="white"
      />
      <div className="relative z-10 mx-auto w-full max-w-7xl p-4 pt-20 md:pt-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8 inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-sm text-zinc-300"
          >
            <Zap className="mr-2 h-4 w-4 text-blue-500" />
            Plataforma de Trading en Tiempo Real
          </motion.div>

          <h1 className="bg-gradient-to-b from-zinc-50 to-zinc-400 bg-clip-text text-4xl font-bold text-transparent md:text-7xl">
            Control Total de tus
            <br />
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              Cuentas MT4/MT5
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-zinc-400 md:text-xl">
            Monitorea, analiza y replica operaciones entre múltiples cuentas de
            trading con latencia ultra-baja. CopyTrading profesional con
            configuración avanzada en tiempo real.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              asChild
              className="group bg-gradient-to-r from-blue-600 to-purple-600 text-lg hover:from-blue-700 hover:to-purple-700"
            >
              <Link href="/signup">
                Comenzar Ahora
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-zinc-700 bg-transparent text-lg text-zinc-300 hover:bg-zinc-900"
            >
              <Link href="#features">Ver Características</Link>
            </Button>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16 grid grid-cols-2 gap-6 md:grid-cols-4"
          >
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 backdrop-blur-sm">
              <Activity className="mx-auto mb-2 h-6 w-6 text-blue-500" />
              <div className="text-2xl font-bold text-white">&lt; 50ms</div>
              <div className="text-sm text-zinc-400">Latencia</div>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 backdrop-blur-sm">
              <TrendingUp className="mx-auto mb-2 h-6 w-6 text-green-500" />
              <div className="text-2xl font-bold text-white">99.9%</div>
              <div className="text-sm text-zinc-400">Uptime</div>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 backdrop-blur-sm">
              <BarChart3 className="mx-auto mb-2 h-6 w-6 text-purple-500" />
              <div className="text-2xl font-bold text-white">Tiempo Real</div>
              <div className="text-sm text-zinc-400">Sincronización</div>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 backdrop-blur-sm">
              <Globe className="mx-auto mb-2 h-6 w-6 text-orange-500" />
              <div className="text-2xl font-bold text-white">Multi-Broker</div>
              <div className="text-sm text-zinc-400">Compatible</div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Grid background */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
    </div>
  );
}

