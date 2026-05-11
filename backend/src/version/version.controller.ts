import { Controller, Get } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

@ApiTags('health')
@Controller('health')
export class VersionController {
  @Get()
  get() {
    return { status: 'ok', message: 'Tudo estável' }
  }
}
