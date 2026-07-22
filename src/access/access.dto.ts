import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AttemptAccessDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() passengerId: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() resourceId: string;
}
