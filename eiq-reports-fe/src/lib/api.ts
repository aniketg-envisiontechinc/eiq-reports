const API_BASE = '/api';

function withReportUrl(base: string, reportUrl?: string): string {
  if (!reportUrl) return base;
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}reportUrl=${encodeURIComponent(reportUrl)}`;
}

export async function fetchDashboard(reportUrl?: string) {
  const res = await fetch(withReportUrl(`${API_BASE}/dashboard`, reportUrl));
  if (!res.ok) throw new Error('Failed to fetch dashboard');
  return res.json();
}

export async function fetchAttendees(page = 1, limit = 20, search = '', reportUrl?: string) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit), search });
  if (reportUrl) params.set('reportUrl', reportUrl);
  const res = await fetch(`${API_BASE}/attendees?${params}`);
  if (!res.ok) throw new Error('Failed to fetch attendees');
  return res.json();
}

export async function fetchFeedback(reportUrl?: string) {
  const res = await fetch(withReportUrl(`${API_BASE}/feedback`, reportUrl));
  if (!res.ok) throw new Error('Failed to fetch feedback');
  return res.json();
}

export async function fetchPolls(reportUrl?: string) {
  const res = await fetch(withReportUrl(`${API_BASE}/polls`, reportUrl));
  if (!res.ok) throw new Error('Failed to fetch polls');
  return res.json();
}

export async function fetchQna(reportUrl?: string) {
  const res = await fetch(withReportUrl(`${API_BASE}/qna`, reportUrl));
  if (!res.ok) throw new Error('Failed to fetch Q&A');
  return res.json();
}

export async function fetchMeta(reportUrl?: string) {
  const res = await fetch(withReportUrl(`${API_BASE}/meta`, reportUrl));
  if (!res.ok) return null;
  return res.json();
}
