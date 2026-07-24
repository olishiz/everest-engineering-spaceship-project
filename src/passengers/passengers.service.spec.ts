import { ConflictException, NotFoundException } from '@nestjs/common';
import { QueryFailedError, Repository } from 'typeorm';
import { MembershipTier } from '../common/membership-tier';
import { Passenger } from './passenger.entity';
import { PassengersService } from './passengers.service';

describe('PassengersService', () => {
  let repository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOneBy: jest.Mock;
  };
  let service: PassengersService;

  beforeEach(() => {
    repository = {
      create: jest.fn((value) => value as Passenger),
      save: jest.fn((value) => Promise.resolve(value as Passenger)),
      find: jest.fn(),
      findOneBy: jest.fn(),
    };
    service = new PassengersService(repository as unknown as Repository<Passenger>);
  });

  it('normalizes a profile before persistence', async () => {
    await service.create({
      name: '  Nova Reed ',
      email: ' NOVA@EXAMPLE.COM ',
      tier: MembershipTier.SILVER,
    });
    expect(repository.create).toHaveBeenCalledWith({
      name: 'Nova Reed',
      email: 'nova@example.com',
      tier: MembershipTier.SILVER,
    });
  });

  it('maps database uniqueness violations to a stable conflict', async () => {
    const driverError = Object.assign(new Error('duplicate'), { code: '23505' });
    repository.save.mockRejectedValue(new QueryFailedError('INSERT', [], driverError));
    await expect(
      service.create({
        name: 'Nova',
        email: 'nova@example.com',
        tier: MembershipTier.SILVER,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('propagates non-unique database failures', async () => {
    const failure = new Error('database unavailable');
    repository.save.mockRejectedValue(failure);
    await expect(
      service.create({
        name: 'Nova',
        email: 'nova@example.com',
        tier: MembershipTier.SILVER,
      }),
    ).rejects.toBe(failure);
  });

  it('returns passengers in name order', async () => {
    repository.find.mockResolvedValue([]);
    await service.findAll();
    expect(repository.find).toHaveBeenCalledWith({ order: { name: 'ASC' } });
  });

  it('returns a passenger or raises a not-found error', async () => {
    repository.findOneBy.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('changes either direction of membership tier', async () => {
    const passenger = { id: 'p1', tier: MembershipTier.GOLD } as Passenger;
    repository.findOneBy.mockResolvedValue(passenger);
    await service.changeTier('p1', { tier: MembershipTier.SILVER });
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ tier: MembershipTier.SILVER }),
    );
  });
});
