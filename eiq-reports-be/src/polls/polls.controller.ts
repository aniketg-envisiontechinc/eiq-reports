import { Controller, Get, Query } from '@nestjs/common';
import { PollsService } from './polls.service';

@Controller('polls')
export class PollsController {
  constructor(private readonly pollsService: PollsService) {}

  @Get()
  getPolls(@Query('reportUrl') reportUrl?: string) {
    return this.pollsService.getPolls(reportUrl);
  }
}
