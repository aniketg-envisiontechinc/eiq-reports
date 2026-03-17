export interface ReportMeta {
  eventId: string | null;
  webinarId: string | null;
  webinarRoomId: string | null;
  organizationId: string | null;
  eventTitle: string | null;
  eventTimezone: string | null;
  generatedAt: string | null;
  reportVersion: string | null;
}

export interface DashboardStats {
  totalRegistrants: number;
  totalAttendees: number;
  conversionRate: number;
  avgMinutesViewed: number;
  eventDurationMin: number;
  questionsAsked: number;
  pollQuestionsAnswered: number;
  registrationTimeline: { date: string; count: number }[];
  registrationSource: { source: string; count: number }[];
  onDemandRegistrants: number;
  onDemandVideoPlays: number;
}

export interface AttendeeSession {
  joinTime: string | null;
  leaveTime: string | null;
  durationSeconds: number;
}

export interface Attendee {
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  jobTitle: string;
  programName: string;
  source: string;
  link: string;
  country: string;
  joinTime: string | null;
  leaveTime: string | null;
  duration: number;
  durationSeconds: number;
  sessions: AttendeeSession[];
  webinarJoinStatus: number;
  attendeeUnableJoin: boolean;
  registrationStatus: string;
  participantType: string;
  createdAt: string;
}

export interface AttendeesResponse {
  data: Attendee[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FeedbackEntry {
  eventId: number;
  audioVideoQuality: number;
  easeOfUse: number;
  contentRelevance: number;
  presenterEffectiveness: number;
  userEmail: string;
  additionalComments: string;
  jobTitle?: string;
  createdAt: string;
}

export interface FeedbackResponse {
  data: FeedbackEntry[];
  averageRatings: {
    audioVideoQuality: number;
    easeOfUse: number;
    contentRelevance: number;
    presenterEffectiveness: number;
  };
  totalResponses: number;
}

export interface PollOption {
  key: string;
  label: string;
  count: number;
}

export interface Poll {
  id: string;
  eventId: number;
  questionTitle: string;
  pollType: string;
  options: PollOption[];
  totalVotes: number;
  answeredOptions: PollOption[];
}

export interface QnaQuestion {
  participantName: string;
  participantEmail: string;
  question: string;
  questionId: string;
  answer: string | null;
  status: string;
  createTime: string;
  isAnswered: boolean;
  answerDetails: {
    answeredBy: string;
    answeredByEmail: string;
    content: string;
    answeredAt: string;
    type: string;
  }[];
}

export interface QnaResponse {
  eventId: number;
  startTime: string;
  totalQuestions: number;
  answeredCount: number;
  unansweredCount: number;
  questions: QnaQuestion[];
}
