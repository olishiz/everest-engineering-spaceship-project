import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CrewLeadGuard } from '../crew-leads/crew-lead.guard';
import { AttemptAccessDto } from './access.dto';
import { AccessService } from './access.service';

@ApiTags('access')
@Controller('access')
export class AccessController {
  constructor(private readonly service: AccessService) {}
  @Post('attempts') attempt(@Body() dto: AttemptAccessDto) {
    return this.service.attempt(dto);
  }
  @Get('passengers/:passengerId/history')
  @ApiSecurity('crew-lead')
  @UseGuards(CrewLeadGuard)
  history(@Param('passengerId', ParseUUIDPipe) id: string) {
    return this.service.historyForPassenger(id);
  }
  @Get('reports/resources')
  @ApiSecurity('crew-lead')
  @UseGuards(CrewLeadGuard)
  byResource() {
    return this.service.usageByResource();
  }
  @Get('reports/most-popular')
  @ApiSecurity('crew-lead')
  @UseGuards(CrewLeadGuard)
  mostPopular() {
    return this.service.mostPopularResource();
  }
}
