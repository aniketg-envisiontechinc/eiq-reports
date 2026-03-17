import { Injectable } from '@nestjs/common';
import { getAttendeesForRequest } from '../common/data-loader';

@Injectable()
export class AttendeesService {
  async getAttendees(page: number, limit: number, search: string, reportUrl?: string) {
    let data = await getAttendeesForRequest(reportUrl);

    // Sanitize - remove sensitive fields
    data = data.map((a) => ({
      email: a.email || '',
      firstName: a.firstName || '',
      lastName: a.lastName || '',
      company: a.company || '',
      jobTitle: a.jobTitle || a.jobTitle_1 || '',
      programName: a.programName || '',
      source: a.source || '',
      link: a.link || '',
      country: a.country || '',
      joinTime: a.joinTime || null,
      leaveTime: a.leaveTime || null,
      duration: a.duration || 0,
      durationSeconds: a.durationSeconds || 0,
      sessions: Array.isArray(a.sessions) ? a.sessions : [],
      webinarJoinStatus: a.webinarJoinStatus || 0,
      attendeeUnableJoin: a.attendeeUnableJoin || false,
      registrationStatus: a.registrationStatus || '',
      participantType: a.participantType || '',
      createdAt: a.createdAt || '',
    }));

    // Search filter
    if (search && search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (a) =>
          a.email.toLowerCase().includes(q) ||
          a.firstName.toLowerCase().includes(q) ||
          a.lastName.toLowerCase().includes(q) ||
          a.company.toLowerCase().includes(q) ||
          a.jobTitle.toLowerCase().includes(q),
      );
    }

    const total = data.length;
    const offset = (page - 1) * limit;
    const paginatedData = data.slice(offset, offset + limit);

    return {
      data: paginatedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
