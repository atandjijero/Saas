import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 10, // 10 requests per minute for general endpoints
      },
      {
        name: 'strict',
        ttl: 60000,
        limit: 3, // 3 requests per minute for sensitive endpoints
      },
    ]),
  ],
  exports: [ThrottlerModule],
})
export class RateLimitModule {}