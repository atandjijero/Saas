import { Controller, Get, Query, UseGuards, Request, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StatsService } from './stats.service';

@Controller('stats')
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(private statsService: StatsService) {}

  @Get('revenue/:tenantId')
  getRevenue(@Param('tenantId') tenantId: string, @Query('startDate') startDate: string, @Query('endDate') endDate: string, @Request() req) {
    return this.statsService.getRevenue(tenantId, startDate, endDate, req.user);
  }

  @Get('all-revenue')
  getAllTenantsRevenue(@Request() req) {
    return this.statsService.getAllTenantsRevenue(req.user);
  }
}