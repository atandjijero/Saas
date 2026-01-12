import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.subscription.findMany({
      include: {
        tenant: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.subscription.findUnique({
      where: { id },
      include: {
        tenant: true,
      },
    });
  }

  async findByTenant(tenantId: string) {
    return this.prisma.subscription.findUnique({
      where: { tenantId },
      include: {
        tenant: true,
      },
    });
  }

  async create(data: {
    tenantId: string;
    planName: string;
    planType: string;
    price: number;
    maxUsers: number;
    maxProducts: number;
    features: string[];
  }) {
    // Validate input
    if (!data || !data.tenantId) {
      throw new BadRequestException('tenantId is required');
    }

    // Ensure tenant exists
    const tenant = await this.prisma.tenant.findUnique({ where: { id: data.tenantId } });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Prevent duplicate subscription for same tenant
    const existing = await this.prisma.subscription.findUnique({ where: { tenantId: data.tenantId } });
    if (existing) {
      throw new ConflictException('Tenant already has a subscription');
    }

    return this.prisma.subscription.create({
      data: {
        tenantId: data.tenantId,
        planName: data.planName,
        planType: data.planType,
        price: data.price,
        maxUsers: data.maxUsers,
        maxProducts: data.maxProducts,
        features: data.features,
      },
      include: {
        tenant: true,
      },
    });
  }

  async update(id: string, data: Partial<{
    planName: string;
    planType: string;
    price: number;
    maxUsers: number;
    maxProducts: number;
    features: string[];
    isActive: boolean;
    endDate: Date;
  }>) {
    return this.prisma.subscription.update({
      where: { id },
      data,
      include: {
        tenant: true,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.subscription.delete({
      where: { id },
    });
  }
}