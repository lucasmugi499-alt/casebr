import { CaseNote, ServiceActor } from '@/types';
import { db, isMock } from '../firebase/client';
import { collection, doc, getDocs, limit, orderBy, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { auditLogsService } from './auditLogsService';
import { clientsService } from './clientsService';
import { ServiceError } from './serviceHelpers';
import { mockNotes } from '../mockData';
import { isDemoMode } from '../demo/demoMode';
import { addDemoCaseNote } from '../demo/demoStore';
import { getDemoNotesForClient } from '../demo/demoServices';
import { getDemoStore } from '../demo/demoStore';

const COLLECTION_NAME = 'caseNotes';

export const caseNotesService = {
  async createCaseNote(data: Omit<CaseNote, 'id' | 'createdAt' | 'updatedAt'>, actor: ServiceActor): Promise<CaseNote> {
    const client = await clientsService.getClientById(data.clientId, actor);
    if (!client) throw new ServiceError('Client not found.');

    if (isDemoMode()) {
      const note = addDemoCaseNote({ ...data, id: `demo_note_${crypto.randomUUID()}` });
      await auditLogsService.writeAuditLog({ organizationId: note.organizationId, siteId: note.siteId, userId: actor.id, action: 'create_case_note', entityType: 'caseNote', entityId: note.id, metadata: { aiGenerated: note.aiGenerated, category: note.category, source: 'demo' } });
      return note;
    }

    const ref = doc(collection(db, COLLECTION_NAME));
    const timestamp = new Date().toISOString();

    const note: CaseNote = {
      ...data,
      id: ref.id,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await setDoc(ref, note);

    await clientsService.updateClient(note.clientId, { lastContactAt: note.contactDate }, actor);

    await auditLogsService.writeAuditLog({ organizationId: note.organizationId, siteId: note.siteId, userId: actor.id, action: 'create_case_note', entityType: 'caseNote', entityId: note.id, metadata: { aiGenerated: note.aiGenerated, category: note.category } });

    return note;
  },

  async updateCaseNote(noteId: string, data: Partial<CaseNote>, actor: ServiceActor): Promise<void> {
    if (isDemoMode()) return;
    await updateDoc(doc(db, COLLECTION_NAME, noteId), {
      ...data,
      updatedAt: new Date().toISOString(),
    });

    await auditLogsService.writeAuditLog({ organizationId: actor.organizationId, userId: actor.id, action: 'update_case_note', entityType: 'caseNote', entityId: noteId, metadata: { updatedFields: Object.keys(data) } });
  },

  async getNotesForClient(clientId: string, actor: ServiceActor): Promise<CaseNote[]> {
    const client = await clientsService.getClientById(clientId, actor);
    if (!client) return [];
    if (isDemoMode()) return getDemoNotesForClient(clientId);

    const snapshot = await getDocs(query(collection(db, COLLECTION_NAME), where('clientId', '==', clientId), orderBy('contactDate', 'desc')));

    return snapshot.docs.map((record) => record.data() as CaseNote);
  },

  async getRecentNotesForUser(actor: ServiceActor): Promise<CaseNote[]> {
    if (isMock) return mockNotes;
    if (isDemoMode()) return getDemoStore().caseNotes.filter((note) => note.authorId === actor.id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0, 10);
    const snapshot = await getDocs(
      query(
        collection(db, COLLECTION_NAME),
        where('organizationId', '==', actor.organizationId),
        where('authorId', '==', actor.id),
        orderBy('createdAt', 'desc'),
        limit(10)
      )
    );

    return snapshot.docs.map((record) => record.data() as CaseNote);
  },

  async getNotesThisWeek(actor: ServiceActor): Promise<CaseNote[]> {
    if (isMock) return mockNotes;
    if (isDemoMode()) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      return getDemoStore().caseNotes.filter((note) => note.authorId === actor.id && new Date(note.createdAt) >= weekStart);
    }
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const snapshot = await getDocs(
      query(
        collection(db, COLLECTION_NAME),
        where('organizationId', '==', actor.organizationId),
        where('authorId', '==', actor.id),
        where('createdAt', '>=', weekStart.toISOString()),
        orderBy('createdAt', 'desc')
      )
    );

    return snapshot.docs.map((record) => record.data() as CaseNote);
  },
};
