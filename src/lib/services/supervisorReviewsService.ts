import { db } from "../firebase/client";
import { collection, doc, getDoc, getDocs, query, where, setDoc, updateDoc, orderBy } from "firebase/firestore";
import { SupervisorReview } from "@/types";
import { isDemoMode } from "../demo/demoMode";
import { addDemoSupervisorReview, getDemoStore } from "../demo/demoStore";

const COLLECTION_NAME = "supervisorReviews";

export const supervisorReviewsService = {
  async getReview(reviewId: string): Promise<SupervisorReview | null> {
    if (isDemoMode()) return getDemoStore().supervisorReviews.find((review) => review.id === reviewId) ?? null;
    const reviewDoc = await getDoc(doc(db, COLLECTION_NAME, reviewId));
    if (reviewDoc.exists()) {
      return reviewDoc.data() as SupervisorReview;
    }
    return null;
  },

  async getReviewsForEntity(entityId: string): Promise<SupervisorReview[]> {
    if (isDemoMode()) {
      return getDemoStore().supervisorReviews.filter((review) => review.caseNoteId === entityId || review.riskFlagId === entityId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    const q = query(collection(db, COLLECTION_NAME), where("entityId", "==", entityId), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as SupervisorReview);
  },

  async getUnresolvedReviews(orgId: string, siteId?: string): Promise<SupervisorReview[]> {
    if (isDemoMode()) {
      return getDemoStore().supervisorReviews.filter((review) => review.organizationId === orgId && !review.completedAt && (!siteId || review.siteId === siteId));
    }

    const constraints = [where("organizationId", "==", orgId), where("resolved", "==", false), orderBy("createdAt", "desc")];
    if (siteId) constraints.splice(1, 0, where("siteId", "==", siteId));

    const q = query(collection(db, COLLECTION_NAME), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as SupervisorReview);
  },

  async createReview(review: SupervisorReview): Promise<void> {
    if (isDemoMode()) {
      addDemoSupervisorReview(review);
      return;
    }
    await setDoc(doc(db, COLLECTION_NAME, review.id), review);
  },

  async updateReview(reviewId: string, data: Partial<SupervisorReview>): Promise<void> {
    if (isDemoMode()) return;
    data.updatedAt = new Date().toISOString();
    await updateDoc(doc(db, COLLECTION_NAME, reviewId), data);
  }
};
