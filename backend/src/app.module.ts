import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { OrganizationsModule } from './organizations/organizations.module'
import { PlansModule } from './plans/plans.module'
import { SubscriptionsModule } from './subscriptions/subscriptions.module'
import { InvoicesModule } from './invoices/invoices.module'
import { MetricsModule } from './metrics/metrics.module'
import { ClinicApiModule } from './clinic-api/clinic-api.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // dotenvx já injeta as variáveis no processo antes do NestJS iniciar
      ignoreEnvFile: true,
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    ClinicApiModule,
    AuthModule,
    OrganizationsModule,
    PlansModule,
    SubscriptionsModule,
    InvoicesModule,
    MetricsModule,
  ],
})
export class AppModule {}
