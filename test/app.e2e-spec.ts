import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { UsageRecord } from '../src/access/usage-record.entity';
import { configureApp } from '../src/app.setup';
import { MembershipTier } from '../src/common/membership-tier';

const TEST_DATABASE = 'spaceship_x26_e2e';
const CREW_LEAD_ID = '00000000-0000-4000-8000-000000000001';
const CREW_HEADER = { 'x-crew-lead-id': CREW_LEAD_ID };

interface PassengerBody {
  id: string;
  name: string;
  email: string;
  tier: MembershipTier;
}

interface ResourceBody {
  id: string;
  name: string;
  minimumTier: MembershipTier;
  active: boolean;
}

interface UsageBody {
  id: string;
  passengerId: string;
  resourceId: string;
  passengerTier: MembershipTier;
  requiredTier: MembershipTier;
  decision: 'ALLOWED' | 'DENIED';
  reason: 'TIER_ELIGIBLE' | 'INSUFFICIENT_TIER' | 'RESOURCE_INACTIVE';
}

describe('Spaceship X26 API (e2e)', () => {
  let app: INestApplication;
  let adminDataSource: DataSource;
  let testDataSource: DataSource;
  let silverPassenger: PassengerBody;
  let platinumPassenger: PassengerBody;
  let silverResource: ResourceBody;
  let goldResource: ResourceBody;

  beforeAll(async () => {
    adminDataSource = new DataSource({
      type: 'postgres',
      host: process.env.DATABASE_HOST ?? 'localhost',
      port: Number(process.env.DATABASE_PORT ?? 5432),
      username: process.env.DATABASE_USER ?? 'spaceship',
      password: process.env.DATABASE_PASSWORD ?? 'spaceship',
      database: 'postgres',
    });
    await adminDataSource.initialize();
    await adminDataSource.query(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${TEST_DATABASE}'`,
    );
    await adminDataSource.query(`DROP DATABASE IF EXISTS "${TEST_DATABASE}"`);
    await adminDataSource.query(`CREATE DATABASE "${TEST_DATABASE}"`);

    process.env.DATABASE_NAME = TEST_DATABASE;
    process.env.DATABASE_SYNCHRONIZE = 'false';
    const importedDataSource = await import('../src/database/data-source');
    testDataSource = importedDataSource.default;
    await testDataSource.initialize();
    await testDataSource.runMigrations();

    const { AppModule } = await import('../src/app.module');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    if (testDataSource.isInitialized) await testDataSource.destroy();
    await adminDataSource.query(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${TEST_DATABASE}'`,
    );
    await adminDataSource.query(`DROP DATABASE IF EXISTS "${TEST_DATABASE}"`);
    await adminDataSource.destroy();
  });

  it('protects administrative operations and seeds the base resource inventory', async () => {
    await request(app.getHttpServer()).get('/api/passengers').expect(401);
    const response = await request(app.getHttpServer())
      .get('/api/resources')
      .set(CREW_HEADER)
      .expect(200);
    const resources = response.body as ResourceBody[];
    expect(resources).toHaveLength(7);
    silverResource = resources.find((resource) => resource.minimumTier === MembershipTier.SILVER)!;
  });

  it('validates and normalizes passenger profiles with stable duplicate errors', async () => {
    await request(app.getHttpServer())
      .post('/api/passengers')
      .set(CREW_HEADER)
      .send({ name: '   ', email: 'blank@example.com', tier: MembershipTier.SILVER })
      .expect(400);

    const silverResponse = await request(app.getHttpServer())
      .post('/api/passengers')
      .set(CREW_HEADER)
      .send({ name: '  Nova Reed  ', email: 'NOVA@EXAMPLE.COM ', tier: MembershipTier.SILVER })
      .expect(201);
    silverPassenger = silverResponse.body as PassengerBody;
    expect(silverPassenger).toMatchObject({ name: 'Nova Reed', email: 'nova@example.com' });

    await request(app.getHttpServer())
      .post('/api/passengers')
      .set(CREW_HEADER)
      .send({ name: 'Duplicate', email: 'nova@example.com', tier: MembershipTier.GOLD })
      .expect(409);

    const platinumResponse = await request(app.getHttpServer())
      .post('/api/passengers')
      .set(CREW_HEADER)
      .send({
        name: 'Avery Stone',
        email: 'avery@example.com',
        tier: MembershipTier.PLATINUM,
      })
      .expect(201);
    platinumPassenger = platinumResponse.body as PassengerBody;
  });

  it('provisions resources and filters passenger discovery by active inherited access', async () => {
    const resourceResponse = await request(app.getHttpServer())
      .post('/api/resources')
      .set(CREW_HEADER)
      .send({
        name: '  Gold Observatory  ',
        description: '  Long-range observation deck.  ',
        minimumTier: MembershipTier.GOLD,
      })
      .expect(201);
    goldResource = resourceResponse.body as ResourceBody;
    expect(goldResource.name).toBe('Gold Observatory');
    await request(app.getHttpServer())
      .post('/api/resources')
      .set(CREW_HEADER)
      .send({ name: 'gold observatory', minimumTier: MembershipTier.GOLD })
      .expect(409);

    await request(app.getHttpServer()).get('/api/passenger/resources').expect(401);
    const silverDiscovery = await request(app.getHttpServer())
      .get('/api/passenger/resources')
      .set('x-passenger-id', silverPassenger.id)
      .expect(200);
    expect(
      (silverDiscovery.body as ResourceBody[]).every(
        (resource) => resource.minimumTier === MembershipTier.SILVER && resource.active,
      ),
    ).toBe(true);

    const platinumDiscovery = await request(app.getHttpServer())
      .get('/api/passenger/resources')
      .set('x-passenger-id', platinumPassenger.id)
      .expect(200);
    expect(
      (platinumDiscovery.body as ResourceBody[]).some(({ id }) => id === goldResource.id),
    ).toBe(true);
  });

  it('records allowed and denied passenger decisions with immutable tier snapshots', async () => {
    const deniedResponse = await request(app.getHttpServer())
      .post(`/api/passenger/resources/${goldResource.id}/access`)
      .set('x-passenger-id', silverPassenger.id)
      .expect(201);
    expect(deniedResponse.body as UsageBody).toMatchObject({
      decision: 'DENIED',
      reason: 'INSUFFICIENT_TIER',
      passengerTier: MembershipTier.SILVER,
      requiredTier: MembershipTier.GOLD,
    });

    const allowedResponse = await request(app.getHttpServer())
      .post(`/api/passenger/resources/${silverResource.id}/access`)
      .set('x-passenger-id', silverPassenger.id)
      .expect(201);
    expect(allowedResponse.body as UsageBody).toMatchObject({
      decision: 'ALLOWED',
      reason: 'TIER_ELIGIBLE',
    });

    await request(app.getHttpServer())
      .post('/api/access/attempts')
      .send({ passengerId: silverPassenger.id, resourceId: silverResource.id })
      .expect(401);
  });

  it('provides self-service history without allowing passenger-id path spoofing', async () => {
    const ownHistory = await request(app.getHttpServer())
      .get('/api/passenger/history')
      .set('x-passenger-id', silverPassenger.id)
      .expect(200);
    const records = ownHistory.body as UsageBody[];
    expect(records).toHaveLength(2);
    expect(records.every(({ passengerId }) => passengerId === silverPassenger.id)).toBe(true);

    const otherHistory = await request(app.getHttpServer())
      .get('/api/passenger/history')
      .set('x-passenger-id', platinumPassenger.id)
      .expect(200);
    expect(otherHistory.body).toEqual([]);
  });

  it('upgrades membership while preserving the tier on earlier audit records', async () => {
    await request(app.getHttpServer())
      .patch(`/api/passengers/${silverPassenger.id}/tier`)
      .set(CREW_HEADER)
      .send({ tier: MembershipTier.GOLD })
      .expect(200);

    const discovery = await request(app.getHttpServer())
      .get('/api/passenger/resources')
      .set('x-passenger-id', silverPassenger.id)
      .expect(200);
    expect((discovery.body as ResourceBody[]).some(({ id }) => id === goldResource.id)).toBe(true);

    const response = await request(app.getHttpServer())
      .post(`/api/passenger/resources/${goldResource.id}/access`)
      .set('x-passenger-id', silverPassenger.id)
      .expect(201);
    expect(response.body as UsageBody).toMatchObject({
      decision: 'ALLOWED',
      passengerTier: MembershipTier.GOLD,
    });
  });

  it('decommissions idempotently and denies subsequent access', async () => {
    await request(app.getHttpServer())
      .patch(`/api/resources/${silverResource.id}/decommission`)
      .set(CREW_HEADER)
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/api/resources/${silverResource.id}/decommission`)
      .set(CREW_HEADER)
      .expect(200);

    const response = await request(app.getHttpServer())
      .post(`/api/passenger/resources/${silverResource.id}/access`)
      .set('x-passenger-id', platinumPassenger.id)
      .expect(201);
    expect(response.body as UsageBody).toMatchObject({
      decision: 'DENIED',
      reason: 'RESOURCE_INACTIVE',
    });
  });

  it('reports resource demand, tier totals, and latest activity', async () => {
    const tierResponse = await request(app.getHttpServer())
      .get('/api/access/reports/tiers')
      .set(CREW_HEADER)
      .expect(200);
    expect(tierResponse.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          passengerTier: MembershipTier.SILVER,
          totalAttempts: 2,
          successfulUses: 1,
          deniedAttempts: 1,
        }),
        expect.objectContaining({
          passengerTier: MembershipTier.PLATINUM,
          totalAttempts: 1,
          deniedAttempts: 1,
        }),
        expect.objectContaining({
          passengerTier: MembershipTier.GOLD,
          totalAttempts: 1,
          successfulUses: 1,
        }),
      ]),
    );

    const resourceResponse = await request(app.getHttpServer())
      .get('/api/access/reports/resources')
      .set(CREW_HEADER)
      .expect(200);
    expect(resourceResponse.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ resourceId: silverResource.id, successfulUses: 1 }),
      ]),
    );

    const activityResponse = await request(app.getHttpServer())
      .get('/api/access/reports/activity?limit=2')
      .set(CREW_HEADER)
      .expect(200);
    expect(activityResponse.body).toHaveLength(2);
  });

  it('enforces audit immutability in PostgreSQL', async () => {
    const { id } = await testDataSource.getRepository(UsageRecord).findOneByOrFail({});
    await expect(
      testDataSource.query(`DELETE FROM "usage_records" WHERE "id" = $1`, [id]),
    ).rejects.toThrow('usage records are immutable');
  });
});
