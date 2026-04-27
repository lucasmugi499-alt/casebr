import { ServiceActor, Task } from '@/types';
import { db, isMock } from '../firebase/client';
import { collection, doc, getDocs, orderBy, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { auditLogsService } from './auditLogsService';
import { clientsService } from './clientsService';
import { ensureOrgAccess, ensureSiteAccess, ServiceError } from './serviceHelpers';
import { mockTasks } from '../mockData';

const COLLECTION_NAME = 'tasks';

export const tasksService = {
  async createTask(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>, actor: ServiceActor): Promise<Task> {
    ensureOrgAccess(actor, data.organizationId);
    ensureSiteAccess(actor, data.siteId);

    if (data.clientId) {
      const client = await clientsService.getClientById(data.clientId, actor);
      if (!client) throw new ServiceError('Client not found for task.');
    }

    const ref = doc(collection(db, COLLECTION_NAME));
    const timestamp = new Date().toISOString();

    const task: Task = {
      ...data,
      id: ref.id,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await setDoc(ref, task);

    await auditLogsService.writeAuditLog({
      organizationId: task.organizationId,
      siteId: task.siteId,
      userId: actor.id,
      action: 'create_task',
      entityType: 'task',
      entityId: task.id,
      metadata: { dueDate: task.dueDate, priority: task.priority },
    });

    return task;
  },

  async updateTask(taskId: string, data: Partial<Task>, actor: ServiceActor): Promise<void> {
    await updateDoc(doc(db, COLLECTION_NAME, taskId), {
      ...data,
      updatedAt: new Date().toISOString(),
    });

    await auditLogsService.writeAuditLog({
      organizationId: actor.organizationId,
      userId: actor.id,
      action: 'update_task',
      entityType: 'task',
      entityId: taskId,
      metadata: { updatedFields: Object.keys(data) },
    });
  },

  async completeTask(taskId: string, actor: ServiceActor): Promise<void> {
    await updateDoc(doc(db, COLLECTION_NAME, taskId), {
      status: 'completed',
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await auditLogsService.writeAuditLog({
      organizationId: actor.organizationId,
      userId: actor.id,
      action: 'complete_task',
      entityType: 'task',
      entityId: taskId,
    });
  },

  async getTasksForUser(actor: ServiceActor): Promise<Task[]> {
    if (isMock) return mockTasks;
    const snapshot = await getDocs(
      query(collection(db, COLLECTION_NAME), where('assignedToId', '==', actor.id), orderBy('dueDate', 'asc'))
    );
    return snapshot.docs.map((record) => record.data() as Task);
  },

  async getTasksForClient(clientId: string, actor: ServiceActor): Promise<Task[]> {
    const client = await clientsService.getClientById(clientId, actor);
    if (!client) return [];

    const snapshot = await getDocs(
      query(collection(db, COLLECTION_NAME), where('clientId', '==', clientId), orderBy('dueDate', 'asc'))
    );

    return snapshot.docs.map((record) => record.data() as Task);
  },

  async getOverdueTasks(actor: ServiceActor): Promise<Task[]> {
    if (isMock) return mockTasks;
    const snapshot = await getDocs(
      query(
        collection(db, COLLECTION_NAME),
        where('organizationId', '==', actor.organizationId),
        where('assignedToId', '==', actor.id),
        where('status', 'in', ['open', 'in_progress', 'overdue']),
        orderBy('dueDate', 'asc')
      )
    );

    const now = new Date().toISOString();
    return snapshot.docs
      .map((record) => record.data() as Task)
      .filter((task) => task.dueDate < now);
  },

  async getTeamOverdueTasks(actor: ServiceActor): Promise<Task[]> {
    if (isMock) return mockTasks;
    if (!actor.siteIds.length) return [];

    const snapshot = await getDocs(
      query(
        collection(db, COLLECTION_NAME),
        where('organizationId', '==', actor.organizationId),
        where('siteId', 'in', actor.siteIds.slice(0, 10)),
        where('status', 'in', ['open', 'in_progress', 'overdue']),
        orderBy('dueDate', 'asc')
      )
    );

    const now = new Date().toISOString();
    return snapshot.docs
      .map((record) => record.data() as Task)
      .filter((task) => task.dueDate < now);
  },
};
