import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CrewLeadGuard } from '../crew-leads/crew-lead.guard';
import { AttemptAccessDto } from './access.dto';
import { AccessService } from './access.service';

@ApiTags('access')
@Controller('access')
export class AccessController {
  constructor(private readonly service: AccessService) {}
  @Post('attempts')
  @ApiSecurity('crew-lead')
  @UseGuards(CrewLeadGuard)
  attempt(@Body() dto: AttemptAccessDto) {
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
  @Get('reports/tiers')
  @ApiSecurity('crew-lead')
  @UseGuards(CrewLeadGuard)
  byPassengerTier() {
    return this.service.usageByPassengerTier();
  }
  @Get('reports/activity')
  @ApiSecurity('crew-lead')
  @UseGuards(CrewLeadGuard)
  latestActivity(@Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number) {
    return this.service.latestActivity(limit);
  }
}
