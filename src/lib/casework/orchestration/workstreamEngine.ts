export const deriveActiveWorkstreams = (workstreams: any[] = []) => workstreams.filter((w) => !["completed", "closed"].includes(w.status));
