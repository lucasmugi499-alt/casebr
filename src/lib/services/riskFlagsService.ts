import { db } from "../firebase/client";
import { collection, doc, getDoc, getDocs, query, where, setDoc, updateDoc, orderBy } from "firebase/firestore";
import { RiskFlag } from "@/types";

const COLLECTION_NAME = "riskFlags";

export const riskFlagsService = {
  /**
   * Fetch a specific risk flag
   */
  async getRiskFlag(flagId: string): Promise<RiskFlag | null> {
    const flagDoc = await getDoc(doc(db, COLLECTION_NAME, flagId));
    if (flagDoc.exists()) {
      return flagDoc.data() as RiskFlag;
    }
    return null;
  },

  /**
   * Get active risk flags for a specific client
   */
  async getActiveRiskFlagsForClient(clientId: string): Promise<RiskFlag[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("clientId", "==", clientId),
      where("active", "==", true),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as RiskFlag);
  },

  /**
   * Get risk flags for specific sites
   */
  async getRiskFlagsForSites(siteIds: string[]): Promise<RiskFlag[]> {
    if (!siteIds || siteIds.length === 0) return [];
    
    const q = query(
      collection(db, COLLECTION_NAME),
      where("siteId", "in", siteIds),
      where("active", "==", true),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as RiskFlag);
  },

  /**
   * Create a new risk flag
   */
  async createRiskFlag(flag: RiskFlag): Promise<void> {
    await setDoc(doc(db, COLLECTION_NAME, flag.id), flag);
  },

  /**
   * Update a risk flag
   */
  async updateRiskFlag(flagId: string, data: Partial<RiskFlag>): Promise<void> {
    data.updatedAt = new Date().toISOString();
    await updateDoc(doc(db, COLLECTION_NAME, flagId), data);
  }
};
