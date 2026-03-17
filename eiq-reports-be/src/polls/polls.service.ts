import { Injectable } from '@nestjs/common';
import { getPollsForRequest } from '../common/data-loader';

@Injectable()
export class PollsService {
  async getPolls(reportUrl?: string) {
    const polls = await getPollsForRequest(reportUrl);

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
      };
    });
  }
}
