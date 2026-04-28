"use client";

import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/contexts/AuthContext";

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={["ssa", "manager", "admin"]}>
      <div className="container mx-auto py-6">
        {children}
      </div>
    </AuthGuard>
  );
}
