export function adminSourceTimeoutMs(value = process.env.SGL_ADMIN_SOURCE_TIMEOUT_MS) {
  const parsed = Number(value || 750);
  if (!Number.isFinite(parsed)) return 750;
  return Math.max(250, Math.min(3000, Math.round(parsed)));
}
