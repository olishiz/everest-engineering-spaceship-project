import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { MembershipTier } from '../common/membership-tier';

export class CreatePassengerDto {
  @ApiProperty({ example: 'Avery Stone' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiProperty({ example: 'avery@example.com' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
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
