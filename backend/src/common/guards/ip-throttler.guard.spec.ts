import { ThrottlerException } from '@nestjs/throttler'
import { IpThrottlerGuard } from './ip-throttler.guard'

class TestableIpThrottlerGuard extends IpThrottlerGuard {
  constructor() {
    super({} as any, {} as any, {} as any)
  }
  async testGetTracker(req: Record<string, unknown>): Promise<string> {
    return this.getTracker(req)
  }
  async testThrowThrottlingException(ip = '1.2.3.4'): Promise<void> {
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({ method: 'POST', originalUrl: '/test/reset-password' }),
      }),
    }
    return this.throwThrottlingException(ctx as any, {
      tracker: `ip:${ip}`,
      key: 'reset-ip',
      limit: 20,
      ttl: 3_600_000,
      totalHits: 21,
      isBlocked: true,
      timeToExpire: 1000,
      timeToBlockExpire: 1000,
    })
  }
}

describe('IpThrottlerGuard', () => {
  describe('getTracker', () => {
    it('returns ip:<ip> from request', async () => {
      const guard = new TestableIpThrottlerGuard()
      expect(await guard.testGetTracker({ ip: '10.0.0.1' })).toBe('ip:10.0.0.1')
    })

    it('returns ip:unknown when no ip is present', async () => {
      const guard = new TestableIpThrottlerGuard()
      expect(await guard.testGetTracker({})).toBe('ip:unknown')
    })

    it('ignores authenticated user — always tracks by IP', async () => {
      const guard = new TestableIpThrottlerGuard()
      expect(await guard.testGetTracker({ user: { sub: 'admin-1' }, ip: '9.9.9.9' })).toBe('ip:9.9.9.9')
    })
  })

  describe('throwThrottlingException', () => {
    it('throws ThrottlerException', async () => {
      const guard = new TestableIpThrottlerGuard()
      await expect(guard.testThrowThrottlingException()).rejects.toThrow(ThrottlerException)
    })
  })
})
