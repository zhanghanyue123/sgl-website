export const seoScheduleTargets = [
  { cadence: "daily", active: process.env.SEO_CRON_ENABLED === "true", schedule: "09:00 Asia/Shanghai", tasks: ["global_technical_audit", "china_technical_audit", "sitemap", "robots", "canonical", "hreflang", "metadata", "broken_links", "structured_data"] },
  { cadence: "weekly", active: process.env.SEO_CRON_ENABLED === "true", schedule: "Monday 09:00 Asia/Shanghai", tasks: ["global_weekly_report", "china_weekly_report", "keyword_opportunities", "previous_week_comparison"] }
] as const;

export function assertSeoSchedulesInactive(schedules = seoScheduleTargets) {
  if (schedules.some((schedule) => schedule.active)) throw new Error("Production SEO schedules require explicit approval");
  return true;
}
