import { Controller, Post, Get, Body, UseGuards, Res, Req } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { Throttle, ThrottlerGuard } from '@nestjs/throttler'
import { Request, Response, CookieOptions } from 'express'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { JwtRefreshGuard } from './guards/jwt-refresh.guard'
import { CurrentUser } from './decorators/current-user.decorator'
import { CurrentRefreshUser, RefreshUser } from './decorators/current-refresh-user.decorator'
import { Public } from './decorators/public.decorator'
import { REFRESH_COOKIE_NAME } from './strategies/jwt-refresh.strategy'

const ACCESS_COOKIE_NAME = 'admin_token'
const ACCESS_TOKEN_MAX_AGE_MS = 8 * 60 * 60 * 1000
const REFRESH_COOKIE_PATH = '/api/admin/auth'

const isProd = () => process.env.NODE_ENV === 'production'

const accessCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: isProd(),
  sameSite: 'strict',
  maxAge: ACCESS_TOKEN_MAX_AGE_MS,
})

const refreshCookieOptions = (maxAgeMs: number): CookieOptions => ({
  httpOnly: true,
  secure: isProd(),
  sameSite: 'strict',
  maxAge: maxAgeMs,
  path: REFRESH_COOKIE_PATH,
})

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, refreshTokenMaxAgeMs, user } =
      await this.authService.login(dto)
    res.cookie(ACCESS_COOKIE_NAME, accessToken, accessCookieOptions())
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions(refreshTokenMaxAgeMs))
    return { user }
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  async refresh(
    @CurrentRefreshUser() refreshUser: RefreshUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, refreshTokenMaxAgeMs } =
      await this.authService.rotateRefreshToken(refreshUser.userId, refreshUser.jti)
    res.cookie(ACCESS_COOKIE_NAME, accessToken, accessCookieOptions())
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions(refreshTokenMaxAgeMs))
    return { ok: true }
  }

  @Public()
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined
    if (refreshToken) {
      try {
        const decoded = JSON.parse(
          Buffer.from(refreshToken.split('.')[1] ?? '', 'base64url').toString('utf8'),
        ) as { jti?: string }
        if (decoded?.jti) {
          await this.authService.revokeRefreshToken(decoded.jti)
        }
      } catch {
        // malformed token in cookie — clear it anyway
      }
    }
    res.clearCookie(ACCESS_COOKIE_NAME, { httpOnly: true, sameSite: 'strict' })
    res.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'strict',
      path: REFRESH_COOKIE_PATH,
    })
    return { ok: true }
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser() userId: string) {
    return this.authService.getMe(userId)
  }
}
