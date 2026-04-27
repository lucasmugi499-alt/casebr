import { db } from "../firebase/client";
import { collection, doc, getDoc, getDocs, query, where, setDoc, updateDoc } from "firebase/firestore";
import { Site } from "@/types";

const COLLECTION_NAME = "sites";

export const sitesService = {
  /**
   * Fetch a specific site
   */
  async getSite(siteId: string): Promise<Site | null> {
    const siteDoc = await getDoc(doc(db, COLLECTION_NAME, siteId));
    if (siteDoc.exists()) {
      return siteDoc.data() as Site;
    }
    return null;
  },

  /**
   * Get all sites for an organization
   */
  async getSitesByOrganization(orgId: string): Promise<Site[]> {
    const q = query(
      collection(db, COLLECTION_NAME), 
      where("organizationId", "==", orgId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Site);
  },

  /**
   * Create a new site
   */
  async createSite(site: Site): Promise<void> {
    await setDoc(doc(db, COLLECTION_NAME, site.id), site);
  },

  /**
   * Update a site
   */
  async updateSite(siteId: string, data: Partial<Site>): Promise<void> {
    await updateDoc(doc(db, COLLECTION_NAME, siteId), data);
  }
};
