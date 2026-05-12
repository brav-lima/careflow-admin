import { ExecutionContext, Injectable, Logger } from '@nestjs/common'
import { ThrottlerException, ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler'
import type { Request } from 'express'

@Injectable()
export class IpThrottlerGuard extends ThrottlerGuard {
  private readonly logger = new Logger(IpThrottlerGuard.name)

  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    return `ip:${(req.ip as string | undefined) ?? 'unknown'}`
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    detail: ThrottlerLimitDetail,
  ): Promise<void> {
    const req = context.switchToHttp().getRequest<Request>()
    this.logger.warn(
      `IP rate limit hit on ${req.method} ${req.originalUrl} for ${detail.tracker} (limit ${detail.limit}/${detail.ttl}ms)`,
    )
    throw new ThrottlerException()
  }
}
