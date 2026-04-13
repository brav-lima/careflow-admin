import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import * as cookieParser from 'cookie-parser'
import helmet from 'helmet'
import { AppModule } from './app.module'
import { GlobalExceptionFilter } from './common/filters/global-exception.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const config = app.get(ConfigService)
  const port = config.get<number>('PORT', 3001)
  const corsOrigin = config.get<string>('CORS_ORIGIN', 'http://localhost:8081')

  if (process.env.NODE_ENV === 'production' && (!corsOrigin || corsOrigin.includes('localhost'))) {
    throw new Error('CORS_ORIGIN must be set to a production domain in production environment')
  }

  app.use(helmet())
  app.use(cookieParser())
  app.enableCors({ origin: corsOrigin, credentials: true })

  app.useGlobalFilters(new GlobalExceptionFilter())

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  app.setGlobalPrefix('api/admin')

  const swaggerConfig = new DocumentBuilder()
    .setTitle('CareFlow Admin API')
    .setDescription('API interna de gestão SaaS do CareFlow')
    .setVersion('1.0')
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('api/admin/docs', app, document)

  await app.listen(port)
  console.log(`🚀 Admin API running on http://localhost:${port}/api/admin`)
  console.log(`📖 Swagger docs: http://localhost:${port}/api/admin/docs`)
}

bootstrap()
