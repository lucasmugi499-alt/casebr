import { Referral, ServiceActor } from '@/types';
import { db } from '../firebase/client';
import { collection, doc, getDocs, orderBy, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { auditLogsService } from './auditLogsService';
import { clientsService } from './clientsService';
import { ensureOrgAccess, ensureSiteAccess, ServiceError } from './serviceHelpers';

const COLLECTION_NAME = 'referrals';

export const referralsService = {
  async createReferral(data: Omit<Referral, 'id' | 'createdAt' | 'updatedAt'>, actor: ServiceActor): Promise<Referral> {
    ensureOrgAccess(actor, data.organizationId);
    ensureSiteAccess(actor, data.siteId);

    const client = await clientsService.getClientById(data.clientId, actor);
    if (!client) throw new ServiceError('Client not found.');

    const ref = doc(collection(db, COLLECTION_NAME));
    const timestamp = new Date().toISOString();

    const referral: Referral = {
      ...data,
      id: ref.id,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await setDoc(ref, referral);

    await auditLogsService.writeAuditLog({
      organizationId: referral.organizationId,
      siteId: referral.siteId,
      userId: actor.id,
      action: 'create_referral',
      entityType: 'referral',
      entityId: referral.id,
    });

    return referral;
  },

  async updateReferral(referralId: string, data: Partial<Referral>, actor: ServiceActor): Promise<void> {
    await updateDoc(doc(db, COLLECTION_NAME, referralId), { ...data, updatedAt: new Date().toISOString() });
    await auditLogsService.writeAuditLog({
      organizationId: actor.organizationId,
      userId: actor.id,
      action: 'update_referral',
      entityType: 'referral',
      entityId: referralId,
      metadata: { updatedFields: Object.keys(data) },
    });
  },

  async getReferralsForClient(clientId: string, actor: ServiceActor): Promise<Referral[]> {
    const client = await clientsService.getClientById(clientId, actor);
    if (!client) return [];

    const snapshot = await getDocs(
      query(collection(db, COLLECTION_NAME), where('clientId', '==', clientId), orderBy('referralDate', 'desc'))
    );
    return snapshot.docs.map((record) => record.data() as Referral);
  },
};
