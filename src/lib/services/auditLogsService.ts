import { db } from "../firebase/client";
import { collection, doc, setDoc, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { AuditLog } from "@/types";

const COLLECTION_NAME = "auditLogs";

export const auditLogsService = {
  /**
   * Write a new audit log
   */
  async writeAuditLog(log: Omit<AuditLog, "id">): Promise<void> {
    const newLogRef = doc(collection(db, COLLECTION_NAME));
    const fullLog: AuditLog = {
      ...log,
      id: newLogRef.id,
      timestamp: new Date().toISOString()
    };
    await setDoc(newLogRef, fullLog);
  },

  /**
   * Get audit logs for an organization
   */
  async getAuditLogs(orgId: string, count: number = 50): Promise<AuditLog[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("organizationId", "==", orgId),
      orderBy("timestamp", "desc"),
      limit(count)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as AuditLog);
  },

  /**
   * Get audit logs for a specific user
   */
  async getUserActivity(userId: string, count: number = 20): Promise<AuditLog[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("userId", "==", userId),
      orderBy("timestamp", "desc"),
      limit(count)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as AuditLog);
  }
};
