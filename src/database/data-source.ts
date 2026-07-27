import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { UsageRecord } from '../access/usage-record.entity';
import { Passenger } from '../passengers/passenger.entity';
import { SpaceshipResource } from '../resources/resource.entity';

const databaseUrl = process.env.DATABASE_URL;

export default new DataSource({
  type: 'postgres',
  ...(databaseUrl
    ? { url: databaseUrl }
    : {
        host: process.env.DATABASE_HOST ?? 'localhost',
        port: Number(process.env.DATABASE_PORT ?? 5432),
        username: process.env.DATABASE_USER ?? 'spaceship',
        password: process.env.DATABASE_PASSWORD ?? 'spaceship',
        database: process.env.DATABASE_NAME ?? 'spaceship_x26',
      }),
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [Passenger, SpaceshipResource, UsageRecord],
  migrations: [`${__dirname}/migrations/*{.ts,.js}`],
  synchronize: false,
});
