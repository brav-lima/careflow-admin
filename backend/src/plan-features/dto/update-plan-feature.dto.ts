import { PartialType, OmitType } from '@nestjs/swagger'
import { CreatePlanFeatureDto } from './create-plan-feature.dto'

export class UpdatePlanFeatureDto extends PartialType(OmitType(CreatePlanFeatureDto, ['key'] as const)) {}
