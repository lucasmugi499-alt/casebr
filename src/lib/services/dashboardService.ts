import { DashboardMetric, ServiceActor } from '@/types';
import { caseNotesService } from './caseNotesService';
import { clientsService } from './clientsService';
import { tasksService } from './tasksService';
import { isDemoMode } from '../demo/demoMode';
import { getDemoCaseworkerDashboard, getDemoManagementDashboard, getDemoSupervisorDashboard } from '../demo/demoServices';

export const dashboardService = {
  async getCaseworkerDashboard(actor: ServiceActor) {
    if (isDemoMode()) return getDemoCaseworkerDashboard(actor);
    const [assignedClients, overdueTasks, notesThisWeek] = await Promise.all([
      clientsService.getAssignedClients(actor.id, actor.organizationId),
      tasksService.getOverdueTasks(actor),
      caseNotesService.getNotesThisWeek(actor),
    ]);

    const todayKey = new Date().toISOString().slice(0, 10);
    const dueToday = assignedClients.filter((client) => client.nextFollowUpAt?.startsWith(todayKey)).length;
    const highPriority = assignedClients.filter((client) => client.priority === 'high');

    const metrics: DashboardMetric[] = [
      { label: 'Assigned clients', value: assignedClients.length },
      { label: 'Follow-ups due today', value: dueToday },
      { label: 'Overdue follow-ups', value: overdueTasks.length, status: overdueTasks.length ? 'warning' : 'neutral' },
      { label: 'High-priority clients', value: highPriority.length, status: highPriority.length ? 'warning' : 'neutral' },
      { label: 'Notes completed this week', value: notesThisWeek.length },
    ];

    return { metrics, assignedClients, highPriorityClients: highPriority, overdueTasks, notesThisWeek, todayPriorityQueue: [] };
  },

  async getSupervisorDashboard(actor: ServiceActor) {
    if (isDemoMode()) return getDemoSupervisorDashboard(actor);
    return null;
  },

  async getManagementDashboard(actor: ServiceActor) {
    if (isDemoMode()) return getDemoManagementDashboard(actor);
    return null;
  },
};
