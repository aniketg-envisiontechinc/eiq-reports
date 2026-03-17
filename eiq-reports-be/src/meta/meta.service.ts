import { Injectable } from '@nestjs/common';
import { getMetaForRequest } from '../common/data-loader';

@Injectable()
export class MetaService {
  async getMeta(reportUrl?: string) {
    const meta = await getMetaForRequest(reportUrl);
    return {
      eventId: meta.eventId ?? null,
      webinarId: meta.webinarId ?? null,
      webinarRoomId: meta.webinarRoomId ?? null,
      organizationId: meta.organizationId ?? null,
      eventTitle: meta.eventTitle ?? null,
      eventTimezone: meta.eventTimezone ?? null,
      generatedAt: meta.generatedAt ?? null,
      reportVersion: meta.reportVersion ?? null,
    };
  }
}
