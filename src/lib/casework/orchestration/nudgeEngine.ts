export const generateCaseworkerNudges = (caseworkState: any) => (caseworkState.smartTasks || []).slice(0, 4).map((t: any) => ({ message: `${t.title} for ${caseworkState.client.displayName}.`, priority: t.priority }));
export const generateSSANudges = (teamState: any) => [{ type: "unassigned_clients", message: `${teamState.unassignedClients?.length ?? 0} unassigned clients require SSA assignment.` }];
export const generateManagerNudges = (programState: any) => [{ type: "documentation_gap", message: `Review documentation gaps across ${programState.sites ?? "sites"}.` }];
