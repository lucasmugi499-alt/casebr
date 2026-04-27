import { db } from '../firebase/client';
import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { ServiceActor, UserProfile } from '@/types';
import { auditLogsService } from './auditLogsService';

const COLLECTION_NAME = 'users';

export const usersService = {
  async getCurrentUserProfile(uid: string): Promise<UserProfile | null> {
    const userDoc = await getDoc(doc(db, COLLECTION_NAME, uid));
    return userDoc.exists() ? (userDoc.data() as UserProfile) : null;
  },

  async getUsersByOrganization(organizationId: string): Promise<UserProfile[]> {
    const snapshot = await getDocs(query(collection(db, COLLECTION_NAME), where('organizationId', '==', organizationId)));
    return snapshot.docs.map((entry) => entry.data() as UserProfile);
  },

  async getUsersBySite(organizationId: string, siteIds: string[]): Promise<UserProfile[]> {
    if (!siteIds.length) return [];
    const snapshot = await getDocs(
      query(
        collection(db, COLLECTION_NAME),
        where('organizationId', '==', organizationId),
        where('siteIds', 'array-contains-any', siteIds.slice(0, 10))
      )
    );
    return snapshot.docs.map((entry) => entry.data() as UserProfile);
  },

  async createUserProfile(data: UserProfile, actor?: ServiceActor): Promise<void> {
    await setDoc(doc(db, COLLECTION_NAME, data.id), data);
    if (actor) {
      await auditLogsService.writeAuditLog({
        organizationId: actor.organizationId,
        userId: actor.id,
        action: 'create_user',
        entityType: 'user',
        entityId: data.id,
      });
    }
  },

  async updateUserProfile(userId: string, data: Partial<UserProfile>, actor?: ServiceActor): Promise<void> {
    await updateDoc(doc(db, COLLECTION_NAME, userId), { ...data, updatedAt: new Date().toISOString() });
    if (actor) {
      await auditLogsService.writeAuditLog({
        organizationId: actor.organizationId,
        userId: actor.id,
        action: 'update_user',
        entityType: 'user',
        entityId: userId,
      });
    }
  },

  async deactivateUser(userId: string, actor: ServiceActor): Promise<void> {
    await updateDoc(doc(db, COLLECTION_NAME, userId), { status: 'inactive', updatedAt: new Date().toISOString() });
    await auditLogsService.writeAuditLog({
      organizationId: actor.organizationId,
      userId: actor.id,
      action: 'deactivate_user',
      entityType: 'user',
      entityId: userId,
    });
  },

  async getCaseworkersForSite(siteId: string, organizationId: string): Promise<UserProfile[]> {
    const snapshot = await getDocs(
      query(
        collection(db, COLLECTION_NAME),
        where('organizationId', '==', organizationId),
        where('role', '==', 'caseworker'),
        where('siteIds', 'array-contains', siteId)
      )
    );

    return snapshot.docs.map((entry) => entry.data() as UserProfile);
  },
};
