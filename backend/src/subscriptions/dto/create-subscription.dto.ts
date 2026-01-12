import { IsString, IsNumber, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubscriptionDto {
  @ApiProperty({
    description: 'ID du tenant pour lequel créer l\'abonnement',
    example: 'cmka0i4uz0000lb97z0he81k5',
  })
  @IsString()
  tenantId: string;

  @ApiProperty({
    description: 'Nom du plan d\'abonnement',
    example: 'Professional',
  })
  @IsString()
  planName: string;

  @ApiProperty({
    description: 'Type du plan (FREE, BASIC, PROFESSIONAL, ENTERPRISE)',
    example: 'PROFESSIONAL',
  })
  @IsString()
  planType: string;

  @ApiProperty({
    description: 'Prix mensuel de l\'abonnement',
    example: 49.99,
  })
  @IsNumber()
  price: number;

  @ApiProperty({
    description: 'Nombre maximum d\'utilisateurs autorisés',
    example: 10,
  })
  @IsNumber()
  maxUsers: number;

  @ApiProperty({
    description: 'Nombre maximum de produits autorisés',
    example: 1000,
  })
  @IsNumber()
  maxProducts: number;

  @ApiProperty({
    description: 'Liste des fonctionnalités incluses',
    example: ['Gestion des ventes', 'Rapports avancés', 'Support prioritaire'],
  })
  @IsArray()
  @IsString({ each: true })
  features: string[];
}

export class UpdateSubscriptionDto {
  @ApiProperty({
    description: 'Nom du plan d\'abonnement',
    required: false,
  })
  @IsOptional()
  @IsString()
  planName?: string;

  @ApiProperty({
    description: 'Type du plan',
    required: false,
  })
  @IsOptional()
  @IsString()
  planType?: string;

  @ApiProperty({
    description: 'Prix mensuel de l\'abonnement',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiProperty({
    description: 'Nombre maximum d\'utilisateurs',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  maxUsers?: number;

  @ApiProperty({
    description: 'Nombre maximum de produits',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  maxProducts?: number;

  @ApiProperty({
    description: 'Liste des fonctionnalités',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiProperty({
    description: 'Statut de l\'abonnement',
    required: false,
  })
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'Date de fin de l\'abonnement',
    required: false,
  })
  @IsOptional()
  endDate?: Date;
}