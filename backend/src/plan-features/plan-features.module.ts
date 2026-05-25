import { Module } from '@nestjs/common'
import { PlanFeaturesController } from './plan-features.controller'
import { PlanFeaturesService } from './plan-features.service'

@Module({
  controllers: [PlanFeaturesController],
  providers: [PlanFeaturesService],
  exports: [PlanFeaturesService],
})
export class PlanFeaturesModule {}
