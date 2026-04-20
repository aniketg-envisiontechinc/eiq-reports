// ---------------------------------------------------------------------------
// Per-URL in-memory cache (for dynamic report loading per request)
// ---------------------------------------------------------------------------

interface ReportMeta {
  eventId?: string;
  webinarId?: string;
  webinarRoomId?: string;
  organizationId?: string;
  eventTitle?: string;
  eventTimezone?: string;
  generatedAt?: string;
  reportVersion?: string;
}

export interface PollRespondents {
  questions: { id: string; question: string }[];
  respondents: {
    email: string;
    firstName: string;
    lastName: string;
    company: string;
    answers: Record<string, string>;
  }[];
}

interface ReportSlices {
  attendees: any[];
  polls: any[];
  pollRespondents: PollRespondents;
  qna: any;
  chat: any;
  feedback: any[];
  meta: ReportMeta;
}

const urlCache = new Map<string, { slices: ReportSlices; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute

// ---------------------------------------------------------------------------
// Resolve a possibly-relative report path to a full URL.
// The frontend's useReportUrl hook does this client-side; we mirror it here
// so the backend can handle relative paths when env vars aren't forwarded.
// ---------------------------------------------------------------------------
function resolveReportUrl(reportUrl: string): string {
  if (reportUrl.startsWith('http://') || reportUrl.startsWith('https://')) {
    return reportUrl;
  }
  const base   = (process.env.S3_BASE_URL   ?? '').replace(/\/$/, '');
  const bucket = (process.env.S3_BUCKET     ?? '').replace(/^\//, '').replace(/\/$/, '');
  const path   = reportUrl.startsWith('/') ? reportUrl : `/${reportUrl}`;
  if (!base) throw new Error(`Cannot resolve relative reportUrl "${reportUrl}": S3_BASE_URL not configured`);
  return bucket ? `${base}/${bucket}${path}` : `${base}${path}`;
}

// ---------------------------------------------------------------------------
// Empty defaults — returned when no reportUrl is provided
// ---------------------------------------------------------------------------

const EMPTY_QNA = { id: '', start_time: null, questions: [] };
const EMPTY_CHAT = { totalMessages: 0, messages: [] };
const EMPTY_POLL_RESPONDENTS: PollRespondents = { questions: [], respondents: [] };

// ---------------------------------------------------------------------------
// Shared transformation (report JSON → shapes the services expect)
// ---------------------------------------------------------------------------

function transformReport(report: any): ReportSlices {
  const attendees: any[] = Array.isArray(report.attendees) ? report.attendees : [];
  const feedback: any[] = Array.isArray(report.feedback) ? report.feedback : [];

  // Polls: [{id, questionTitle, pollType, options:[{key,label,count}]}]
  //   → [{_id, eventId, questionTitle, pollType, options:{key:label}, results:{key:count}}]
  const polls = (Array.isArray(report.polls) ? report.polls : []).map((poll: any) => {
    const optionsArr: any[] = Array.isArray(poll.options) ? poll.options : [];
    const optionsObj: Record<string, string> = {};
    const resultsObj: Record<string, number> = {};
    for (const opt of optionsArr) {
      optionsObj[opt.key] = opt.label;
      if (opt.count > 0) resultsObj[opt.key] = opt.count;
    }
    return {
      _id: poll.id ?? poll._id,
      eventId: poll.eventId ?? '',
      questionTitle: poll.questionTitle,
      pollType: poll.pollType,
      options: optionsObj,
      results: resultsObj,
    };
  });

  // QnA: flat questions array → {id, start_time, questions:[{name,email,question_details[]}]}
  const newQna = report.qna ?? {};
  const flatQuestions: any[] = Array.isArray(newQna.questions) ? newQna.questions : [];
  const participantMap = new Map<string, any>();
  for (const q of flatQuestions) {
    const key = q.participantEmail ?? q.participantName ?? 'unknown';
    if (!participantMap.has(key)) {
      participantMap.set(key, {
        name: q.participantName ?? '',
        email: q.participantEmail ?? '',
        question_details: [],
      });
    }
    participantMap.get(key)!.question_details.push({
      question: q.question,
      question_id: q.questionId,
      answer: q.answerDetails?.length > 0 ? q.answerDetails[0].content : null,
      question_status: q.status,
      create_time: q.createTime,
      answer_details: (q.answerDetails ?? []).map((ad: any) => ({
        name: ad.answeredBy ?? '',
        email: null,
        content: ad.content ?? '',
        create_time: ad.answeredAt ?? null,
        type: 'text',
      })),
    });
  }
  const qna = {
    id: newQna.eventId ?? '',
    start_time: newQna.startTime ?? null,
    questions: Array.from(participantMap.values()),
  };

  const meta = report.meta ?? {};
  const chat = report.chat ?? EMPTY_CHAT;

  // Per-respondent poll data (report v2+). Older reports may omit this section.
  const pr = report.pollRespondents;
  const pollRespondents: PollRespondents = pr && Array.isArray(pr.questions) && Array.isArray(pr.respondents)
    ? { questions: pr.questions, respondents: pr.respondents }
    : EMPTY_POLL_RESPONDENTS;

  return { attendees, polls, pollRespondents, qna, chat, feedback, meta };
}

// ---------------------------------------------------------------------------
// Fetch a report from URL with TTL cache
// ---------------------------------------------------------------------------

async function fetchSlicesFromUrl(reportUrl: string): Promise<ReportSlices> {
  const resolved = resolveReportUrl(reportUrl);

  const cached = urlCache.get(resolved);
  if (cached && Date.now() < cached.expiresAt) return cached.slices;

  const res = await fetch(resolved);
  if (!res.ok) throw new Error(`Failed to fetch report from ${resolved}: ${res.status}`);
  const report = await res.json();
  const slices = transformReport(report);
  urlCache.set(resolved, { slices, expiresAt: Date.now() + CACHE_TTL_MS });
  return slices;
}

// ---------------------------------------------------------------------------
// Per-request async accessors — return empty data when no reportUrl given
// ---------------------------------------------------------------------------

export async function getAttendeesForRequest(reportUrl?: string): Promise<any[]> {
  if (!reportUrl) return [];
  return (await fetchSlicesFromUrl(reportUrl)).attendees;
}

export async function getFeedbackForRequest(reportUrl?: string): Promise<any[]> {
  if (!reportUrl) return [];
  return (await fetchSlicesFromUrl(reportUrl)).feedback;
}

export async function getPollsForRequest(reportUrl?: string): Promise<any[]> {
  if (!reportUrl) return [];
  return (await fetchSlicesFromUrl(reportUrl)).polls;
}

export async function getPollRespondentsForRequest(reportUrl?: string): Promise<PollRespondents> {
  if (!reportUrl) return EMPTY_POLL_RESPONDENTS;
  return (await fetchSlicesFromUrl(reportUrl)).pollRespondents;
}

export async function getQnaForRequest(reportUrl?: string): Promise<any> {
  if (!reportUrl) return EMPTY_QNA;
  return (await fetchSlicesFromUrl(reportUrl)).qna;
}

export async function getChatForRequest(reportUrl?: string): Promise<any> {
  if (!reportUrl) return EMPTY_CHAT;
  return (await fetchSlicesFromUrl(reportUrl)).chat;
}

export async function getMetaForRequest(reportUrl?: string): Promise<any> {
  if (!reportUrl) return {};
  return (await fetchSlicesFromUrl(reportUrl)).meta;
}
