import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChangeTierDto, CreatePassengerDto } from './passenger.dto';
import { Passenger } from './passenger.entity';

@Injectable()
export class PassengersService {
  constructor(@InjectRepository(Passenger) private readonly repository: Repository<Passenger>) {}

  async create(dto: CreatePassengerDto): Promise<Passenger> {
    const email = dto.email.trim().toLowerCase();
    if (await this.repository.existsBy({ email }))
      throw new ConflictException('Passenger email already exists');
    return this.repository.save(this.repository.create({ ...dto, name: dto.name.trim(), email }));
  }

  findAll(): Promise<Passenger[]> {
    return this.repository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Passenger> {
    const passenger = await this.repository.findOneBy({ id });
    if (!passenger) throw new NotFoundException(`Passenger ${id} was not found`);
    return passenger;
  }

  async changeTier(id: string, dto: ChangeTierDto): Promise<Passenger> {
    const passenger = await this.findOne(id);
    passenger.tier = dto.tier;
    return this.repository.save(passenger);
  }
}
