import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create superadmin
  const hashedPassword = await bcrypt.hash('admin', 10);
  const superadmin = await prisma.user.upsert({
    where: { email: 'superadmin@example.com' },
    update: { password: hashedPassword },
    create: {
      email: 'superadmin@example.com',
      password: hashedPassword,
      role: 'SUPERADMIN',
    },
  });

  // Create two tenants
  const tenant1 = await prisma.tenant.upsert({
    where: { domain: 'store1.example.com' },
    update: {},
    create: {
      name: 'Store 1',
      domain: 'store1.example.com',
    },
  });

  const tenant2 = await prisma.tenant.upsert({
    where: { domain: 'store2.example.com' },
    update: {},
    create: {
      name: 'Store 2',
      domain: 'store2.example.com',
    },
  });

  // Create directors
  const director1 = await prisma.user.upsert({
    where: { email: 'director1@example.com' },
    update: { password: hashedPassword },
    create: {
      email: 'director1@example.com',
      password: hashedPassword,
      role: 'DIRECTEUR',
      tenantId: tenant1.id,
    },
  });

  const director2 = await prisma.user.upsert({
    where: { email: 'director2@example.com' },
    update: { password: hashedPassword },
    create: {
      email: 'director2@example.com',
      password: hashedPassword,
      role: 'DIRECTEUR',
      tenantId: tenant2.id,
    },
  });

  // Create sellers
  const seller1 = await prisma.user.upsert({
    where: { email: 'seller1@example.com' },
    update: { password: hashedPassword },
    create: {
      email: 'seller1@example.com',
      password: hashedPassword,
      role: 'VENDEUR',
      tenantId: tenant1.id,
    },
  });

  const seller2 = await prisma.user.upsert({
    where: { email: 'seller2@example.com' },
    update: { password: hashedPassword },
    create: {
      email: 'seller2@example.com',
      password: hashedPassword,
      role: 'VENDEUR',
      tenantId: tenant2.id,
    },
  });

  // Create some products
  await prisma.product.upsert({
    where: { id: 'prod1' },
    update: {},
    create: {
      id: 'prod1',
      name: 'Product 1',
      description: 'Description 1',
      price: 10.0,
      stock: 100,
      tenantId: tenant1.id,
    },
  });

  await prisma.product.upsert({
    where: { id: 'prod2' },
    update: {},
    create: {
      id: 'prod2',
      name: 'Product 2',
      description: 'Description 2',
      price: 20.0,
      stock: 50,
      tenantId: tenant1.id,
    },
  });

  console.log('Seed data created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });