import { db } from "../firebase/client";
import { collection, doc, getDoc, getDocs, query, where, setDoc, updateDoc, orderBy } from "firebase/firestore";
import { SafetyPlan } from "@/types";
import { isDemoMode } from "../demo/demoMode";
import { addDemoSafetyPlan, getDemoStore } from "../demo/demoStore";
import { getDemoSafetyPlansForClient } from "../demo/demoServices";

const COLLECTION_NAME = "safetyPlans";

export const safetyPlansService = {
  async getSafetyPlan(planId: string): Promise<SafetyPlan | null> {
    if (isDemoMode()) return getDemoStore().safetyPlans.find((plan) => plan.id === planId) ?? null;
    const planDoc = await getDoc(doc(db, COLLECTION_NAME, planId));
    if (planDoc.exists()) {
      return planDoc.data() as SafetyPlan;
    }
    return null;
  },

  async getActiveSafetyPlanForClient(clientId: string): Promise<SafetyPlan | null> {
    if (isDemoMode()) return getDemoStore().safetyPlans.find((plan) => plan.clientId === clientId && plan.status === "active") ?? null;
    const q = query(collection(db, COLLECTION_NAME), where("clientId", "==", clientId), where("status", "==", "active"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as SafetyPlan;
  },

  async getSafetyPlansForClient(clientId: string): Promise<SafetyPlan[]> {
    if (isDemoMode()) return getDemoSafetyPlansForClient(clientId);
    const q = query(collection(db, COLLECTION_NAME), where("clientId", "==", clientId), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => docSnap.data() as SafetyPlan);
  },

  async createSafetyPlan(plan: SafetyPlan): Promise<void> {
    if (isDemoMode()) {
      addDemoSafetyPlan(plan);
      return;
    }
    await setDoc(doc(db, COLLECTION_NAME, plan.id), plan);
  },

  async updateSafetyPlan(planId: string, data: Partial<SafetyPlan>): Promise<void> {
    if (isDemoMode()) return;
    data.updatedAt = new Date().toISOString();
    await updateDoc(doc(db, COLLECTION_NAME, planId), data);
  }
};
