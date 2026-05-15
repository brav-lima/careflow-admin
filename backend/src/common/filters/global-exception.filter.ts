import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common'
import { Response } from 'express'
import { getCorrelationId } from '../correlation/correlation.context'

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()

    let status = 500
    let body: Record<string, unknown> = { message: 'Internal server error' }

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const res = exception.getResponse()
      body = typeof res === 'string' ? { message: res } : (res as Record<string, unknown>)
    } else {
      this.logger.error(exception instanceof Error ? exception.stack : String(exception))
    }

    response.status(status).json({
      ...body,
      statusCode: status,
      correlationId: getCorrelationId(),
      timestamp: new Date().toISOString(),
    })
  }
}
