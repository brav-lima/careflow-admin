import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class ClinicExternalApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const key = request.headers['x-clinic-api-key']
    const expected = this.config.getOrThrow<string>('CLINIC_EXTERNAL_API_KEY')

    if (!key || key !== expected) {
      throw new UnauthorizedException('Invalid clinic API key')
    }

    return true
  }
}
