"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  AlertTriangle, 
  BarChart3, 
  Settings, 
  LogOut,
  FileText,
  Building
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
    { name: "Audit Logs", href: "/admin/audit-logs", icon: FileText },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  let navigation = caseworkerNav;
  if (user.role === "ssa") navigation = ssaNav;
  if (user.role === "manager") navigation = managerNav;
  if (user.role === "admin") navigation = adminNav;

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-slate-200">
      <div className="flex h-16 items-center px-6 border-b border-slate-200">
        <h1 className="text-xl font-bold text-indigo-900 tracking-tight">CaseBridge</h1>
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
                  isActive
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900",
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors"
                )}
              >
                <item.icon
                  className={cn(
                    isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-500",
                    "mr-3 h-5 w-5 flex-shrink-0"
                  )}
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
          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
            {user.firstName[0]}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-900">{user.firstName} {user.lastName}</span>
            <span className="text-xs text-slate-500">{user.role}</span>
          </div>
        </div>
        <Button variant="ghost" className="w-full justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-50" onClick={signOut}>
          <LogOut className="mr-3 h-5 w-5" />
          Log out
        </Button>
      </div>
    </div>
  );
}
