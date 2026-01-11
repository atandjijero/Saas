# SaaS Commercial Management Platform

A multi-tenant SaaS platform for commercial management with role-based access control (RBAC), real-time sales, and Docker deployment.

## Features

- **Multi-Tenant Architecture**: Isolated data per commerce/tenant
- **Role-Based Access Control**: SUPERADMIN, DIRECTEUR, GERANT, VENDEUR, MAGASINIER
- **Real-Time Sales**: WebSocket updates for stock changes
- **2FA Authentication**: Mandatory for SUPERADMIN and DIRECTEUR
- **Atomic Transactions**: Stock deduction with PostgreSQL transactions
- **Statistics Dashboard**: Revenue analytics per tenant

## Tech Stack

- **Backend**: NestJS, Prisma, PostgreSQL, Socket.io
- **Frontend**: Next.js, Tailwind CSS, shadcn/ui, Zustand
- **Infrastructure**: Docker, Redis

## Setup

1. Clone the repository
2. Run `docker-compose up --build`
3. The application will be available at:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Database Setup

1. Run migrations: `docker-compose exec backend npm run prisma:migrate`
2. Generate Prisma client: `docker-compose exec backend npm run prisma:generate`
3. Seed data: `docker-compose exec backend npm run seed`

## Test Accounts

- **Superadmin**: superadmin@example.com / admin123
- **Director 1**: director1@example.com / admin123 (Store 1)
- **Director 2**: director2@example.com / admin123 (Store 2)

## API Endpoints

### Authentication
- POST /auth/login
- POST /auth/register
- POST /auth/setup-2fa
- POST /auth/verify-2fa
- POST /auth/enable-2fa

### Tenants (Superadmin only)
- POST /tenants
- GET /tenants

### Users
- GET /users/:tenantId
- POST /users/:tenantId
- PATCH /users/:tenantId/:userId
- DELETE /users/:tenantId/:userId

### Products
- GET /products/:tenantId
- POST /products/:tenantId
- PATCH /products/:tenantId/:productId
- DELETE /products/:tenantId/:productId

### Sales
- POST /sales/:tenantId
- GET /sales/:tenantId

### Statistics
- GET /stats/revenue/:tenantId
- GET /stats/all-revenue

## Roles and Permissions

- **SUPERADMIN**: Manage tenants, view all stats
- **DIRECTEUR**: Manage users and team, view tenant stats
- **GERANT**: Manage products and sales
- **VENDEUR**: Create sales
- **MAGASINIER**: Update product stock

## Security

- JWT authentication
- 2FA for admin roles
- Rate limiting on tenant creation
- Tenant data isolation
- Atomic stock updates

## Development

### Backend
```bash
cd backend
npm install
npm run start:dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Database
```bash
cd backend
npx prisma studio
```