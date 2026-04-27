import { db } from "../firebase/client";
import { collection, doc, getDoc, getDocs, query, where, setDoc, updateDoc, orderBy } from "firebase/firestore";
import { SupervisorReview } from "@/types";

const COLLECTION_NAME = "supervisorReviews";

export const supervisorReviewsService = {
  /**
   * Fetch a specific review
   */
  async getReview(reviewId: string): Promise<SupervisorReview | null> {
    const reviewDoc = await getDoc(doc(db, COLLECTION_NAME, reviewId));
    if (reviewDoc.exists()) {
      return reviewDoc.data() as SupervisorReview;
    }
    return null;
  },

  /**
   * Get reviews for a specific entity (note, risk flag, etc)
   */
  async getReviewsForEntity(entityId: string): Promise<SupervisorReview[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("entityId", "==", entityId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as SupervisorReview);
  },

  /**
   * Get unresolved reviews for a supervisor/site
   */
  async getUnresolvedReviews(orgId: string, siteId?: string): Promise<SupervisorReview[]> {
    let q;
    if (siteId) {
      q = query(
        collection(db, COLLECTION_NAME),
        where("organizationId", "==", orgId),
        where("siteId", "==", siteId),
        where("resolved", "==", false),
        orderBy("createdAt", "desc")
      );
    } else {
      q = query(
        collection(db, COLLECTION_NAME),
        where("organizationId", "==", orgId),
        where("resolved", "==", false),
        orderBy("createdAt", "desc")
      );
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as SupervisorReview);
  },

  /**
   * Create a new review
   */
  async createReview(review: SupervisorReview): Promise<void> {
    await setDoc(doc(db, COLLECTION_NAME, review.id), review);
  },

  /**
   * Update a review
   */
  async updateReview(reviewId: string, data: Partial<SupervisorReview>): Promise<void> {
    data.updatedAt = new Date().toISOString();
    await updateDoc(doc(db, COLLECTION_NAME, reviewId), data);
  }
};
