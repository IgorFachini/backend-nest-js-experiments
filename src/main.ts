import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Sequelize } from 'sequelize-typescript';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  // Swagger / OpenAPI setup
  const config = new DocumentBuilder()
    .setTitle('Backend NestJS Experiments')
    .setDescription('API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  // Obtém a instância do Sequelize
  const sequelize = app.get(Sequelize);
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso!');
  } catch (error) {
    console.error('❌ Falha ao conectar ao banco de dados:', error);
  }
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
