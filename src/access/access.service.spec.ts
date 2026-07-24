import { Repository, SelectQueryBuilder } from 'typeorm';
import { MembershipTier } from '../common/membership-tier';
import { Passenger } from '../passengers/passenger.entity';
import { PassengersService } from '../passengers/passengers.service';
import { SpaceshipResource } from '../resources/resource.entity';
import { ResourcesService } from '../resources/resources.service';
import { AccessPolicyService } from './access-policy.service';
import { AccessService } from './access.service';
import { AccessDecision, AccessReason, UsageRecord } from './usage-record.entity';

describe('AccessService', () => {
  let repository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let passengers: jest.Mocked<Pick<PassengersService, 'findOne'>>;
  let resources: jest.Mocked<Pick<ResourcesService, 'findOne'>>;
  let service: AccessService;

  beforeEach(() => {
    repository = {
      create: jest.fn((value) => value as UsageRecord),
      save: jest.fn((value) => Promise.resolve(value as UsageRecord)),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    passengers = { findOne: jest.fn() };
    resources = { findOne: jest.fn() };
    service = new AccessService(
      repository as unknown as Repository<UsageRecord>,
      passengers as unknown as PassengersService,
      resources as unknown as ResourcesService,
      new AccessPolicyService(),
    );
  });

  it('persists a complete immutable decision snapshot', async () => {
    passengers.findOne.mockResolvedValue({
      id: 'p1',
      name: 'Nova',
      tier: MembershipTier.SILVER,
    } as Passenger);
    resources.findOne.mockResolvedValue({
      id: 'r1',
      name: 'Gold Pod',
      minimumTier: MembershipTier.GOLD,
      active: true,
    } as SpaceshipResource);

    await service.attempt({ passengerId: 'p1', resourceId: 'r1' });

    expect(repository.create).toHaveBeenCalledWith({
      passengerId: 'p1',
      resourceId: 'r1',
      passengerName: 'Nova',
      resourceName: 'Gold Pod',
      passengerTier: MembershipTier.SILVER,
      requiredTier: MembershipTier.GOLD,
      decision: AccessDecision.DENIED,
      reason: AccessReason.INSUFFICIENT_TIER,
    });
  });

  it('validates the passenger before returning history', async () => {
    passengers.findOne.mockResolvedValue({ id: 'p1' } as Passenger);
    repository.find.mockResolvedValue([]);
    await service.historyForPassenger('p1');
    expect(passengers.findOne).toHaveBeenCalledWith('p1');
    expect(repository.find).toHaveBeenCalledWith({
      where: { passengerId: 'p1' },
      order: { occurredAt: 'DESC' },
    });
  });

  it('caps activity report limits', async () => {
    repository.find.mockResolvedValue([]);
    await service.latestActivity(999);
    expect(repository.find).toHaveBeenCalledWith({ order: { occurredAt: 'DESC' }, take: 200 });
    await service.latestActivity(0);
    expect(repository.find).toHaveBeenLastCalledWith({ order: { occurredAt: 'DESC' }, take: 1 });
  });

  it('returns the most popular resource or null', async () => {
    const usageSpy = jest.spyOn(service, 'usageByResource');
    usageSpy.mockResolvedValue([{ resourceId: 'r1', resourceName: 'Pod', successfulUses: 4 }]);
    await expect(service.mostPopularResource()).resolves.toMatchObject({ resourceId: 'r1' });
    usageSpy.mockResolvedValue([]);
    await expect(service.mostPopularResource()).resolves.toBeNull();
  });

  it('converts raw resource report counts to numbers', async () => {
    repository.createQueryBuilder.mockReturnValue(
      queryBuilderReturning([{ resourceId: 'r1', resourceName: 'Pod', successfulUses: '4' }]),
    );
    await expect(service.usageByResource()).resolves.toEqual([
      { resourceId: 'r1', resourceName: 'Pod', successfulUses: 4 },
    ]);
  });

  it('converts raw passenger-tier report counts to numbers', async () => {
    repository.createQueryBuilder.mockReturnValue(
      queryBuilderReturning([
        {
          passengerTier: MembershipTier.GOLD,
          totalAttempts: '5',
          successfulUses: '4',
          deniedAttempts: '1',
        },
      ]),
    );
    await expect(service.usageByPassengerTier()).resolves.toEqual([
      {
        passengerTier: MembershipTier.SILVER,
        totalAttempts: 0,
        successfulUses: 0,
        deniedAttempts: 0,
      },
      {
        passengerTier: MembershipTier.GOLD,
        totalAttempts: 5,
        successfulUses: 4,
        deniedAttempts: 1,
      },
      {
        passengerTier: MembershipTier.PLATINUM,
        totalAttempts: 0,
        successfulUses: 0,
        deniedAttempts: 0,
      },
    ]);
  });
});

function queryBuilderReturning(rows: unknown[]): SelectQueryBuilder<UsageRecord> {
  const builder = {
    select: jest.fn(),
    addSelect: jest.fn(),
    where: jest.fn(),
    groupBy: jest.fn(),
    addGroupBy: jest.fn(),
    orderBy: jest.fn(),
    addOrderBy: jest.fn(),
    setParameters: jest.fn(),
    getRawMany: jest.fn().mockResolvedValue(rows),
  };
  Object.values(builder).forEach((mock) => {
    if (mock !== builder.getRawMany) mock.mockReturnValue(builder);
  });
  return builder as unknown as SelectQueryBuilder<UsageRecord>;
}
