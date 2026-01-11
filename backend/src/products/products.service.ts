import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, user: any) {
    if (user.tenantId !== tenantId && user.role !== 'SUPERADMIN') {
      throw new ForbiddenException('Access denied');
    }
    return this.prisma.product.findMany({
      where: { tenantId },
    });
  }

  async create(tenantId: string, name: string, description: string, price: number, stock: number, user: any) {
    if (!['DIRECTEUR', 'GERANT', 'MAGASINIER'].includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    if (user.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }
    return this.prisma.product.create({
      data: {
        name,
        description,
        price,
        stock,
        tenantId,
      },
    });
  }

  async update(tenantId: string, productId: string, name: string, description: string, price: number, stock: number, user: any) {
    if (!['DIRECTEUR', 'GERANT', 'MAGASINIER'].includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    if (user.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }
    return this.prisma.product.update({
      where: { id: productId, tenantId },
      data: { name, description, price, stock },
    });
  }

  async remove(tenantId: string, productId: string, user: any) {
    if (!['DIRECTEUR', 'GERANT'].includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    if (user.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }
    return this.prisma.product.delete({
      where: { id: productId, tenantId },
    });
  }
}