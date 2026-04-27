import { db } from "../firebase/client";
import { collection, doc, getDoc, getDocs, query, where, setDoc, updateDoc, orderBy } from "firebase/firestore";
import { Referral } from "@/types";

const COLLECTION_NAME = "referrals";

export const referralsService = {
  /**
   * Fetch a specific referral
   */
  async getReferral(referralId: string): Promise<Referral | null> {
    const referralDoc = await getDoc(doc(db, COLLECTION_NAME, referralId));
    if (referralDoc.exists()) {
      return referralDoc.data() as Referral;
    }
    return null;
  },

  /**
   * Get referrals for a specific client
   */
  async getReferralsForClient(clientId: string): Promise<Referral[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("clientId", "==", clientId),
      orderBy("referralDate", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Referral);
  },

  /**
   * Get referrals for a specific site/org
   */
  async getReferralsBySite(siteId: string, orgId: string): Promise<Referral[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("organizationId", "==", orgId),
      where("siteId", "==", siteId),
      orderBy("referralDate", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Referral);
  },

  /**
   * Create a new referral
   */
  async createReferral(referral: Referral): Promise<void> {
    await setDoc(doc(db, COLLECTION_NAME, referral.id), referral);
  },

  /**
   * Update a referral
   */
  async updateReferral(referralId: string, data: Partial<Referral>): Promise<void> {
    data.updatedAt = new Date().toISOString();
    await updateDoc(doc(db, COLLECTION_NAME, referralId), data);
  }
};
