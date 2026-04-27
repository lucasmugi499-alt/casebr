import { clientsService } from "./clientsService";
import { tasksService } from "./tasksService";
import { caseNotesService } from "./caseNotesService";
import { riskFlagsService } from "./riskFlagsService";

export const dashboardService = {
  /**
   * Get metrics for a caseworker's dashboard
   */
  async getCaseworkerMetrics(userId: string, orgId: string) {
    const clients = await clientsService.getAssignedClients(userId, orgId);
    const tasks = await tasksService.getTasksForUser(userId);
    
    const today = new Date().toISOString().split('T')[0];
    const dueToday = tasks.filter(t => t.dueDate.startsWith(today) && t.status !== 'completed').length;
    const highPriority = clients.filter(c => c.priority === 'high').length;
    
    // Count notes this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentNotes = await caseNotesService.getRecentCaseNotes(orgId, undefined, 50);
    const notesThisWeek = recentNotes.filter(n => 
      n.authorId === userId && 
      new Date(n.createdAt) > oneWeekAgo
    ).length;

    return {
      assignedClients: clients.length,
      dueToday,
      highPriority,
      notesThisWeek,
      priorityClients: clients.filter(c => c.priority === 'high').slice(0, 5)
    };
  },

  /**
   * Get metrics for an SSA/Team dashboard
   */
  async getTeamMetrics(orgId: string, siteIds: string[]) {
    const clients = await clientsService.getClientsBySites(siteIds, orgId);
    const overdueTasks = await tasksService.getOverdueTasksForTeam(siteIds);
    const activeRiskFlags = await riskFlagsService.getRiskFlagsForSites(siteIds);
    
    // Additional aggregations would go here...
    
    return {
      activeClients: clients.length,
      overdueTasksCount: overdueTasks.length,
      activeRiskFlagsCount: activeRiskFlags.length,
      highRiskClients: clients.filter(c => c.priority === 'high').length
    };
  }
};
