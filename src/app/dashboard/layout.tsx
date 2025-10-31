"use client";

import { FloatingDockComponent } from "@/components/floating-dock/floating-dock";
import { useAllAccountsHeartbeat } from "@/hooks/use-account-heartbeat";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Send heartbeat to all user's EAs while in dashboard
  // This keeps all EAs in real-time mode (high frequency updates)
  useAllAccountsHeartbeat();

  return (
    <div className="flex-1 ">
      <FloatingDockComponent />
      {children}
    </div>
  );
}