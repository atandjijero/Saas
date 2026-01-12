import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from './dto/create-subscription.dto';

@Controller('subscriptions')
@ApiBearerAuth()
@ApiTags('subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  @Roles('SUPERADMIN')
  @ApiOperation({ summary: 'Récupérer tous les abonnements' })
  @ApiResponse({ status: 200, description: 'Liste des abonnements récupérée avec succès' })
  findAll() {
    return this.subscriptionsService.findAll();
  }

  @Get('tenant/:tenantId')
  @Roles('SUPERADMIN', 'DIRECTEUR')
  @ApiOperation({ summary: 'Récupérer l\'abonnement d\'un tenant' })
  @ApiResponse({ status: 200, description: 'Abonnement récupéré avec succès' })
  @ApiResponse({ status: 404, description: 'Abonnement non trouvé' })
  findByTenant(@Param('tenantId') tenantId: string) {
    return this.subscriptionsService.findByTenant(tenantId);
  }

  @Get(':id')
  @Roles('SUPERADMIN')
  @ApiOperation({ summary: 'Récupérer un abonnement par ID' })
  @ApiResponse({ status: 200, description: 'Abonnement récupéré avec succès' })
  @ApiResponse({ status: 404, description: 'Abonnement non trouvé' })
  findOne(@Param('id') id: string) {
    return this.subscriptionsService.findOne(id);
  }

  @Post()
  @Roles('SUPERADMIN')
  @ApiOperation({ summary: 'Créer un nouvel abonnement' })
  @ApiResponse({ status: 201, description: 'Abonnement créé avec succès' })
  create(@Body() createSubscriptionDto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(createSubscriptionDto);
  }

  @Patch(':id')
  @Roles('SUPERADMIN')
  @ApiOperation({ summary: 'Mettre à jour un abonnement' })
  @ApiResponse({ status: 200, description: 'Abonnement mis à jour avec succès' })
  update(@Param('id') id: string, @Body() updateSubscriptionDto: UpdateSubscriptionDto) {
    return this.subscriptionsService.update(id, updateSubscriptionDto);
  }

  @Delete(':id')
  @Roles('SUPERADMIN')
  @ApiOperation({ summary: 'Supprimer un abonnement' })
  @ApiResponse({ status: 200, description: 'Abonnement supprimé avec succès' })
  remove(@Param('id') id: string) {
    return this.subscriptionsService.remove(id);
  }
}