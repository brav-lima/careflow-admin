import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate, formatCNPJ, formatCPF, getErrorMessage, cn } from './utils'

describe('formatCurrency', () => {
  it('formats value as BRL currency', () => {
    expect(formatCurrency(1234.56)).toMatch(/1\.234,56/)
  })

  it('formats zero correctly', () => {
    expect(formatCurrency(0)).toMatch(/0,00/)
  })
})

describe('formatDate', () => {
  it('formats ISO date string as pt-BR date', () => {
    expect(formatDate('2026-05-12T00:00:00.000Z')).toMatch(/\d{2}\/\d{2}\/\d{4}/)
  })

  it('accepts a Date object', () => {
    const date = new Date('2026-01-01T00:00:00.000Z')
    expect(formatDate(date)).toMatch(/\d{2}\/\d{2}\/\d{4}/)
  })
})

describe('formatCNPJ', () => {
  it('formats 14-digit CNPJ string', () => {
    expect(formatCNPJ('12345678000195')).toBe('12.345.678/0001-95')
  })
})

describe('formatCPF', () => {
  it('formats 11-digit CPF string', () => {
    expect(formatCPF('12345678901')).toBe('123.456.789-01')
  })
})

describe('getErrorMessage', () => {
  it('returns message from Axios error response (string)', () => {
    const error = { response: { data: { message: 'Credenciais inválidas' } } }
    expect(getErrorMessage(error)).toBe('Credenciais inválidas')
  })

  it('returns joined string when message is an array', () => {
    const error = { response: { data: { message: ['Campo obrigatório', 'Email inválido'] } } }
    expect(getErrorMessage(error)).toBe('Campo obrigatório, Email inválido')
  })

  it('returns network error message when isNetworkError is set', () => {
    const error = Object.assign(new Error('Sem conexão'), { isNetworkError: true })
    expect(getErrorMessage(error)).toBe('Sem conexão')
  })

  it('returns fallback for unknown error shape', () => {
    expect(getErrorMessage({})).toBe('Ocorreu um erro inesperado')
    expect(getErrorMessage(null)).toBe('Ocorreu um erro inesperado')
    expect(getErrorMessage('string error')).toBe('Ocorreu um erro inesperado')
  })

  it('returns fallback when response has no message', () => {
    const error = { response: { data: {} } }
    expect(getErrorMessage(error)).toBe('Ocorreu um erro inesperado')
  })
})

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('resolves Tailwind conflicts (last wins)', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('ignores falsy values', () => {
    expect(cn('foo', false && 'bar', undefined, 'baz')).toBe('foo baz')
  })
})
