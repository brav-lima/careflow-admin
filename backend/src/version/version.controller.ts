import { Controller, Get } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

@ApiTags('version')
@Controller('version')
export class VersionController {
  @Get()
  get() {
    return {
      version: process.env.APP_VERSION ?? 'dev',
      gitSha: process.env.GIT_SHA ?? 'unknown',
      builtAt: process.env.BUILT_AT ?? 'unknown',
    }
  }
}
