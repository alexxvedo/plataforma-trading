"use client";

import { motion } from "motion/react";
import {
  ArrowRight,
  Download,
  LineChart,
  Settings2,
  Workflow,
} from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      icon: Download,
      title: "1. Instala las EAs",
      description:
        "Descarga e instala nuestros Expert Advisors en tus terminales MT4/MT5. Un EA para cuentas origen (sender) y otro para destino (receiver).",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Settings2,
      title: "2. Configura tus Cuentas",
      description:
        "Conecta tus cuentas a la plataforma. Define qué cuentas serán origen y cuáles destino. Configura API keys y permisos.",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Workflow,
      title: "3. Define Reglas de Copy",
      description:
        "Establece reglas personalizadas: multiplicadores de lote, símbolos permitidos, horarios de copia, filtros de EA por Magic Number.",
      color: "from-orange-500 to-red-500",
    },
    {
      icon: LineChart,
      title: "4. Monitorea en Tiempo Real",
      description:
        "Observa todas las operaciones en el dashboard. Analiza performance, modifica configuraciones y recibe alertas instantáneas.",
      color: "from-green-500 to-emerald-500",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="w-full bg-zinc-50 py-20 dark:bg-zinc-900"
    >
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-zinc-900 dark:text-zinc-100 md:text-5xl">
            ¿Cómo Funciona?
          </h2>
          <p className="mx-auto max-w-2xl text-zinc-600 dark:text-zinc-400">
            Configura tu sistema de copytrading en minutos
          </p>
        </div>

        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 md:grid-cols-2">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg transition-all hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div
                  className={`mb-6 inline-flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br ${step.color}`}
                >
                  <step.icon className="h-8 w-8 text-white" />
                </div>

                <h3 className="mb-3 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {step.title}
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400">
                  {step.description}
                </p>

                {index < steps.length - 1 && (
                  <div className="absolute -right-4 top-1/2 hidden -translate-y-1/2 md:block">
                    <ArrowRight className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
                  </div>
                )}

                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-zinc-100 to-zinc-200 opacity-20 blur-3xl dark:from-zinc-800 dark:to-zinc-900" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Architecture Diagram */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mx-auto mt-20 max-w-4xl"
        >
          <h3 className="mb-8 text-center text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Arquitectura del Sistema
          </h3>
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                  <Download className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="mb-2 font-bold text-zinc-900 dark:text-zinc-100">
                  Expert Advisors
                </h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  MT4/MT5 EAs que se conectan al servidor vía WebSocket
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20">
                  <Workflow className="h-10 w-10 text-purple-600 dark:text-purple-400" />
                </div>
                <h4 className="mb-2 font-bold text-zinc-900 dark:text-zinc-100">
                  Backend Real-Time
                </h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Servidor con WebSockets para procesamiento instantáneo
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                  <LineChart className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="mb-2 font-bold text-zinc-900 dark:text-zinc-100">
                  Dashboard Next.js
                </h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Frontend moderno con actualizaciones en tiempo real
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

