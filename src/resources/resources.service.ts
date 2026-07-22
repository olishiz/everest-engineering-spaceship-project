import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateResourceDto } from './resource.dto';
import { SpaceshipResource } from './resource.entity';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectRepository(SpaceshipResource) private readonly repository: Repository<SpaceshipResource>,
  ) {}
  async create(dto: CreateResourceDto): Promise<SpaceshipResource> {
    const name = dto.name.trim();
    if (await this.repository.existsBy({ name }))
      throw new ConflictException('Resource name already exists');
    return this.repository.save(
      this.repository.create({ ...dto, name, description: dto.description?.trim() ?? '' }),
    );
  }
  findAll(): Promise<SpaceshipResource[]> {
    return this.repository.find({ order: { name: 'ASC' } });
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
