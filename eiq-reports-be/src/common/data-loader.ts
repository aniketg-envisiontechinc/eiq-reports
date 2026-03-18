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

interface ReportSlices {
  attendees: any[];
  polls: any[];
  qna: any;
  chat: any;
  feedback: any[];
  meta: ReportMeta;
}

const urlCache = new Map<string, { slices: ReportSlices; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute

// ---------------------------------------------------------------------------
// Empty defaults — returned when no reportUrl is provided
// ---------------------------------------------------------------------------

const EMPTY_QNA = { id: '', start_time: null, questions: [] };
const EMPTY_CHAT = { totalMessages: 0, messages: [] };

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

  return { attendees, polls, qna, chat, feedback, meta };
}

// ---------------------------------------------------------------------------
// Fetch a report from URL with TTL cache
// ---------------------------------------------------------------------------

async function fetchSlicesFromUrl(reportUrl: string): Promise<ReportSlices> {
  const cached = urlCache.get(reportUrl);
  if (cached && Date.now() < cached.expiresAt) return cached.slices;

  const res = await fetch(reportUrl);
  if (!res.ok) throw new Error(`Failed to fetch report from ${reportUrl}: ${res.status}`);
  const report = await res.json();
  const slices = transformReport(report);
  urlCache.set(reportUrl, { slices, expiresAt: Date.now() + CACHE_TTL_MS });
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
