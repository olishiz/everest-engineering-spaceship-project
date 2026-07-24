import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1784870400000 implements MigrationInterface {
  name = 'InitialSchema1784870400000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    await queryRunner.query(
      `CREATE TYPE "membership_tier_enum" AS ENUM ('SILVER', 'GOLD', 'PLATINUM')`,
    );
    await queryRunner.query(`CREATE TYPE "access_decision_enum" AS ENUM ('ALLOWED', 'DENIED')`);
    await queryRunner.query(
      `CREATE TYPE "access_reason_enum" AS ENUM ('TIER_ELIGIBLE', 'INSUFFICIENT_TIER', 'RESOURCE_INACTIVE')`,
    );
    await queryRunner.query(`
      CREATE TABLE "passengers" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(120) NOT NULL,
        "email" varchar(254) NOT NULL,
        "tier" "membership_tier_enum" NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_passengers" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_passengers_email" UNIQUE ("email")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "resources" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(120) NOT NULL,
        "description" text NOT NULL DEFAULT '',
        "minimumTier" "membership_tier_enum" NOT NULL,
        "active" boolean NOT NULL DEFAULT true,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_resources" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_resources_name" UNIQUE ("name")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_resources_name_case_insensitive" ON "resources" (lower("name"))`,
    );
    await queryRunner.query(`
      CREATE TABLE "usage_records" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "passengerId" uuid NOT NULL,
        "resourceId" uuid NOT NULL,
        "passengerName" varchar(120) NOT NULL,
        "resourceName" varchar(120) NOT NULL,
        "passengerTier" "membership_tier_enum" NOT NULL,
        "requiredTier" "membership_tier_enum" NOT NULL,
        "decision" "access_decision_enum" NOT NULL,
        "reason" "access_reason_enum" NOT NULL,
        "occurredAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_usage_records" PRIMARY KEY ("id"),
        CONSTRAINT "FK_usage_passenger" FOREIGN KEY ("passengerId") REFERENCES "passengers"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_usage_resource" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_usage_passenger_occurred" ON "usage_records" ("passengerId", "occurredAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_usage_resource_decision" ON "usage_records" ("resourceId", "decision")`,
    );
    await queryRunner.query(`
      INSERT INTO "resources" ("id", "name", "description", "minimumTier")
      VALUES
        ('10000000-0000-4000-8000-000000000001', 'Food Supply Station', 'Nutritious meals and hydration for the journey.', 'SILVER'),
        ('10000000-0000-4000-8000-000000000002', 'Sleeping Pod', 'Standard passenger rest and recovery pod.', 'SILVER'),
        ('10000000-0000-4000-8000-000000000003', 'Basic Hygiene Pod', 'Essential hygiene facilities.', 'SILVER'),
        ('10000000-0000-4000-8000-000000000004', 'Private Cabin', 'Private living quarters for enhanced comfort.', 'GOLD'),
        ('10000000-0000-4000-8000-000000000005', 'Advanced Medical Bay', 'Advanced diagnostics and clinical care.', 'GOLD'),
        ('10000000-0000-4000-8000-000000000006', 'Luxury Oxygen Pod', 'Premium oxygen recovery environment.', 'PLATINUM'),
        ('10000000-0000-4000-8000-000000000007', 'VIP Recreation Deck', 'Premium recreation and fitness facilities.', 'PLATINUM')
    `);
    await queryRunner.query(`
      CREATE FUNCTION prevent_usage_record_mutation() RETURNS trigger AS $$
      BEGIN
        RAISE EXCEPTION 'usage records are immutable';
      END;
      $$ LANGUAGE plpgsql
    `);
    await queryRunner.query(`
      CREATE TRIGGER "TR_usage_records_immutable"
      BEFORE UPDATE OR DELETE ON "usage_records"
      FOR EACH ROW EXECUTE FUNCTION prevent_usage_record_mutation()
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER "TR_usage_records_immutable" ON "usage_records"`);
    await queryRunner.query('DROP FUNCTION prevent_usage_record_mutation');
    await queryRunner.query('DROP TABLE "usage_records"');
    await queryRunner.query('DROP TABLE "resources"');
    await queryRunner.query('DROP TABLE "passengers"');
    await queryRunner.query('DROP TYPE "access_reason_enum"');
    await queryRunner.query('DROP TYPE "access_decision_enum"');
    await queryRunner.query('DROP TYPE "membership_tier_enum"');
  }
}
