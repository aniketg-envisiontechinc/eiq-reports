import { Controller, Get, Query } from '@nestjs/common';
import { FeedbackService } from './feedback.service';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Get()
  getFeedback(@Query('reportUrl') reportUrl?: string) {
    return this.feedbackService.getFeedback(reportUrl);
  }
}
