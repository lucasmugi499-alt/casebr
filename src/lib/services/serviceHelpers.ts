import { ServiceActor } from '@/types';

export class ServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServiceError';
  }
}

export function canAccessSite(actor: ServiceActor, siteId: string) {
  if (actor.role === 'admin' || actor.role === 'manager') return true;
  return actor.siteIds.includes(siteId);
}

export function ensureSiteAccess(actor: ServiceActor, siteId: string) {
  if (!canAccessSite(actor, siteId)) {
    throw new ServiceError('You do not have access to this site.');
  }
}

export function ensureOrgAccess(actor: ServiceActor, organizationId: string) {
  if (actor.organizationId !== organizationId) {
    throw new ServiceError('You do not have access to this organization.');
  }
}

export function isSupervisorRole(role: ServiceActor['role']) {
  return role === 'ssa' || role === 'manager' || role === 'admin';
}
