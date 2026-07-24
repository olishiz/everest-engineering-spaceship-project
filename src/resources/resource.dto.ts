import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { MembershipTier } from '../common/membership-tier';

export class CreateResourceDto {
  @ApiProperty({ example: 'Observation Deck' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;
  @ApiProperty({ required: false })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
  @ApiProperty({ enum: MembershipTier })
  @IsEnum(MembershipTier)
  minimumTier: MembershipTier;
}
