import { Module } from '@nestjs/common';
import { CrewLeadGuard } from './crew-lead.guard';
import { CrewLeadsController } from './crew-leads.controller';
import { CrewLeadsService } from './crew-leads.service';

@Module({
  controllers: [CrewLeadsController],
  providers: [CrewLeadsService, CrewLeadGuard],
  exports: [CrewLeadsService, CrewLeadGuard],
})
export class CrewLeadsModule {}
