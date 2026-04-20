import { Injectable } from '@nestjs/common';
import { getPollsForRequest, getPollRespondentsForRequest } from '../common/data-loader';

@Injectable()
export class PollsService {
  async getPolls(reportUrl?: string) {
    const [polls, respondentsData] = await Promise.all([
      getPollsForRequest(reportUrl),
      getPollRespondentsForRequest(reportUrl),
    ]);

    // Build pollId → distinct emails (preserve insertion order).
    const emailsByPoll = new Map<string, string[]>();
    const seenByPoll   = new Map<string, Set<string>>();
    for (const r of respondentsData.respondents) {
      if (!r.email) continue;
      for (const pollId of Object.keys(r.answers || {})) {
        if (!emailsByPoll.has(pollId)) {
          emailsByPoll.set(pollId, []);
          seenByPoll.set(pollId, new Set());
        }
        const seen = seenByPoll.get(pollId)!;
        const key = r.email.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          emailsByPoll.get(pollId)!.push(r.email);
        }
      }
    }

    return polls.map((poll) => {
      const optionsList = Object.entries(poll.options || {}).map(([key, label]) => ({
        key,
        label: label as string,
        count: (poll.results && poll.results[key]) || 0,
      }));

      const totalVotes = optionsList.reduce((sum, opt) => sum + opt.count, 0);

      return {
        id: poll._id,
        eventId: poll.eventId,
        questionTitle: poll.questionTitle,
        pollType: poll.pollType,
        options: optionsList,
        totalVotes,
        answeredOptions: optionsList.filter((o) => o.count > 0),
        respondentEmails: emailsByPoll.get(poll._id) ?? [],
      };
    });
  }

  /**
   * Per-respondent poll answers, sourced from the generator report JSON
   * (report.pollRespondents). Populated from report version 2 onward.
   */
  async exportPollRespondents(reportUrl?: string) {
    return getPollRespondentsForRequest(reportUrl);
  }
}
