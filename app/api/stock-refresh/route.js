// Backward-compatible alias for the renamed job (/api/stock-refresh ->
// /api/attention-refresh). Re-exports the handler rather than redirecting so
// a cron caller's Authorization header is preserved.
export { GET } from "../attention-refresh/route";
