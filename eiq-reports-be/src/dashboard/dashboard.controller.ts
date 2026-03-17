import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getDashboard(@Query('reportUrl') reportUrl?: string) {
    return this.dashboardService.getDashboardStats(reportUrl);
  }
}
