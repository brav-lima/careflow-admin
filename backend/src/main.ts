import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const config = app.get(ConfigService)
  const port = config.get<number>('PORT', 3001)
  const corsOrigin = config.get<string>('CORS_ORIGIN', 'http://localhost:8081')

  app.enableCors({ origin: corsOrigin, credentials: true })

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
