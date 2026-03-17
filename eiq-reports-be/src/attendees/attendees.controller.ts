import { Controller, Get, Query } from '@nestjs/common';
import { AttendeesService } from './attendees.service';

@Controller('attendees')
export class AttendeesController {
  constructor(private readonly attendeesService: AttendeesService) {}

  @Get()
  getAttendees(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search = '',
    @Query('reportUrl') reportUrl?: string,
  ) {
    return this.attendeesService.getAttendees(
      parseInt(page, 10),
      parseInt(limit, 10),
      search,
      reportUrl,
    );
  }
}
