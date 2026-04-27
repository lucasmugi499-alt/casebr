import { Client, Task, CaseNote } from "@/types";

export const mockClients: Client[] = [
    {
        id: "demo-client-1",
        organizationId: "org_casebridge_demo",
        siteId: "site_downtown",
        displayName: "John Doe (Demo)",
        clientCode: "CB-1001",
        assignedWorkerIds: ["demo-admin-uid"],
        status: "active",
        priority: "high",
        currentGoal: "Secure permanent housing.",
        lastContactAt: new Date().toISOString(),
        nextFollowUpAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdById: "demo-admin-uid",
    },
    {
        id: "demo-client-2",
        organizationId: "org_casebridge_demo",
        siteId: "site_downtown",
        displayName: "Jane Smith (Demo)",
        clientCode: "CB-1002",
        assignedWorkerIds: ["demo-admin-uid"],
        status: "active",
        priority: "medium",
        currentGoal: "Connect to income supports.",
        lastContactAt: new Date().toISOString(),
        nextFollowUpAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdById: "demo-admin-uid",
    }
];

export const mockTasks: Task[] = [
    {
        id: "demo-task-1",
        organizationId: "org_casebridge_demo",
        siteId: "site_downtown",
        clientId: "demo-client-1",
        assignedToId: "demo-admin-uid",
        createdById: "demo-admin-uid",
        title: "Follow-up on housing referral",
        description: "Confirm agency response.",
        dueDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        priority: "high",
        status: "open",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }
];

export const mockNotes: CaseNote[] = [
    {
        id: "demo-note-1",
        organizationId: "org_casebridge_demo",
        siteId: "site_downtown",
        clientId: "demo-client-1",
        authorId: "demo-admin-uid",
        contactDate: new Date().toISOString(),
        contactType: "in_person",
        category: "housing",
        location: "site_downtown",
        roughSummary: "Discussed housing options.",
        actionsTaken: "Sent referral.",
        referralsMade: "Housing Access",
        followUpRequired: true,
        riskSafetyConcerns: "",
        finalNote: "Client is motivated to find housing.",
        aiGenerated: true,
        supervisorReviewed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    }
];
