export const deriveActiveClientNeeds = (clientNeeds: any[] = []) => clientNeeds.filter((n) => !["completed", "closed"].includes(n.status));
