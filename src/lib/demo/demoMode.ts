import { ServiceActor, UserProfile } from "@/types";
import { demoUsers } from "./demoData";

const ROLE_KEY = "casebridge_demo_role";

export const isDemoMode = () => process.env.NODE_ENV === "development" && typeof window !== "undefined" && !!window.localStorage.getItem(ROLE_KEY);

export const getDemoRole = (): UserProfile["role"] | null => {
  if (process.env.NODE_ENV !== "development" || typeof window === "undefined") return null;
  const role = window.localStorage.getItem(ROLE_KEY);
  if (role === "caseworker" || role === "ssa" || role === "manager" || role === "admin") return role;
  return null;
};

export const getDemoUserProfile = (): UserProfile | null => {
  const role = getDemoRole();
  if (!role) return null;
  return demoUsers.find((user) => user.role === role && user.id.startsWith("demo_")) ?? null;
};

export const enterDemoMode = (role: UserProfile["role"]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ROLE_KEY, role);
  window.location.reload();
};

export const exitDemoMode = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ROLE_KEY);
  window.localStorage.removeItem("casebridge_demo_store_v1");
};

export const getDemoActor = (): ServiceActor | null => {
  const profile = getDemoUserProfile();
  if (!profile) return null;
  return {
    id: profile.id,
    organizationId: profile.organizationId,
    role: profile.role,
    siteIds: profile.siteIds,
  };
};
