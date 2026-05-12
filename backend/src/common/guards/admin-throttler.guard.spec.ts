import { ThrottlerException } from '@nestjs/throttler'
import { AdminThrottlerGuard } from './admin-throttler.guard'

class TestableAdminThrottlerGuard extends AdminThrottlerGuard {
  constructor() {
    super({} as any, {} as any, {} as any)
  }
  async testGetTracker(req: Record<string, unknown>): Promise<string> {
    return this.getTracker(req)
  }
  async testThrowThrottlingException(): Promise<void> {
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({ method: 'GET', originalUrl: '/test' }),
      }),
    }
    return this.throwThrottlingException(ctx as any, {
      tracker: 'ip:1.2.3.4',
      key: 'test-key',
      limit: 100,
      ttl: 60000,
      totalHits: 101,
      timeToExpire: 5000,
      isBlocked: true,
      timeToBlockExpire: 5000,
    })
  }
}

describe('AdminThrottlerGuard', () => {
  describe('getTracker', () => {
    it('uses admin:<userId> when user is authenticated', async () => {
      const guard = new TestableAdminThrottlerGuard()
      expect(await guard.testGetTracker({ user: { sub: 'user-123' } })).toBe('admin:user-123')
    })

    it('falls back to ip:<ip> when user has no sub', async () => {
      const guard = new TestableAdminThrottlerGuard()
      expect(await guard.testGetTracker({ user: {}, ip: '1.2.3.4' })).toBe('ip:1.2.3.4')
    })

    it('falls back to ip:<ip> when request has no user', async () => {
      const guard = new TestableAdminThrottlerGuard()
      expect(await guard.testGetTracker({ ip: '5.6.7.8' })).toBe('ip:5.6.7.8')
    })

    it('uses ip:unknown when no ip is present', async () => {
      const guard = new TestableAdminThrottlerGuard()
      expect(await guard.testGetTracker({})).toBe('ip:unknown')
    })
  })

  describe('throwThrottlingException', () => {
    it('throws ThrottlerException', async () => {
      const guard = new TestableAdminThrottlerGuard()
      await expect(guard.testThrowThrottlingException()).rejects.toThrow(ThrottlerException)
    })
  })
})
