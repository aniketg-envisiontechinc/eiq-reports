import { Controller, Get, Query } from '@nestjs/common';
import { QnaService } from './qna.service';

@Controller('qna')
export class QnaController {
  constructor(private readonly qnaService: QnaService) {}

  @Get()
  getQna(@Query('reportUrl') reportUrl?: string) {
    return this.qnaService.getQna(reportUrl);
  }
}
