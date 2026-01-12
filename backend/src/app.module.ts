import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { SalesModule } from './sales/sales.module';
import { StatsModule } from './stats/stats.module';
import { PrismaModule } from './prisma/prisma.module';
import { GatewayModule } from './gateway/gateway.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { RateLimitModule } from './rate-limit/rate-limit.module';

@Module({
  imports: [
    RateLimitModule,
    PrismaModule,
    AuthModule,
    TenantsModule,
    UsersModule,
    ProductsModule,
    SalesModule,
    StatsModule,
    GatewayModule,
    SubscriptionsModule,
  ],
})
export class AppModule {}