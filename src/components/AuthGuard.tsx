"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Role } from "@/types";

export default function AuthGuard({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: Role[];
}) {
  const { user, firebaseUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!firebaseUser) {
        router.push("/login");
      } else if (user && allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect unauthorized users to their correct dashboard based on role
        if (user.role === "caseworker") router.push("/dashboard");
        else if (user.role === "ssa") router.push("/team");
        else if (user.role === "manager") router.push("/management");
        else if (user.role === "admin") router.push("/admin/users");
      }
    }
  }, [user, firebaseUser, loading, router, allowedRoles]);

  if (loading || !firebaseUser || (allowedRoles && user && !allowedRoles.includes(user.role))) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"></div>
      </div>
    );
  }

  return <>{children}</>;
}
