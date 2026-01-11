import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, user: any) {
    if (user.role !== 'DIRECTEUR' && user.role !== 'GERANT' && user.role !== 'VENDEUR' && user.role !== 'SUPERADMIN') {
      throw new ForbiddenException('Insufficient permissions');
    }
    // SUPERADMIN can view users in any tenant, but others can only view in their own tenant
    if (user.role !== 'SUPERADMIN' && user.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }
    return this.prisma.user.findMany({
      where: { tenantId },
      select: { id: true, email: true, role: true, createdAt: true },
    });
  }

  async create(tenantId: string, email: string, password: string, role: string, user: any) {
    if (user.role !== 'DIRECTEUR' && user.role !== 'SUPERADMIN') {
      throw new ForbiddenException('Insufficient permissions');
    }
    // SUPERADMIN can create users in any tenant, but DIRECTEUR can only create in their own tenant
    if (user.role !== 'SUPERADMIN' && user.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    return this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: role as any,
        tenantId,
      },
      select: { id: true, email: true, role: true },
    });
  }

  async update(tenantId: string, userId: string, email: string, role: string, user: any) {
    if (user.role !== 'DIRECTEUR' && user.role !== 'SUPERADMIN') {
      throw new ForbiddenException('Insufficient permissions');
    }
    // SUPERADMIN can update users in any tenant, but DIRECTEUR can only update in their own tenant
    if (user.role !== 'SUPERADMIN' && user.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }
    return this.prisma.user.update({
      where: { id: userId, tenantId },
      data: { email, role: role as any },
      select: { id: true, email: true, role: true },
    });
  }

  async remove(tenantId: string, userId: string, user: any) {
    if (user.role !== 'DIRECTEUR' && user.role !== 'SUPERADMIN') {
      throw new ForbiddenException('Insufficient permissions');
    }
    // SUPERADMIN can delete users in any tenant, but DIRECTEUR can only delete in their own tenant
    if (user.role !== 'SUPERADMIN' && user.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }
    return this.prisma.user.delete({
      where: { id: userId, tenantId },
    });
  }
}