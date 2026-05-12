import { HttpException, HttpStatus } from '@nestjs/common'
import { GlobalExceptionFilter } from './global-exception.filter'

const makeHost = (statusFn = jest.fn(), jsonFn = jest.fn()) => ({
  switchToHttp: () => ({
    getResponse: () => ({
      status: statusFn.mockReturnValue({ json: jsonFn }),
    }),
  }),
})

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter

  beforeEach(() => {
    filter = new GlobalExceptionFilter()
  })

  it('returns the HTTP status and message from HttpException', () => {
    const statusFn = jest.fn()
    const jsonFn = jest.fn()
    const host = makeHost(statusFn, jsonFn)

    filter.catch(new HttpException('Not found', HttpStatus.NOT_FOUND), host as any)

    expect(statusFn).toHaveBeenCalledWith(404)
    expect(jsonFn).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, message: 'Not found' }),
    )
  })

  it('returns 500 and generic message for non-HTTP errors', () => {
    const statusFn = jest.fn()
    const jsonFn = jest.fn()
    const host = makeHost(statusFn, jsonFn)

    filter.catch(new Error('something broke'), host as any)

    expect(statusFn).toHaveBeenCalledWith(500)
    expect(jsonFn).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 500, message: 'Internal server error' }),
    )
  })

  it('includes a timestamp in the response', () => {
    const captured: any[] = []
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({
          status: jest.fn().mockReturnValue({ json: (body: any) => captured.push(body) }),
        }),
      }),
    }

    filter.catch(new HttpException('Bad request', 400), host as any)

    expect(captured[0]).toHaveProperty('timestamp')
    expect(typeof captured[0].timestamp).toBe('string')
  })

  it('handles non-Error thrown values (strings, objects)', () => {
    const statusFn = jest.fn()
    const jsonFn = jest.fn()
    const host = makeHost(statusFn, jsonFn)

    expect(() => filter.catch('some string error', host as any)).not.toThrow()
    expect(statusFn).toHaveBeenCalledWith(500)
  })
})
