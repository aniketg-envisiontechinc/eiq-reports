import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

// ---------------------------------------------------------------------------
// Startup caches (populated by initDataLoader or on first local file read)
// ---------------------------------------------------------------------------

let attendeesCache: any[] | null = null;
let feedbackCache: any[] | null = null;
let pollsCache: any[] | null = null;
let qnaCache: any | null = null;
let metaCache: any | null = null;

// ---------------------------------------------------------------------------
// Per-URL in-memory cache (for dynamic report loading per request)
// ---------------------------------------------------------------------------

interface ReportMeta {
  eventId?: string;
  webinarId?: string;
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
  feedback: any[];
  meta: ReportMeta;
}

const urlCache = new Map<string, { slices: ReportSlices; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute

// ---------------------------------------------------------------------------
// Shared transformation (new report JSON → legacy shapes the services expect)
// ---------------------------------------------------------------------------

function transformReport(report: any): ReportSlices {
  const attendees: any[] = Array.isArray(report.attendees) ? report.attendees : [];
  const feedback: any[] = Array.isArray(report.feedback) ? report.feedback : [];

  // Polls: new [{id, questionTitle, pollType, options:[{key,label,count}]}]
  //   → legacy [{_id, eventId, questionTitle, pollType, options:{key:label}, results:{key:count}}]
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

  // QnA: new flat questions array → legacy {id, start_time, questions:[{name,email,question_details[]}]}
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

  return { attendees, polls, qna, feedback, meta };
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
// Remote initialisation (MinIO REPORT_URL env var at startup)
// ---------------------------------------------------------------------------

export async function initDataLoader(): Promise<void> {
  const reportUrl = process.env.REPORT_URL;
  if (!reportUrl) {
    console.log('[DataLoader] REPORT_URL not set — using local JSON files');
    return;
  }

  console.log(`[DataLoader] Fetching report from ${reportUrl}`);
  const res = await fetch(reportUrl);
  if (!res.ok) throw new Error(`[DataLoader] Failed to fetch report: ${res.status} ${res.statusText}`);
  const report: any = await res.json();
  const slices = transformReport(report);

  attendeesCache = slices.attendees;
  feedbackCache = slices.feedback;
  pollsCache = slices.polls;
  qnaCache = slices.qna;
  metaCache = slices.meta;

  console.log(
    `[DataLoader] Loaded from MinIO — attendees: ${attendeesCache.length}, ` +
    `polls: ${pollsCache.length}, qna questions: ${(report.qna?.questions ?? []).length}`,
  );
}

// ---------------------------------------------------------------------------
// Per-request async accessors (fall back to startup caches when no URL given)
// ---------------------------------------------------------------------------

export async function getAttendeesForRequest(reportUrl?: string): Promise<any[]> {
  if (reportUrl) return (await fetchSlicesFromUrl(reportUrl)).attendees;
  return loadAttendees();
}

export async function getFeedbackForRequest(reportUrl?: string): Promise<any[]> {
  if (reportUrl) return (await fetchSlicesFromUrl(reportUrl)).feedback;
  return loadFeedback();
}

export async function getPollsForRequest(reportUrl?: string): Promise<any[]> {
  if (reportUrl) return (await fetchSlicesFromUrl(reportUrl)).polls;
  return loadPolls();
}

export async function getQnaForRequest(reportUrl?: string): Promise<any> {
  if (reportUrl) return (await fetchSlicesFromUrl(reportUrl)).qna;
  return loadQna();
}

export async function getMetaForRequest(reportUrl?: string): Promise<any> {
  if (reportUrl) return (await fetchSlicesFromUrl(reportUrl)).meta;
  return metaCache ?? {};
}

// ---------------------------------------------------------------------------
// Synchronous startup-cache accessors (used when no reportUrl is provided)
// ---------------------------------------------------------------------------

export function loadAttendees(): any[] {
  if (!attendeesCache) {
    const raw = fs.readFileSync(path.join(DATA_DIR, 'attendees.json'), 'utf-8');
    attendeesCache = JSON.parse(raw);
  }
  return attendeesCache;
}

export function loadFeedback(): any[] {
  if (!feedbackCache) {
    const raw = fs.readFileSync(path.join(DATA_DIR, 'audience_feedback.json'), 'utf-8');
    feedbackCache = JSON.parse(raw);
  }
  return feedbackCache;
}

export function loadPolls(): any[] {
  if (!pollsCache) {
    const raw = fs.readFileSync(path.join(DATA_DIR, 'poll_results.json'), 'utf-8');
    pollsCache = JSON.parse(raw);
  }
  return pollsCache;
}

export function loadQna(): any {
  if (!qnaCache) {
    const raw = fs.readFileSync(path.join(DATA_DIR, 'qna_report.json'), 'utf-8');
    qnaCache = JSON.parse(raw);
  }
  return qnaCache;
}
