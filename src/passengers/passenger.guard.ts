import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { Request } from 'express';
import { Passenger } from './passenger.entity';
import { PassengersService } from './passengers.service';

export interface PassengerRequest extends Request {
  passenger: Passenger;
}

@Injectable()
export class PassengerGuard implements CanActivate {
  constructor(private readonly passengers: PassengersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<PassengerRequest>();
    const passengerId = request.header('x-passenger-id');
    if (!passengerId || !isUUID(passengerId))
      throw new UnauthorizedException('A valid x-passenger-id header is required');

    try {
      request.passenger = await this.passengers.findOne(passengerId);
      return true;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new UnauthorizedException('A valid x-passenger-id header is required');
      throw error;
    }
  }
}
