import { describe, it, expect, vi } from 'vitest'
import axios from 'axios'

// Mock axios before importing api so the instance is created with the mock
vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>()
  const mockInstance = {
    defaults: { headers: { common: {} } },
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    request: vi.fn(),
  }
  return {
    default: {
      ...actual.default,
      create: vi.fn(() => mockInstance),
    },
    _mockInstance: mockInstance,
  }
})

describe('api module', () => {
  it('creates an axios instance with the correct baseURL and withCredentials', async () => {
    await import('./api')
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: '/api/admin',
        withCredentials: true,
      }),
    )
  })

  it('registers a response interceptor', async () => {
    const mod = await import('axios') as any
    const mockInstance = mod._mockInstance
    expect(mockInstance.interceptors.response.use).toHaveBeenCalled()
  })
})

describe('getErrorMessage integration with api interceptor', () => {
  it('getErrorMessage extracts server message from Axios-shaped error', async () => {
    const { getErrorMessage } = await import('./utils')
    const axiosError = {
      response: { data: { message: 'Validation failed' } },
    }
    expect(getErrorMessage(axiosError)).toBe('Validation failed')
  })

  it('getErrorMessage handles validation errors array', async () => {
    const { getErrorMessage } = await import('./utils')
    const axiosError = {
      response: { data: { message: ['name is required', 'email must be valid'] } },
    }
    expect(getErrorMessage(axiosError)).toBe('name is required, email must be valid')
  })
})
