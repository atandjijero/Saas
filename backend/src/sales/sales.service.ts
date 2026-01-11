import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppGateway } from '../gateway/app.gateway';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService, private gateway: AppGateway) {}

  async create(tenantId: string, items: { productId: string; quantity: number }[], user: any) {
    if (!['VENDEUR', 'DIRECTEUR'].includes(user.role)) {
      throw new ForbiddenException('Only VENDEUR and DIRECTEUR can create sales');
    }
    if (user.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }

    // Use transaction to ensure atomicity
    return this.prisma.$transaction(async (tx) => {
      let total = 0;
      const saleItems = [];

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId, tenantId },
        });
        if (!product) throw new BadRequestException('Product not found');
        if (product.stock < item.quantity) throw new BadRequestException('Insufficient stock');

        total += product.price * item.quantity;
        saleItems.push({
          productId: item.productId,
          quantity: item.quantity,
          price: product.price,
        });

        // Deduct stock
        const newStock = product.stock - item.quantity;
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: newStock },
        });

        // Emit stock update
        this.gateway.emitStockUpdate(tenantId, item.productId, newStock);
      }

      const sale = await tx.sale.create({
        data: {
          userId: user.id,
          tenantId,
          total,
          items: {
            create: saleItems,
          },
        },
        include: { items: true },
      });

      return sale;
    });
  }

  async findAll(tenantId: string, user: any) {
    if (user.tenantId !== tenantId && user.role !== 'SUPERADMIN') {
      throw new ForbiddenException('Access denied');
    }
    return this.prisma.sale.findMany({
      where: { tenantId },
      include: { items: { include: { product: true } } },
    });
  }
}