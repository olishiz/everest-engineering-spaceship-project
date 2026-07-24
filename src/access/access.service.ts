import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PassengersService } from '../passengers/passengers.service';
import { ResourcesService } from '../resources/resources.service';
import { MembershipTier } from '../common/membership-tier';
import { AccessPolicyService } from './access-policy.service';
import { AttemptAccessDto } from './access.dto';
import { AccessDecision, UsageRecord } from './usage-record.entity';

export interface PopularResource {
  resourceId: string;
  resourceName: string;
  successfulUses: number;
}

export interface TierUsageSummary {
  passengerTier: MembershipTier;
  totalAttempts: number;
  successfulUses: number;
  deniedAttempts: number;
}

@Injectable()
export class AccessService {
  constructor(
    @InjectRepository(UsageRecord) private readonly repository: Repository<UsageRecord>,
    private readonly passengers: PassengersService,
    private readonly resources: ResourcesService,
    private readonly policy: AccessPolicyService,
  ) {}

  async attempt(dto: AttemptAccessDto): Promise<UsageRecord> {
    const [passenger, resource] = await Promise.all([
      this.passengers.findOne(dto.passengerId),
      this.resources.findOne(dto.resourceId),
    ]);
    const result = this.policy.evaluate(passenger.tier, resource.minimumTier, resource.active);
    // Persist before responding: denial is a business result and must be as auditable as success.
    return this.repository.save(
      this.repository.create({
        passengerId: passenger.id,
        resourceId: resource.id,
        passengerName: passenger.name,
        resourceName: resource.name,
        passengerTier: passenger.tier,
        requiredTier: resource.minimumTier,
        ...result,
      }),
    );
  }

  async historyForPassenger(passengerId: string): Promise<UsageRecord[]> {
    await this.passengers.findOne(passengerId);
    return this.repository.find({ where: { passengerId }, order: { occurredAt: 'DESC' } });
  }

  async usageByResource(): Promise<PopularResource[]> {
    const rows = await this.repository
      .createQueryBuilder('usage')
      .select('usage.resourceId', 'resourceId')
      .addSelect('usage.resourceName', 'resourceName')
      .addSelect('COUNT(*)', 'successfulUses')
      .where('usage.decision = :decision', { decision: AccessDecision.ALLOWED })
      .groupBy('usage.resourceId')
      .addGroupBy('usage.resourceName')
      .orderBy('"successfulUses"', 'DESC')
      .addOrderBy('usage.resourceName', 'ASC')
      .getRawMany<PopularResource>();
    return rows.map((row) => ({ ...row, successfulUses: Number(row.successfulUses) }));
  }

  async mostPopularResource(): Promise<PopularResource | null> {
    return (await this.usageByResource())[0] ?? null;
  }

  async usageByPassengerTier(): Promise<TierUsageSummary[]> {
    const rows = await this.repository
      .createQueryBuilder('usage')
      .select('usage.passengerTier', 'passengerTier')
      .addSelect('COUNT(*)', 'totalAttempts')
      .addSelect('SUM(CASE WHEN usage.decision = :allowed THEN 1 ELSE 0 END)', 'successfulUses')
      .addSelect('SUM(CASE WHEN usage.decision = :denied THEN 1 ELSE 0 END)', 'deniedAttempts')
      .setParameters({ allowed: AccessDecision.ALLOWED, denied: AccessDecision.DENIED })
      .groupBy('usage.passengerTier')
      .orderBy(
        `CASE "usage"."passengerTier"
          WHEN 'SILVER' THEN 1
          WHEN 'GOLD' THEN 2
          WHEN 'PLATINUM' THEN 3
        END`,
        'ASC',
      )
      .getRawMany<TierUsageSummary>();
    const summaries = new Map(
      rows.map((row) => [
        row.passengerTier,
        {
          passengerTier: row.passengerTier,
          totalAttempts: Number(row.totalAttempts),
          successfulUses: Number(row.successfulUses),
          deniedAttempts: Number(row.deniedAttempts),
        },
      ]),
    );
    return Object.values(MembershipTier).map(
      (passengerTier) =>
        summaries.get(passengerTier) ?? {
          passengerTier,
          totalAttempts: 0,
          successfulUses: 0,
          deniedAttempts: 0,
        },
    );
  }

  latestActivity(limit: number): Promise<UsageRecord[]> {
    const safeLimit = Math.min(Math.max(limit, 1), 200);
    return this.repository.find({ order: { occurredAt: 'DESC' }, take: safeLimit });
  }
}
