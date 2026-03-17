import { Injectable } from '@nestjs/common';
import { getFeedbackForRequest } from '../common/data-loader';

@Injectable()
export class FeedbackService {
  async getFeedback(reportUrl?: string) {
    const data = await getFeedbackForRequest(reportUrl);

    const fields = [
      'audioVideoQuality',
      'easeOfUse',
      'contentRelevance',
      'presenterEffectiveness',
    ] as const;

    const averageRatings: Record<string, number> = {};
    fields.forEach((field) => {
      const values = data.filter((f) => f[field] != null).map((f) => f[field]);
      averageRatings[field] =
        values.length > 0
          ? parseFloat((values.reduce((s, v) => s + v, 0) / values.length).toFixed(2))
          : 0;
    });

    return {
      data,
      averageRatings,
      totalResponses: data.length,
    };
  }
}
