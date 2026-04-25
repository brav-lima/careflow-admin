import { ExecutionContext, Injectable, Logger } from '@nestjs/common'
import { ThrottlerException, ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler'
import type { Request } from 'express'

@Injectable()
export class AdminThrottlerGuard extends ThrottlerGuard {
  private readonly logger = new Logger(AdminThrottlerGuard.name)

  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    const user = req.user as { sub?: string } | undefined
    if (user?.sub) return `admin:${user.sub}`
    const ip = (req.ip as string | undefined) ?? 'unknown'
    return `ip:${ip}`
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    detail: ThrottlerLimitDetail,
  ): Promise<void> {
    const req = context.switchToHttp().getRequest<Request>()
    this.logger.warn(
      `Rate limit hit on ${req.method} ${req.originalUrl} for ${detail.tracker} (limit ${detail.limit}/${detail.ttl}ms)`,
    )
    throw new ThrottlerException()
  }
}
