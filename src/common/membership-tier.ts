import { ApiProperty } from '@nestjs/swagger';

export enum MembershipTier {
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
}

const TIER_RANK: Record<MembershipTier, number> = {
  [MembershipTier.SILVER]: 1,
  [MembershipTier.GOLD]: 2,
  [MembershipTier.PLATINUM]: 3,
};

/** Encapsulates tier inheritance so callers do not depend on enum string ordering. */
export function meetsMinimumTier(actual: MembershipTier, minimum: MembershipTier): boolean {
  return TIER_RANK[actual] >= TIER_RANK[minimum];
}

export function tiersAvailableTo(tier: MembershipTier): MembershipTier[] {
  return Object.values(MembershipTier).filter((candidate) => meetsMinimumTier(tier, candidate));
}

export class MembershipTierResponse {
  @ApiProperty({ enum: MembershipTier })
  tier: MembershipTier;
}
