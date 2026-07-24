import { Controller, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { PassengerGuard, PassengerRequest } from '../passengers/passenger.guard';
import { SpaceshipResource } from '../resources/resource.entity';
import { ResourcesService } from '../resources/resources.service';
import { AccessService } from './access.service';

@ApiTags('passenger experience')
@ApiSecurity('passenger')
@UseGuards(PassengerGuard)
@Controller('passenger')
export class PassengerExperienceController {
  constructor(
    private readonly resources: ResourcesService,
    private readonly access: AccessService,
  ) {}

  @Get('resources')
  @ApiOkResponse({ type: SpaceshipResource, isArray: true })
  availableResources(@Req() request: PassengerRequest) {
    return this.resources.findAvailableForTier(request.passenger.tier);
  }

  @Get('history')
  history(@Req() request: PassengerRequest) {
    return this.access.historyForPassenger(request.passenger.id);
  }

  @Post('resources/:resourceId/access')
  attempt(
    @Req() request: PassengerRequest,
    @Param('resourceId', ParseUUIDPipe) resourceId: string,
  ) {
    return this.access.attempt({
      passengerId: request.passenger.id,
      resourceId,
    });
  }
}
