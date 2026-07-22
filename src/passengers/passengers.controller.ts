import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CrewLeadGuard } from '../crew-leads/crew-lead.guard';
import { ChangeTierDto, CreatePassengerDto } from './passenger.dto';
import { Passenger } from './passenger.entity';
import { PassengersService } from './passengers.service';

@ApiTags('passengers')
@ApiSecurity('crew-lead')
@UseGuards(CrewLeadGuard)
@Controller('passengers')
export class PassengersController {
  constructor(private readonly service: PassengersService) {}
  @Post() @ApiCreatedResponse({ type: Passenger }) create(@Body() dto: CreatePassengerDto) {
    return this.service.create(dto);
  }
  @Get() @ApiOkResponse({ type: Passenger, isArray: true }) findAll() {
    return this.service.findAll();
  }
  @Get(':id') findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }
  @Patch(':id/tier') changeTier(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeTierDto,
  ) {
    return this.service.changeTier(id, dto);
  }
}
