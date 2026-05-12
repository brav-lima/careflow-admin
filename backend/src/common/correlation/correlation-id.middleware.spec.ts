import { CorrelationIdMiddleware, CORRELATION_HEADER } from './correlation-id.middleware'
import { correlationStorage } from './correlation.context'

const makeReqRes = (headerValue?: string) => {
  const headers: Record<string, string> = {}
  if (headerValue) headers[CORRELATION_HEADER] = headerValue
  const req = { headers } as any
  const res = { setHeader: jest.fn() } as any
  return { req, res }
}

describe('CorrelationIdMiddleware', () => {
  let middleware: CorrelationIdMiddleware

  beforeEach(() => {
    middleware = new CorrelationIdMiddleware()
  })

  it('generates a UUID when no header is present', (done) => {
    const { req, res } = makeReqRes()
    middleware.use(req, res, () => {
      const id = correlationStorage.getStore()
      expect(id).toMatch(/^[\da-f-]{36}$/)
      expect(res.setHeader).toHaveBeenCalledWith(CORRELATION_HEADER, id)
      done()
    })
  })

  it('reuses the header value when present', (done) => {
    const { req, res } = makeReqRes('my-trace-id-123')
    middleware.use(req, res, () => {
      expect(correlationStorage.getStore()).toBe('my-trace-id-123')
      expect(res.setHeader).toHaveBeenCalledWith(CORRELATION_HEADER, 'my-trace-id-123')
      done()
    })
  })

  it('generates different IDs for each call (request isolation)', (done) => {
    const { req: req1, res: res1 } = makeReqRes()
    const { req: req2, res: res2 } = makeReqRes()
    let id1: string | undefined
    let id2: string | undefined
    middleware.use(req1, res1, () => { id1 = correlationStorage.getStore() })
    middleware.use(req2, res2, () => { id2 = correlationStorage.getStore() })
    expect(id1).toBeDefined()
    expect(id2).toBeDefined()
    expect(id1).not.toBe(id2)
    done()
  })
})
