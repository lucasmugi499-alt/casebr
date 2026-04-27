import { db } from "../firebase/client";
import { collection, doc, getDoc, getDocs, query, where, setDoc, updateDoc, orderBy } from "firebase/firestore";
import { Task } from "@/types";

const COLLECTION_NAME = "tasks";

export const tasksService = {
  /**
   * Fetch a specific task
   */
  async getTask(taskId: string): Promise<Task | null> {
    const taskDoc = await getDoc(doc(db, COLLECTION_NAME, taskId));
    if (taskDoc.exists()) {
      return taskDoc.data() as Task;
    }
    return null;
  },

  /**
   * Get tasks for a specific user
   */
  async getTasksForUser(userId: string): Promise<Task[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("assignedToId", "==", userId),
      orderBy("dueDate", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Task);
  },

  /**
   * Get tasks for a specific client
   */
  async getTasksForClient(clientId: string): Promise<Task[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("clientId", "==", clientId),
      orderBy("dueDate", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Task);
  },

  /**
   * Get overdue tasks for a team/site
   */
  async getOverdueTasksForTeam(siteIds: string[]): Promise<Task[]> {
    if (!siteIds || siteIds.length === 0) return [];
    
    const today = new Date().toISOString();
    const q = query(
      collection(db, COLLECTION_NAME),
      where("siteId", "in", siteIds),
      where("status", "!=", "completed"),
      where("dueDate", "<", today),
      orderBy("dueDate", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Task);
  },

  /**
   * Create a new task
   */
  async createTask(task: Task): Promise<void> {
    await setDoc(doc(db, COLLECTION_NAME, task.id), task);
  },

  /**
   * Update a task
   */
  async updateTask(taskId: string, data: Partial<Task>): Promise<void> {
    data.updatedAt = new Date().toISOString();
    await updateDoc(doc(db, COLLECTION_NAME, taskId), data);
  }
};
