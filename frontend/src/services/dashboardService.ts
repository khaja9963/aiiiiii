export const dashboardService = {
  getDashboardData: async () => {
    return {
      data: {
        stats: {
          totalCandidates: 0,
          totalJobs: 0,
          shortlistedCandidates: 0,
          interviewsScheduled: 0
        },
        recentJobs: [],
        recentCandidates: []
      }
    };
  }
};
