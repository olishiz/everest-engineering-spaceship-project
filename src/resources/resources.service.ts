import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, QueryFailedError, Repository } from 'typeorm';
import { MembershipTier, tiersAvailableTo } from '../common/membership-tier';
import { CreateResourceDto } from './resource.dto';
import { SpaceshipResource } from './resource.entity';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectRepository(SpaceshipResource) private readonly repository: Repository<SpaceshipResource>,
  ) {}
  async create(dto: CreateResourceDto): Promise<SpaceshipResource> {
    const name = dto.name.trim();
    try {
      return await this.repository.save(
        this.repository.create({ ...dto, name, description: dto.description?.trim() ?? '' }),
      );
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === '23505'
      )
        throw new ConflictException('Resource name already exists');
      throw error;
    }
  }
  findAll(): Promise<SpaceshipResource[]> {
    return this.repository.find({ order: { name: 'ASC' } });
  }
  findAvailableForTier(tier: MembershipTier): Promise<SpaceshipResource[]> {
    const where: FindOptionsWhere<SpaceshipResource> = {
      active: true,
      minimumTier: In(tiersAvailableTo(tier)),
    };
    return this.repository.find({ where, order: { name: 'ASC' } });
  }
  async findOne(id: string): Promise<SpaceshipResource> {
    const resource = await this.repository.findOneBy({ id });
    if (!resource) throw new NotFoundException(`Resource ${id} was not found`);
    return resource;
  }
  async decommission(id: string): Promise<SpaceshipResource> {
    const resource = await this.findOne(id);
    if (resource.active) {
      resource.active = false;
      return this.repository.save(resource);
    }
    return resource;
  }
}
