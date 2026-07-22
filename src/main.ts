import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  const config = new DocumentBuilder()
    .setTitle('Spaceship X26 Passenger Resource Management')
    .setDescription('Membership access, resource provisioning, and audited usage reporting')
    .setVersion('1.0')
    .addApiKey({ type: 'apiKey', name: 'x-crew-lead-id', in: 'header' }, 'crew-lead')
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
