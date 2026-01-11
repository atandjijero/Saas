import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
// import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TenantsService } from './tenants.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateTenantDto } from './dto/create-tenant.dto';

@ApiTags('tenants')
@ApiBearerAuth()
@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Post()
  @Roles('SUPERADMIN')
  // @Throttle(5, 900) // Temporarily disabled due to version issues
  @ApiOperation({ summary: 'Create tenant' })
  create(@Body() body: CreateTenantDto) {
    return this.tenantsService.create(body.name, body.domain);
  }

  @Get()
  @Roles('SUPERADMIN')
  findAll() {
    return this.tenantsService.findAll();
  }
}