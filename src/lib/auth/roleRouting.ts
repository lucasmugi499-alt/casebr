import { Role } from "@/types";

const ROLE_HOME_ROUTES: Record<Role, string> = {
  caseworker: "/dashboard",
  ssa: "/team",
  manager: "/management",
  admin: "/admin/users",
};

export function getHomeRouteForRole(role: Role): string {
  return ROLE_HOME_ROUTES[role] ?? "/dashboard";
}
