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
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CrewLeadGuard } from '../crew-leads/crew-lead.guard';
import { CreateResourceDto } from './resource.dto';
import { ResourcesService } from './resources.service';

@ApiTags('resources')
@ApiSecurity('crew-lead')
@UseGuards(CrewLeadGuard)
@Controller('resources')
export class ResourcesController {
  constructor(private readonly service: ResourcesService) {}
  @Post() create(@Body() dto: CreateResourceDto) {
    return this.service.create(dto);
  }
  @Get() findAll() {
    return this.service.findAll();
  }
  @Get(':id') findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }
  @Patch(':id/decommission') decommission(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.decommission(id);
  }
}
