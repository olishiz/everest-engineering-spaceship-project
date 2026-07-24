import { MembershipTier, meetsMinimumTier, tiersAvailableTo } from './membership-tier';

describe('meetsMinimumTier', () => {
  it.each([
    [MembershipTier.SILVER, MembershipTier.SILVER, true],
    [MembershipTier.SILVER, MembershipTier.GOLD, false],
    [MembershipTier.GOLD, MembershipTier.SILVER, true],
    [MembershipTier.GOLD, MembershipTier.GOLD, true],
    [MembershipTier.GOLD, MembershipTier.PLATINUM, false],
    [MembershipTier.PLATINUM, MembershipTier.SILVER, true],
    [MembershipTier.PLATINUM, MembershipTier.GOLD, true],
    [MembershipTier.PLATINUM, MembershipTier.PLATINUM, true],
  ])('evaluates %s against %s as %s', (actual, minimum, expected) => {
    expect(meetsMinimumTier(actual, minimum)).toBe(expected);
  });

  it('returns all inherited tiers available to a passenger', () => {
    expect(tiersAvailableTo(MembershipTier.GOLD)).toEqual([
      MembershipTier.SILVER,
      MembershipTier.GOLD,
    ]);
  });
});
