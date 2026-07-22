import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrewLeadsModule } from '../crew-leads/crew-leads.module';
import { PassengersModule } from '../passengers/passengers.module';
import { ResourcesModule } from '../resources/resources.module';
import { AccessController } from './access.controller';
import { AccessPolicyService } from './access-policy.service';
import { AccessService } from './access.service';
import { UsageRecord } from './usage-record.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UsageRecord]),
    PassengersModule,
    ResourcesModule,
    CrewLeadsModule,
  ],
  controllers: [AccessController],
  providers: [AccessService, AccessPolicyService],
})
export class AccessModule {}
