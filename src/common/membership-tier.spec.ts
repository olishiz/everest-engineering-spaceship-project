import { MembershipTier, meetsMinimumTier } from './membership-tier';

describe('meetsMinimumTier', () => {
  it.each([
    [MembershipTier.SILVER, MembershipTier.SILVER, true],
    [MembershipTier.SILVER, MembershipTier.GOLD, false],
    [MembershipTier.GOLD, MembershipTier.SILVER, true],
    [MembershipTier.PLATINUM, MembershipTier.GOLD, true],
  ])('evaluates %s against %s as %s', (actual, minimum, expected) => {
    expect(meetsMinimumTier(actual, minimum)).toBe(expected);
  });
});
