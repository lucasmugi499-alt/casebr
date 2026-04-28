"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, CheckSquare, AlertTriangle, BarChart3, Settings, LogOut, FileText, Building, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isDemoMode } from "@/lib/demo/demoMode";
import { resetDemoStore } from "@/lib/demo/demoStore";
import { toast } from "sonner";

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  if (!user) return null;

  const caseworkerNav = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "My Clients", href: "/clients", icon: Users },
    { name: "Tasks", href: "/tasks", icon: CheckSquare },
  ];

  const ssaNav = [
    { name: "Team Overview", href: "/team", icon: LayoutDashboard },
    { name: "All Clients", href: "/clients", icon: Users },
    { name: "Overdue Tasks", href: "/tasks", icon: CheckSquare },
    { name: "Risk Flags", href: "/risk", icon: AlertTriangle },
  ];

  const managerNav = [
    { name: "Management", href: "/management", icon: BarChart3 },
    { name: "Reports", href: "/reports", icon: FileText },
  ];

  const adminNav = [
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Sites", href: "/admin/sites", icon: Building },
    { name: "Templates", href: "/admin/templates", icon: LayoutDashboard },
    { name: "Settings", href: "/admin/settings", icon: Settings },
    { name: "Audit Trail", href: "/admin/audit-logs", icon: FileText },
    { name: "Management", href: "/management", icon: BarChart3 },
    { name: "Reports", href: "/reports", icon: FileText },
    { name: "Demo Tools", href: "/admin/demo-tools", icon: RotateCcw },
  ];

  let navigation = caseworkerNav;
  if (user.role === "ssa") navigation = ssaNav;
  if (user.role === "manager") navigation = managerNav;
  if (user.role === "admin") navigation = adminNav;

  const demoActive = isDemoMode() && user.id.startsWith("demo_");
  const roleLabel = user.role === "ssa" ? "SSA / Supervisor" : `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)}`;

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-slate-200">
      <div className="flex h-16 items-center px-6 border-b border-slate-200 justify-between">
        <h1 className="text-xl font-bold text-indigo-900 tracking-tight">CaseBridge</h1>
        {demoActive && (
          <div className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Demo</div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  isActive ? "bg-indigo-50 text-indigo-600" : "text-slate-700 hover:bg-slate-50 hover:text-slate-900",
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors"
                )}
              >
                <item.icon
                  className={cn(isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-500", "mr-3 h-5 w-5 flex-shrink-0")}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="border-t border-slate-200 p-4">
        <div className="flex items-center space-x-3 pb-4 px-2">
          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">{user.firstName[0]}</div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-900">{user.firstName} {user.lastName}</span>
            <span className="text-xs text-slate-500">{roleLabel}</span>
          </div>
        </div>
        {demoActive && (
          <>
            <p className="mb-2 text-[11px] text-amber-700 font-medium text-center">Demo Mode: {roleLabel}</p>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start mb-2 border-amber-300 text-amber-800"
              onClick={() => {
                resetDemoStore();
                toast.success("Demo dataset reset for this browser session.");
                window.location.reload();
              }}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset Demo Data
            </Button>
          </>
        )}
        <Button
          variant="ghost"
          className={cn("w-full justify-start hover:bg-slate-50", demoActive ? "text-amber-700 hover:text-amber-800" : "text-slate-600 hover:text-slate-900")}
          onClick={signOut}
        >
          <LogOut className="mr-3 h-5 w-5" />
          {demoActive ? "Exit Demo Mode" : "Log out"}
        </Button>
        {demoActive && <p className="mt-2 text-[10px] text-center text-amber-600 font-medium">Development-only demo access.</p>}
      </div>
    </div>
  );
}
