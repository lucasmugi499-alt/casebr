"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Role } from "@/types";
import { getHomeRouteForRole } from "@/lib/auth/roleRouting";

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
    if (loading) {
      return;
    }

    if (!user && !firebaseUser) {
      router.push("/login");
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.push(getHomeRouteForRole(user.role));
    }
  }, [user, firebaseUser, loading, router, allowedRoles]);

  if (loading || (!firebaseUser && !user) || !user || (allowedRoles && !allowedRoles.includes(user.role))) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"></div>
      </div>
    );
  }

  return <>{children}</>;
}
