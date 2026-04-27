import { db } from '../firebase/client';
import { AuditLog, ServiceActor } from '@/types';
import { collection, doc, getDocs, limit, orderBy, query, setDoc, where } from 'firebase/firestore';
import { ensureOrgAccess } from './serviceHelpers';

const COLLECTION_NAME = 'auditLogs';

export interface AuditLogFilters {
  userId?: string;
  action?: string;
  entityType?: string;
  dateFrom?: string;
  dateTo?: string;
  limitCount?: number;
}

export const auditLogsService = {
  async writeAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'> & { timestamp?: string }): Promise<void> {
    const newLogRef = doc(collection(db, COLLECTION_NAME));
    const payload: AuditLog = {
      ...log,
      id: newLogRef.id,
      timestamp: log.timestamp ?? new Date().toISOString(),
    };

    await setDoc(newLogRef, payload);
  },

  async getAuditLogs(actor: ServiceActor, filters: AuditLogFilters = {}): Promise<AuditLog[]> {
    ensureOrgAccess(actor, actor.organizationId);

    const constraints = [
      where('organizationId', '==', actor.organizationId),
      orderBy('timestamp', 'desc'),
      limit(filters.limitCount ?? 100),
    ];

    if (filters.userId) constraints.unshift(where('userId', '==', filters.userId));
    if (filters.action) constraints.unshift(where('action', '==', filters.action));
    if (filters.entityType) constraints.unshift(where('entityType', '==', filters.entityType));
    if (filters.dateFrom) constraints.unshift(where('timestamp', '>=', filters.dateFrom));
    if (filters.dateTo) constraints.unshift(where('timestamp', '<=', filters.dateTo));

    const snapshot = await getDocs(query(collection(db, COLLECTION_NAME), ...constraints));
    return snapshot.docs.map((entry) => entry.data() as AuditLog);
  },
};
