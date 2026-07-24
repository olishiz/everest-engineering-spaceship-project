import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrewLeadsModule } from '../crew-leads/crew-leads.module';
import { Passenger } from './passenger.entity';
import { PassengerGuard } from './passenger.guard';
import { PassengersController } from './passengers.controller';
import { PassengersService } from './passengers.service';

@Module({
  imports: [TypeOrmModule.forFeature([Passenger]), CrewLeadsModule],
  controllers: [PassengersController],
  providers: [PassengersService, PassengerGuard],
  exports: [PassengersService, PassengerGuard],
})
export class PassengersModule {}
