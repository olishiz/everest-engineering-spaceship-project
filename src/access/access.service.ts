import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PassengersService } from '../passengers/passengers.service';
import { ResourcesService } from '../resources/resources.service';
import { AccessPolicyService } from './access-policy.service';
import { AttemptAccessDto } from './access.dto';
import { AccessDecision, UsageRecord } from './usage-record.entity';

export interface PopularResource {
  resourceId: string;
  resourceName: string;
  successfulUses: number;
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
        ...result,
      }),
    );
  }

  historyForPassenger(passengerId: string): Promise<UsageRecord[]> {
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
}
