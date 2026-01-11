import { Controller, Get, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SalesService } from './sales.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CreateSaleDto } from './dto/create-sale.dto';

@ApiTags('sales')
@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(private salesService: SalesService) {}

  @Post(':tenantId')
  @ApiOperation({ summary: 'Create sale' })
  create(@Param('tenantId') tenantId: string, @Body() body: CreateSaleDto, @Request() req) {
    return this.salesService.create(tenantId, body.items, req.user);
  }

  @Get(':tenantId')
  findAll(@Param('tenantId') tenantId: string, @Request() req) {
    return this.salesService.findAll(tenantId, req.user);
  }
}