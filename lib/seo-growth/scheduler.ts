export const seoScheduleTargets = [
  { cadence: "daily", active: false, tasks: ["availability", "critical_indexing", "configured_search_performance"] },
  { cadence: "weekly", active: false, tasks: ["priority_crawl", "keyword_opportunities", "low_ctr_pages", "optimization_proposals", "product_content_coordination"] },
  { cadence: "monthly", active: false, tasks: ["performance_report", "visibility_comparison", "optimization_evaluation", "priority_recommendations"] }
] as const;

export function assertSeoSchedulesInactive(schedules = seoScheduleTargets) {
  if (schedules.some((schedule) => schedule.active)) throw new Error("Production SEO schedules require explicit approval");
  return true;
}
