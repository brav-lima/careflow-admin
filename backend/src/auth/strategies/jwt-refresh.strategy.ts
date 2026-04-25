import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { Request } from 'express'

export interface JwtRefreshPayload {
  sub: string
  jti: string
}

export const REFRESH_COOKIE_NAME = 'admin_refresh_token'

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'admin-jwt-refresh') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.[REFRESH_COOKIE_NAME] ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ADMIN_REFRESH_SECRET'),
      passReqToCallback: true,
    })
  }

  validate(req: Request, payload: JwtRefreshPayload) {
    return {
      userId: payload.sub,
      jti: payload.jti,
      token: req?.cookies?.[REFRESH_COOKIE_NAME] as string | undefined,
    }
  }
}
