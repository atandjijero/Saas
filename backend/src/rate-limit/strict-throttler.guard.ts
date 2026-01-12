import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class StrictThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.ips.length ? req.ips[0] : req.ip; // IP address
  }

  protected async getLimit(context: any): Promise<number> {
    return 3; // 3 requests per minute for strict endpoints
  }

  protected async getTtl(context: any): Promise<number> {
    return 60000; // 1 minute
  }
}