import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { MembershipTier } from '../common/membership-tier';

export class CreatePassengerDto {
  @ApiProperty({ example: 'Avery Stone' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiProperty({ example: 'avery@example.com' })
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({ enum: MembershipTier })
  @IsEnum(MembershipTier)
  tier: MembershipTier;
}

export class ChangeTierDto {
  @ApiProperty({ enum: MembershipTier })
  @IsEnum(MembershipTier)
  tier: MembershipTier;
}
