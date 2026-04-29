import {
  ClientNeed,
  Workstream,
  WorkstreamType,
  ServiceActor,
} from "@/types";
import { getWorkstreamTypeForNeed } from "./clientNeedsEngine";

/**
 * Filter active (non-completed, non-closed) workstreams.
 */
export const deriveActiveWorkstreams = (workstreams: Workstream[]): Workstream[] =>
  workstreams.filter((w) => !["completed", "closed"].includes(w.status));

/**
 * Derive new Workstream objects from a set of client needs.
 * Only creates workstreams for need types that map to a workstream type
 * and where that workstream doesn't already exist.
 * Does NOT persist — returns objects for the caller to persist.
 */
export function deriveWorkstreamsFromNeeds(
  needs: ClientNeed[],
  clientId: string,
  actorId: string,
  existingWorkstreams: Workstream[]
): Workstream[] {
  const now = new Date().toISOString();
  const existingTypes = new Set(existingWorkstreams.map((ws) => ws.type));
  const newWorkstreams: Workstream[] = [];

  for (const need of needs) {
    const wsType: WorkstreamType | undefined = getWorkstreamTypeForNeed(need.needType);
    if (!wsType) continue;
    if (existingTypes.has(wsType)) continue;

    newWorkstreams.push({
      id: `ws_${wsType}_${clientId}_${Date.now()}`,
      clientId,
      type: wsType,
      status: "not_started",
      latestAction: `${need.needType.replace(/_/g, " ")} identified during Initial Assessment.`,
      nextAction: need.recommendedNextAction,
      assignedWorkerId: actorId,
      linkedNoteIds: [],
      linkedTaskIds: [],
      linkedReferralIds: [],
      priority: need.priority === "urgent" ? "high" : need.priority,
      updatedAt: now,
    });

    existingTypes.add(wsType); // prevent duplicates within this batch
  }

  return newWorkstreams;
}
