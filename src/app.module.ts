import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessModule } from './access/access.module';
import { CrewLeadsModule } from './crew-leads/crew-leads.module';
import { PassengersModule } from './passengers/passengers.module';
import { ResourcesModule } from './resources/resources.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DATABASE_HOST', 'localhost'),
        port: config.get<number>('DATABASE_PORT', 5432),
        username: config.get('DATABASE_USER', 'spaceship'),
        password: config.get('DATABASE_PASSWORD', 'spaceship'),
        database: config.get('DATABASE_NAME', 'spaceship_x26'),
        ssl: config.get('DATABASE_SSL', 'false') === 'true' ? { rejectUnauthorized: false } : false,
        autoLoadEntities: true,
        synchronize: config.get('DATABASE_SYNCHRONIZE', 'false') === 'true',
      }),
    }),
    CrewLeadsModule,
    PassengersModule,
    ResourcesModule,
    AccessModule,
  ],
})
export class AppModule {}
