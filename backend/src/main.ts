import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { join } from 'path'
import { mkdirSync } from 'fs'
import { AppModule } from './app.module'

// Crear directorios de upload si no existen
const uploadDirs = ['avatars', 'covers', 'evidences', 'publications', 'logos']
uploadDirs.forEach(dir => {
  mkdirSync(join(process.cwd(), 'uploads', dir), { recursive: true })
})

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  // ── Archivos estáticos (uploads) ──────────────────────────────────────────
  // Las imágenes subidas se sirven desde /uploads/*
  // En producción: reemplazar por CDN o S3 presigned URLs
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' })

  // ── Global validation pipe ────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // strip unknown fields
      forbidNonWhitelisted: true,
      transform: true,           // auto-transform payloads
      transformOptions: { enableImplicitConversion: true },
    }),
  )

  // ── CORS ──────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: true,
    credentials: true,
  })

  // ── Global prefix ─────────────────────────────────────────────────────────
  app.setGlobalPrefix('api')

  // ── Swagger / OpenAPI ─────────────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Red Talento TP API')
    .setDescription('API REST para la plataforma Red Talento TP — conecta estudiantes técnicos, colegios y empresas.')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
    .addTag('Auth', 'Autenticación y gestión de sesión')
    .addTag('Students', 'Perfil y datos de estudiantes')
    .addTag('Companies', 'Perfil y datos de empresas')
    .addTag('Schools', 'Perfil y datos del colegio')
    .addTag('Skills', 'Habilidades y validaciones')
    .addTag('Opportunities', 'Ofertas de práctica y trabajo')
    .addTag('Applications', 'Postulaciones a oportunidades')
    .addTag('Messages', 'Sistema de mensajería interna')
    .addTag('Publications', 'Publicaciones e historias')
    .build()

  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('api/docs', app, document)

  const port = process.env.PORT ?? 3001
  const host = process.env.HOST ?? '0.0.0.0'
  await app.listen(port, host)
  console.log(`🚀 Red Talento API running at http://${host}:${port}/api`)
  console.log(`📖 Swagger docs at http://${host}:${port}/api/docs`)
}

bootstrap()
