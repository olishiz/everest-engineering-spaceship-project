import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrewLeadsModule } from '../crew-leads/crew-leads.module';
import { PassengersModule } from '../passengers/passengers.module';
import { ResourcesModule } from '../resources/resources.module';
import { AccessController } from './access.controller';
import { AccessPolicyService } from './access-policy.service';
import { AccessService } from './access.service';
import { PassengerExperienceController } from './passenger-experience.controller';
import { UsageRecord } from './usage-record.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UsageRecord]),
    PassengersModule,
    ResourcesModule,
    CrewLeadsModule,
  ],
  controllers: [AccessController, PassengerExperienceController],
  providers: [AccessService, AccessPolicyService],
  exports: [AccessService],
})
export class AccessModule {}
