# SaaS Commercial Management Platform

A comprehensive multi-tenant SaaS platform for commercial management, built with Next.js 14, NestJS, Prisma, and PostgreSQL.

## 🚀 Features

### Core Functionality
- **Multi-tenant Architecture**: Complete tenant isolation with dedicated domains
- **User Management**: Role-based access control (SUPERADMIN, DIRECTEUR, GERANT, VENDEUR, MAGASINIER)
- **Product Management**: CRUD operations with real-time stock tracking
- **Sales Management**: Complete sales processing with itemized transactions
- **Revenue Analytics**: Comprehensive statistics and reporting
- **Subscription Management**: Flexible pricing plans (FREE, BASIC, PROFESSIONAL, ENTERPRISE)

### Security & Authentication
- **JWT Authentication**: Secure token-based authentication
- **Two-Factor Authentication (2FA)**: Mandatory for SUPERADMIN and DIRECTEUR roles using QR codes
- **Password Reset**: Email-based password recovery with HTML templates
- **Rate Limiting**: Protection against brute force attacks
- **Role-Based Guards**: Granular access control

### Real-Time Features
- **WebSocket Integration**: Real-time stock updates across all connected clients
- **Live Notifications**: Instant updates for inventory changes

### API & Documentation
- **RESTful API**: Complete REST API with NestJS
- **Swagger Documentation**: Interactive API documentation at `/api`
- **OpenAPI Specification**: Auto-generated API specs

### Internationalization
- **Multi-language Support**: French, English, Spanish, German
- **Dynamic Language Switching**: Runtime language changes

### Technical Stack
- **Frontend**: Next.js 14 with App Router, Tailwind CSS, Radix UI
- **Backend**: NestJS with modular architecture
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Socket.io for WebSocket communication
- **Caching**: Redis for session management and caching
- **Email**: Nodemailer for transactional emails
- **Deployment**: Docker Compose for containerized deployment

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives
- **State Management**: Zustand
- **Charts**: Recharts
- **Real-time**: Socket.io Client
- **Internationalization**: Custom i18n implementation

### Backend
- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: Passport.js with JWT strategy
- **Validation**: Class-validator
- **Documentation**: Swagger/OpenAPI
- **Rate Limiting**: @nestjs/throttler
- **WebSockets**: Socket.io
- **Email**: Nodemailer

### Infrastructure
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: Nginx (implied in docker setup)

## 📋 Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (handled by Docker)
- Redis (handled by Docker)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Saas
```

### 2. Environment Setup
Create environment files:

**Backend (.env)**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/saas_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
REDIS_URL="redis://localhost:6379"
FRONTEND_URL="http://localhost:3000"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
PORT=5000
```

**Frontend (.env.local)**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=http://localhost:5000
```

### 3. Start with Docker Compose
```bash
# Start all services (PostgreSQL, Redis, Backend, Frontend)
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

### 4. Database Setup
```bash
# Generate Prisma client
cd backend
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed the database
npm run seed
```

### 5. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api
- **Database Studio**: `npm run prisma:studio` (from backend directory)

## 🔐 Default Test Accounts

After seeding, you can use these accounts:

### Super Admin
- **Email**: superadmin@example.com
- **Password**: superadmin123
- **Role**: SUPERADMIN (full access)

### Tenant Admin (Director)
- **Email**: director@example.com
- **Password**: director123
- **Role**: DIRECTEUR
- **Tenant**: Example Corp

### Manager
- **Email**: manager@example.com
- **Password**: manager123
- **Role**: GERANT
- **Tenant**: Example Corp

### Employee (Seller)
- **Email**: employee@example.com
- **Password**: employee123
- **Role**: VENDEUR
- **Tenant**: Example Corp

### Stock Manager
- **Email**: stock@example.com
- **Password**: stock123
- **Role**: MAGASINIER
- **Tenant**: Example Corp

## 📚 API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with token
- `POST /auth/verify-2fa` - Verify 2FA code
- `POST /auth/setup-2fa` - Setup 2FA

### Products
- `GET /products/:tenantId` - Get all products for tenant
- `POST /products/:tenantId` - Create new product
- `PATCH /products/:tenantId/:productId` - Update product
- `DELETE /products/:tenantId/:productId` - Delete product

### Sales
- `GET /sales/:tenantId` - Get all sales for tenant
- `POST /sales/:tenantId` - Create new sale

### Users
- `GET /users/:tenantId` - Get all users for tenant
- `POST /users/:tenantId` - Create new user
- `PATCH /users/:tenantId/:userId` - Update user
- `DELETE /users/:tenantId/:userId` - Delete user

### Statistics
- `GET /stats/revenue/:tenantId` - Get revenue stats for tenant
- `GET /stats/all-revenue` - Get revenue for all tenants (SUPERADMIN only)

### Subscriptions
- `GET /subscriptions` - Get all subscriptions (SUPERADMIN only)
- `GET /subscriptions/tenant/:tenantId` - Get subscription for tenant
- `POST /subscriptions` - Create subscription (SUPERADMIN only)
- `PATCH /subscriptions/:id` - Update subscription (SUPERADMIN only)

### Tenants
- `GET /tenants` - Get all tenants (SUPERADMIN only)
- `POST /tenants` - Create new tenant (SUPERADMIN only)

## 🔧 Development

### Backend Development
```bash
cd backend
npm install
npm run start:dev
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Database Management
```bash
# View database in browser
npm run prisma:studio

# Create new migration
npm run prisma:migrate

# Reset database
npm run prisma:migrate reset --force
```

## 🧪 Testing

```bash
# Backend tests
cd backend
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📦 Deployment

### Production Docker Build
```bash
# Build for production
docker-compose -f docker-compose.prod.yml up --build
```

### Environment Variables for Production
Ensure these are set in your production environment:
- `DATABASE_URL` - Production PostgreSQL connection
- `JWT_SECRET` - Strong secret key
- `REDIS_URL` - Production Redis instance
- `EMAIL_*` - Production SMTP settings
- `FRONTEND_URL` - Your domain name

## 🌐 Multi-tenancy

The platform supports multiple tenants with complete data isolation:

- Each tenant has its own domain/subdomain
- Data is segregated by `tenantId` across all entities
- Users can only access data from their assigned tenant
- SUPERADMIN can access all tenants' data

## 🔒 Security Features

- **JWT Tokens**: Secure authentication with expiration
- **2FA**: QR code-based two-factor authentication
- **Rate Limiting**: Prevents brute force attacks
- **Password Hashing**: bcrypt with salt rounds
- **CORS**: Configured for frontend origin
- **Input Validation**: Class-validator decorators
- **SQL Injection Protection**: Prisma ORM safeguards

## 📧 Email Configuration

The platform sends HTML emails for password reset. Configure your SMTP settings in the backend `.env` file.

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first approach
- **Dark/Light Theme**: User preference persistence
- **Internationalization**: 4 languages supported
- **Real-time Updates**: WebSocket-powered live data
- **Charts & Analytics**: Revenue visualization
- **Modern UI**: Clean, professional interface

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please contact the development team or create an issue in the repository.