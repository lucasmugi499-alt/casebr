import { db } from "../firebase/client";
import { collection, doc, getDoc, getDocs, query, where, setDoc, updateDoc, orderBy } from "firebase/firestore";
import { Client } from "@/types";

const COLLECTION_NAME = "clients";

export const clientsService = {
  /**
   * Fetch a specific client
   */
  async getClient(clientId: string): Promise<Client | null> {
    const clientDoc = await getDoc(doc(db, COLLECTION_NAME, clientId));
    if (clientDoc.exists()) {
      return clientDoc.data() as Client;
    }
    return null;
  },

  /**
   * Get all clients for a specific organization
   */
  async getClientsByOrganization(orgId: string): Promise<Client[]> {
    const q = query(
      collection(db, COLLECTION_NAME), 
      where("organizationId", "==", orgId),
      orderBy("updatedAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Client);
  },

  /**
   * Get clients assigned to a specific worker
   */
  async getAssignedClients(userId: string, orgId: string): Promise<Client[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("organizationId", "==", orgId),
      where("assignedWorkerIds", "array-contains", userId),
      orderBy("updatedAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Client);
  },

  /**
   * Get clients for specific sites
   */
  async getClientsBySites(siteIds: string[], orgId: string): Promise<Client[]> {
    if (!siteIds || siteIds.length === 0) return [];
    
    // Firestore 'in' queries are limited to 10 items, but for MVP it's fine.
    const q = query(
      collection(db, COLLECTION_NAME),
      where("organizationId", "==", orgId),
      where("siteId", "in", siteIds)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Client);
  },

  /**
   * Create a new client
   */
  async createClient(client: Client): Promise<void> {
    await setDoc(doc(db, COLLECTION_NAME, client.id), client);
  },

  /**
   * Update a client
   */
  async updateClient(clientId: string, data: Partial<Client>): Promise<void> {
    data.updatedAt = new Date().toISOString();
    await updateDoc(doc(db, COLLECTION_NAME, clientId), data);
  }
};
