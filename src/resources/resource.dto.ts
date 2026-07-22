import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { MembershipTier } from '../common/membership-tier';

export class CreateResourceDto {
  @ApiProperty({ example: 'Observation Deck' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
  @ApiProperty({ enum: MembershipTier })
  @IsEnum(MembershipTier)
  minimumTier: MembershipTier;
}
