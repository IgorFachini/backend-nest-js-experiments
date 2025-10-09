import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Sequelize } from 'sequelize-typescript';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppInitializationService } from './app-initialization.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  const rawOrigins = process.env.CORS_ORIGINS;
  let origins: string[] | boolean;
  if (rawOrigins && rawOrigins.trim().length > 0) {
    origins = rawOrigins
      .split(',')
      .map((o) => o.trim())
      .filter((o) => o.length > 0);
  } else {
    origins = true;
  }
  app.enableCors({
    origin: origins,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
    exposedHeaders: 'Authorization',
  });
  const config = new DocumentBuilder()
    .setTitle('Backend NestJS Experiments')
    .setDescription('API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  const sequelize = app.get(Sequelize);
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso!');

    // Inicializar dados padrão (usuário padrão, etc.)
    const initService = app.get(AppInitializationService);
    await initService.initialize();
  } catch (error) {
    console.error('❌ Falha ao conectar ao banco de dados:', error);
  }
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
