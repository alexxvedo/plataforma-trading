import { FloatingDockComponent } from "@/components/floating-dock/floating-dock";


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 ">
      <FloatingDockComponent />
      {children}
    </div>
  );
}