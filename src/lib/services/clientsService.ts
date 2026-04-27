import { Client, ServiceActor, UserProfile } from '@/types';
import { db } from '../firebase/client';
import { collection, doc, getDoc, getDocs, orderBy, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { auditLogsService } from './auditLogsService';
import { ensureOrgAccess, ensureSiteAccess, ServiceError } from './serviceHelpers';

const COLLECTION_NAME = 'clients';

export const clientsService = {
  async getClient(clientId: string): Promise<Client | null> {
    const snapshot = await getDoc(doc(db, COLLECTION_NAME, clientId));
    return snapshot.exists() ? (snapshot.data() as Client) : null;
  },

  async getClientsForUser(userProfile: UserProfile): Promise<Client[]> {
    if (userProfile.role === 'caseworker') {
      return this.getAssignedClients(userProfile.id, userProfile.organizationId);
    }

    return this.getClientsBySite(userProfile.organizationId, userProfile.siteIds);
  },

  async getAssignedClients(userId: string, organizationId: string): Promise<Client[]> {
    const snapshot = await getDocs(
      query(
        collection(db, COLLECTION_NAME),
        where('organizationId', '==', organizationId),
        where('assignedWorkerIds', 'array-contains', userId),
        orderBy('updatedAt', 'desc')
      )
    );

    return snapshot.docs.map((record) => record.data() as Client);
  },

  async getClientsBySite(organizationId: string, siteIds: string[]): Promise<Client[]> {
    if (!siteIds.length) return [];

    const snapshot = await getDocs(
      query(
        collection(db, COLLECTION_NAME),
        where('organizationId', '==', organizationId),
        where('siteId', 'in', siteIds.slice(0, 10)),
        orderBy('updatedAt', 'desc')
      )
    );

    return snapshot.docs.map((record) => record.data() as Client);
  },

  async getClientById(clientId: string, actor: ServiceActor): Promise<Client | null> {
    const client = await this.getClient(clientId);
    if (!client) return null;

    ensureOrgAccess(actor, client.organizationId);

    if (actor.role === 'caseworker' && !client.assignedWorkerIds.includes(actor.id)) {
      throw new ServiceError('You can only view clients assigned to you.');
    }

    if (actor.role === 'ssa') {
      ensureSiteAccess(actor, client.siteId);
    }

    return client;
  },

  async createClient(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>, actor: ServiceActor): Promise<Client> {
    ensureOrgAccess(actor, data.organizationId);
    ensureSiteAccess(actor, data.siteId);

    const ref = doc(collection(db, COLLECTION_NAME));
    const timestamp = new Date().toISOString();

    const client: Client = {
      ...data,
      id: ref.id,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await setDoc(ref, client);

    await auditLogsService.writeAuditLog({
      organizationId: client.organizationId,
      siteId: client.siteId,
      userId: actor.id,
      action: 'create_client',
      entityType: 'client',
      entityId: client.id,
      metadata: { assignedWorkerIds: client.assignedWorkerIds },
    });

    return client;
  },

  async updateClient(clientId: string, data: Partial<Client>, actor: ServiceActor): Promise<void> {
    const client = await this.getClientById(clientId, actor);
    if (!client) throw new ServiceError('Client not found.');

    await updateDoc(doc(db, COLLECTION_NAME, clientId), {
      ...data,
      updatedAt: new Date().toISOString(),
    });

    await auditLogsService.writeAuditLog({
      organizationId: client.organizationId,
      siteId: client.siteId,
      userId: actor.id,
      action: 'update_client',
      entityType: 'client',
      entityId: clientId,
      metadata: { updatedFields: Object.keys(data) },
    });
  },

  async assignClient(clientId: string, workerIds: string[], actor: ServiceActor): Promise<void> {
    const client = await this.getClientById(clientId, actor);
    if (!client) throw new ServiceError('Client not found.');

    if (actor.role === 'caseworker') {
      throw new ServiceError('Caseworkers cannot reassign clients.');
    }

    await updateDoc(doc(db, COLLECTION_NAME, clientId), {
      assignedWorkerIds: workerIds,
      updatedAt: new Date().toISOString(),
    });

    await auditLogsService.writeAuditLog({
      organizationId: client.organizationId,
      siteId: client.siteId,
      userId: actor.id,
      action: 'assign_client',
      entityType: 'client',
      entityId: client.id,
      metadata: { workerIds },
    });
  },

  async getClientsNeedingContact(userProfile: UserProfile): Promise<Client[]> {
    const clients = await this.getClientsForUser(userProfile);
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    return clients.filter((client) => {
      if (!client.lastContactAt) return true;
      return new Date(client.lastContactAt).getTime() < sevenDaysAgo;
    });
  },

  async getHighPriorityClients(userProfile: UserProfile): Promise<Client[]> {
    const clients = await this.getClientsForUser(userProfile);
    return clients.filter((client) => client.priority === 'high');
  },
};
