import { Controller, Get, Query } from '@nestjs/common';
import { MetaService } from './meta.service';

@Controller('meta')
export class MetaController {
  constructor(private readonly metaService: MetaService) {}

  @Get()
  getMeta(@Query('reportUrl') reportUrl?: string) {
    return this.metaService.getMeta(reportUrl);
  }
}
