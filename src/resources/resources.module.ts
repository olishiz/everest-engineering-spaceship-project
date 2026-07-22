import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrewLeadsModule } from '../crew-leads/crew-leads.module';
import { SpaceshipResource } from './resource.entity';
import { ResourcesController } from './resources.controller';
import { ResourcesService } from './resources.service';

@Module({
  imports: [TypeOrmModule.forFeature([SpaceshipResource]), CrewLeadsModule],
  controllers: [ResourcesController],
  providers: [ResourcesService],
  exports: [ResourcesService],
})
export class ResourcesModule {}
