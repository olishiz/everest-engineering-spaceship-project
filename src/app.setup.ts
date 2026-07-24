import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function configureApp(app: INestApplication): void {
  const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({ origin: allowedOrigins });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  const config = new DocumentBuilder()
    .setTitle('Spaceship X26 Passenger Resource Management')
    .setDescription('Membership access, resource provisioning, and audited usage reporting')
    .setVersion('1.0')
    .addApiKey({ type: 'apiKey', name: 'x-crew-lead-id', in: 'header' }, 'crew-lead')
    .addApiKey({ type: 'apiKey', name: 'x-passenger-id', in: 'header' }, 'passenger')
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
}
