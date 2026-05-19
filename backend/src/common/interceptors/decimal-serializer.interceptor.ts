import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

function coerceDecimals(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (value instanceof Date) return value
  // Prisma Decimal (decimal.js) exposes toNumber()
  if (typeof value === 'object' && typeof (value as { toNumber?: unknown }).toNumber === 'function') {
    return (value as { toNumber: () => number }).toNumber()
  }
  if (Array.isArray(value)) return value.map(coerceDecimals)
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, coerceDecimals(v)]),
    )
  }
  return value
}

@Injectable()
export class DecimalSerializerInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map(coerceDecimals))
  }
}
