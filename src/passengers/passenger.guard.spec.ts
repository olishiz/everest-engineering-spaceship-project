import { ExecutionContext, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Passenger } from './passenger.entity';
import { PassengerGuard, PassengerRequest } from './passenger.guard';
import { PassengersService } from './passengers.service';

describe('PassengerGuard', () => {
  const passengerId = '6cbf0e48-8729-4c82-9a2f-b6c9146c35b9';
  const passenger = { id: passengerId } as Passenger;
  const passengers = { findOne: jest.fn() };
  const guard = new PassengerGuard(passengers as unknown as PassengersService);

  function context(header?: string): { context: ExecutionContext; request: PassengerRequest } {
    const request = {
      header: jest.fn().mockReturnValue(header),
    } as unknown as PassengerRequest;
    return {
      request,
      context: {
        switchToHttp: () => ({ getRequest: () => request }),
      } as ExecutionContext,
    };
  }

  beforeEach(() => jest.clearAllMocks());

  it('attaches an authenticated passenger to the request', async () => {
    const { context: executionContext, request } = context(passengerId);
    passengers.findOne.mockResolvedValue(passenger);
    await expect(guard.canActivate(executionContext)).resolves.toBe(true);
    expect(request.passenger).toBe(passenger);
  });

  it('rejects a missing or unknown identity', async () => {
    await expect(guard.canActivate(context().context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    passengers.findOne.mockRejectedValue(new NotFoundException());
    await expect(guard.canActivate(context(passengerId).context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('does not disguise infrastructure failures as authentication failures', async () => {
    const failure = new Error('database unavailable');
    passengers.findOne.mockRejectedValue(failure);
    await expect(guard.canActivate(context(passengerId).context)).rejects.toBe(failure);
  });
});
