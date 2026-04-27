import { db } from "../firebase/client";
import { collection, doc, getDoc, getDocs, query, where, setDoc, updateDoc, orderBy } from "firebase/firestore";
import { SafetyPlan } from "@/types";

const COLLECTION_NAME = "safetyPlans";

export const safetyPlansService = {
  /**
   * Fetch a specific safety plan
   */
  async getSafetyPlan(planId: string): Promise<SafetyPlan | null> {
    const planDoc = await getDoc(doc(db, COLLECTION_NAME, planId));
    if (planDoc.exists()) {
      return planDoc.data() as SafetyPlan;
    }
    return null;
  },

  /**
   * Get active safety plan for a specific client
   */
  async getActiveSafetyPlanForClient(clientId: string): Promise<SafetyPlan | null> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("clientId", "==", clientId),
      where("status", "==", "active"),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as SafetyPlan;
  },

  /**
   * Create a new safety plan
   */
  async createSafetyPlan(plan: SafetyPlan): Promise<void> {
    await setDoc(doc(db, COLLECTION_NAME, plan.id), plan);
  },

  /**
   * Update a safety plan
   */
  async updateSafetyPlan(planId: string, data: Partial<SafetyPlan>): Promise<void> {
    data.updatedAt = new Date().toISOString();
    await updateDoc(doc(db, COLLECTION_NAME, planId), data);
  }
};
