import { db } from "../firebase/client";
import { collection, doc, getDoc, getDocs, query, where, setDoc, updateDoc } from "firebase/firestore";
import { User, Role } from "@/types";

const COLLECTION_NAME = "users";

export const usersService = {
  /**
   * Fetch a specific user profile
   */
  async getUser(uid: string): Promise<User | null> {
    const userDoc = await getDoc(doc(db, COLLECTION_NAME, uid));
    if (userDoc.exists()) {
      return userDoc.data() as User;
    }
    return null;
  },

  /**
   * Get all users for an organization
   */
  async getUsersByOrganization(orgId: string): Promise<User[]> {
    const q = query(collection(db, COLLECTION_NAME), where("organizationId", "==", orgId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as User);
  },

  /**
   * Get users by specific roles within an organization
   */
  async getUsersByRoles(orgId: string, roles: Role[]): Promise<User[]> {
    const q = query(
      collection(db, COLLECTION_NAME), 
      where("organizationId", "==", orgId),
      where("role", "in", roles)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as User);
  },

  /**
   * Create or overwrite a user profile
   */
  async createUserProfile(user: User): Promise<void> {
    await setDoc(doc(db, COLLECTION_NAME, user.id), user);
  },

  /**
   * Update specific fields on a user profile
   */
  async updateUserProfile(uid: string, data: Partial<User>): Promise<void> {
    await updateDoc(doc(db, COLLECTION_NAME, uid), data);
  }
};
