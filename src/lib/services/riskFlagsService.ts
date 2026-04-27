import { RiskFlag, ServiceActor } from '@/types';
import { db } from '../firebase/client';
import { collection, doc, getDocs, orderBy, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { auditLogsService } from './auditLogsService';
import { clientsService } from './clientsService';
import { ensureOrgAccess, ensureSiteAccess, ServiceError } from './serviceHelpers';

const COLLECTION_NAME = 'riskFlags';

export const riskFlagsService = {
  async createRiskFlag(data: Omit<RiskFlag, 'id' | 'createdAt' | 'updatedAt'>, actor: ServiceActor): Promise<RiskFlag> {
    ensureOrgAccess(actor, data.organizationId);
    ensureSiteAccess(actor, data.siteId);

    const client = await clientsService.getClientById(data.clientId, actor);
    if (!client) throw new ServiceError('Client not found.');

    const ref = doc(collection(db, COLLECTION_NAME));
    const timestamp = new Date().toISOString();

    const flag: RiskFlag = {
      ...data,
      id: ref.id,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await setDoc(ref, flag);

    await auditLogsService.writeAuditLog({
      organizationId: flag.organizationId,
      siteId: flag.siteId,
      userId: actor.id,
      action: 'create_risk_flag',
      entityType: 'riskFlag',
      entityId: flag.id,
      metadata: { severity: flag.severity, category: flag.category },
    });

    return flag;
  },

  async getRiskFlagsForClient(clientId: string, actor: ServiceActor): Promise<RiskFlag[]> {
    const client = await clientsService.getClientById(clientId, actor);
    if (!client) return [];

    const snapshot = await getDocs(
      query(collection(db, COLLECTION_NAME), where('clientId', '==', clientId), orderBy('createdAt', 'desc'))
    );

    return snapshot.docs.map((record) => record.data() as RiskFlag);
  },

  async getActiveRiskFlags(actor: ServiceActor): Promise<RiskFlag[]> {
    if (!actor.siteIds.length) return [];

    const snapshot = await getDocs(
      query(
        collection(db, COLLECTION_NAME),
        where('organizationId', '==', actor.organizationId),
        where('siteId', 'in', actor.siteIds.slice(0, 10)),
        where('active', '==', true),
        orderBy('updatedAt', 'desc')
      )
    );

    return snapshot.docs.map((record) => record.data() as RiskFlag);
  },

  async reviewRiskFlag(riskFlagId: string, actor: ServiceActor): Promise<void> {
    await updateDoc(doc(db, COLLECTION_NAME, riskFlagId), {
      reviewedById: actor.id,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await auditLogsService.writeAuditLog({
      organizationId: actor.organizationId,
      userId: actor.id,
      action: 'review_risk_flag',
      entityType: 'riskFlag',
      entityId: riskFlagId,
    });
  },
};
