import { db } from "../firebase/client";
import { collection, doc, getDoc, getDocs, query, where, setDoc, updateDoc, orderBy, limit } from "firebase/firestore";
import { CaseNote } from "@/types";

const COLLECTION_NAME = "caseNotes";

export const caseNotesService = {
  /**
   * Fetch a specific case note
   */
  async getCaseNote(noteId: string): Promise<CaseNote | null> {
    const noteDoc = await getDoc(doc(db, COLLECTION_NAME, noteId));
    if (noteDoc.exists()) {
      return noteDoc.data() as CaseNote;
    }
    return null;
  },

  /**
   * Get case notes for a specific client
   */
  async getCaseNotesByClient(clientId: string): Promise<CaseNote[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("clientId", "==", clientId),
      orderBy("contactDate", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as CaseNote);
  },

  /**
   * Get recent case notes for an organization/site
   */
  async getRecentCaseNotes(orgId: string, siteId?: string, count: number = 10): Promise<CaseNote[]> {
    let q;
    if (siteId) {
      q = query(
        collection(db, COLLECTION_NAME),
        where("organizationId", "==", orgId),
        where("siteId", "==", siteId),
        orderBy("createdAt", "desc"),
        limit(count)
      );
    } else {
      q = query(
        collection(db, COLLECTION_NAME),
        where("organizationId", "==", orgId),
        orderBy("createdAt", "desc"),
        limit(count)
      );
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as CaseNote);
  },

  /**
   * Create a new case note
   */
  async createCaseNote(note: CaseNote): Promise<void> {
    await setDoc(doc(db, COLLECTION_NAME, note.id), note);
  },

  /**
   * Update a case note
   */
  async updateCaseNote(noteId: string, data: Partial<CaseNote>): Promise<void> {
    data.updatedAt = new Date().toISOString();
    await updateDoc(doc(db, COLLECTION_NAME, noteId), data);
  }
};
