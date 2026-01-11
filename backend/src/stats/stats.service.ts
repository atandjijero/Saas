import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getRevenue(tenantId: string, startDate?: string, endDate?: string, user?: any) {
    if (user.tenantId !== tenantId && user.role !== 'SUPERADMIN') {
      throw new ForbiddenException('Access denied');
    }

    const where: any = { tenantId };
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const result = await this.prisma.sale.aggregate({
      where,
      _sum: {
        total: true,
      },
    });

    return { totalRevenue: result._sum.total || 0 };
  }

  async getAllTenantsRevenue(user: any) {
    if (user.role !== 'SUPERADMIN') {
      throw new ForbiddenException('Access denied');
    }

    const tenants = await this.prisma.tenant.findMany({
      include: {
        sales: {
          select: {
            total: true,
          },
        },
      },
    });

    const stats = tenants.map(tenant => ({
      tenantId: tenant.id,
      name: tenant.name,
      revenue: tenant.sales.reduce((sum, sale) => sum + sale.total, 0),
    }));

    return stats;
  }
}