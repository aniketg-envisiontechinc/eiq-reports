import { Injectable } from '@nestjs/common';
import { getAttendeesForRequest, getQnaForRequest, getPollsForRequest } from '../common/data-loader';

@Injectable()
export class DashboardService {
  async getDashboardStats(reportUrl?: string) {
    const [attendees, qna, polls] = await Promise.all([
      getAttendeesForRequest(reportUrl),
      getQnaForRequest(reportUrl),
      getPollsForRequest(reportUrl),
    ]);

    // Only count actual attendees (exclude host, speaker, panelist, etc.)
    const attendeeOnly = attendees.filter(
      (a) => !a.participantType || a.participantType === 'attendee',
    );

    const totalRegistrants = attendeeOnly.length;

    // Attendees who actually joined (have joinTime)
    const joinedAttendees = attendeeOnly.filter((a) => a.joinTime);
    const totalAttendees = joinedAttendees.length;

    // Conversion rate
    const conversionRate =
      totalRegistrants > 0
        ? parseFloat(((totalAttendees / totalRegistrants) * 100).toFixed(2))
        : 0;

    // Avg minutes viewed
    const durationsWithValue = joinedAttendees.filter(
      (a) => a.duration && Number(a.duration) > 0,
    );
    const avgMinutesViewed =
      durationsWithValue.length > 0
        ? parseFloat(
            (
              durationsWithValue.reduce((sum, a) => sum + Number(a.duration), 0) /
              durationsWithValue.length
            ).toFixed(2),
          )
        : 0;

    // Questions asked from QnA
    const questionsAsked = qna.questions
      ? qna.questions.reduce(
          (sum: number, q: any) => sum + (q.question_details?.length || 0),
          0,
        )
      : 0;

    // Poll questions with responses
    const pollQuestionsAnswered = polls.filter(
      (p) => p.results && Object.keys(p.results).length > 0,
    ).length;

    // Registration timeline
    const timelineMap: Record<string, number> = {};
    attendeeOnly.forEach((a) => {
      if (a.createdAt) {
        const date = a.createdAt.split('T')[0];
        timelineMap[date] = (timelineMap[date] || 0) + 1;
      }
    });
    const registrationTimeline = Object.entries(timelineMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Registration source
    const sourceMap: Record<string, number> = {};
    attendeeOnly.forEach((a) => {
      const source = a.source || 'unknown';
      sourceMap[source] = (sourceMap[source] || 0) + 1;
    });
    const registrationSource = Object.entries(sourceMap)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);

    // Event duration
    let eventDurationMin = 0;
    const joinTimes = joinedAttendees.filter((a) => a.joinTime).map((a) => new Date(a.joinTime).getTime());
    const leaveTimes = joinedAttendees.filter((a) => a.leaveTime).map((a) => new Date(a.leaveTime).getTime());
    if (joinTimes.length > 0 && leaveTimes.length > 0) {
      eventDurationMin = Math.round((Math.max(...leaveTimes) - Math.min(...joinTimes)) / 60000);
    }

    return {
      totalRegistrants,
      totalAttendees,
      conversionRate,
      avgMinutesViewed,
      eventDurationMin,
      questionsAsked,
      pollQuestionsAnswered,
      registrationTimeline,
      registrationSource,
      onDemandRegistrants: 0,
      onDemandVideoPlays: 0,
    };
  }
}
