import { Injectable, LoggerService } from '@nestjs/common'
import { getCorrelationId } from '../correlation/correlation.context'

@Injectable()
export class AppLogger implements LoggerService {
  private fmt(message: unknown): string {
    const cid = getCorrelationId()
    return `[${cid}] ${message}`
  }

  log(message: unknown, context?: string): void {
    const out = this.fmt(message)
    context ? console.log(`[${context}] ${out}`) : console.log(out)
  }

  error(message: unknown, trace?: string, context?: string): void {
    const out = this.fmt(message)
    context ? console.error(`[${context}] ${out}`) : console.error(out)
    if (trace) console.error(trace)
  }

  warn(message: unknown, context?: string): void {
    const out = this.fmt(message)
    context ? console.warn(`[${context}] ${out}`) : console.warn(out)
  }

  debug(message: unknown, context?: string): void {
    const out = this.fmt(message)
    context ? console.debug(`[${context}] ${out}`) : console.debug(out)
  }

  verbose(message: unknown, context?: string): void {
    const out = this.fmt(message)
    context ? console.log(`[VERBOSE][${context}] ${out}`) : console.log(`[VERBOSE] ${out}`)
  }
}
