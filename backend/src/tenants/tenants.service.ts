import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async create(name: string, domain: string) {
    const existing = await this.prisma.tenant.findUnique({ where: { domain } });
    if (existing) throw new BadRequestException('Domain already taken');

    return this.prisma.tenant.create({
      data: { name, domain },
    });
  }

  async findAll() {
    return this.prisma.tenant.findMany();
  }
}