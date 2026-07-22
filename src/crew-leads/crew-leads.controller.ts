import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CrewLeadGuard } from './crew-lead.guard';
import { CrewLead, CrewLeadsService } from './crew-leads.service';

@ApiTags('crew-leads')
@ApiSecurity('crew-lead')
@UseGuards(CrewLeadGuard)
@Controller('crew-leads')
export class CrewLeadsController {
  constructor(private readonly service: CrewLeadsService) {}

  @Get()
  findAll(): readonly CrewLead[] {
    return this.service.findAll();
  }
}
