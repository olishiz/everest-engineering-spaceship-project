import { ConflictException, NotFoundException } from '@nestjs/common';
import { QueryFailedError, Repository } from 'typeorm';
import { MembershipTier } from '../common/membership-tier';
import { SpaceshipResource } from './resource.entity';
import { ResourcesService } from './resources.service';

describe('ResourcesService', () => {
  let repository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOneBy: jest.Mock;
  };
  let service: ResourcesService;

  beforeEach(() => {
    repository = {
      create: jest.fn((value) => value as SpaceshipResource),
      save: jest.fn((value) => Promise.resolve(value as SpaceshipResource)),
      find: jest.fn(),
      findOneBy: jest.fn(),
    };
    service = new ResourcesService(repository as unknown as Repository<SpaceshipResource>);
  });

  it('normalizes a provisioned resource', async () => {
    await service.create({
      name: '  Medical Bay ',
      description: '  Advanced care. ',
      minimumTier: MembershipTier.GOLD,
    });
    expect(repository.create).toHaveBeenCalledWith({
      name: 'Medical Bay',
      description: 'Advanced care.',
      minimumTier: MembershipTier.GOLD,
    });
  });

  it('maps database uniqueness violations to a stable conflict', async () => {
    const driverError = Object.assign(new Error('duplicate'), { code: '23505' });
    repository.save.mockRejectedValue(new QueryFailedError('INSERT', [], driverError));
    await expect(
      service.create({ name: 'Pod', minimumTier: MembershipTier.SILVER }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('propagates non-unique database failures', async () => {
    const failure = new Error('database unavailable');
    repository.save.mockRejectedValue(failure);
    await expect(service.create({ name: 'Pod', minimumTier: MembershipTier.SILVER })).rejects.toBe(
      failure,
    );
  });

  it('queries only active resources inherited by the passenger tier', async () => {
    repository.find.mockResolvedValue([]);
    await service.findAvailableForTier(MembershipTier.GOLD);
    expect(repository.find).toHaveBeenCalledTimes(1);
  });

  it('returns all resources in name order', async () => {
    repository.find.mockResolvedValue([]);
    await service.findAll();
    expect(repository.find).toHaveBeenCalledWith({ order: { name: 'ASC' } });
  });

  it('returns a resource or raises a not-found error', async () => {
    repository.findOneBy.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('decommissions an active resource once', async () => {
    const resource = { id: 'r1', active: true } as SpaceshipResource;
    repository.findOneBy.mockResolvedValue(resource);
    await service.decommission('r1');
    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({ active: false }));
  });

  it('keeps repeat decommissioning idempotent', async () => {
    const resource = { id: 'r1', active: false } as SpaceshipResource;
    repository.findOneBy.mockResolvedValue(resource);
    await expect(service.decommission('r1')).resolves.toBe(resource);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
