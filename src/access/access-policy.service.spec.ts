import { MembershipTier } from '../common/membership-tier';
import { AccessPolicyService } from './access-policy.service';
import { AccessDecision, AccessReason } from './usage-record.entity';

describe('AccessPolicyService', () => {
  const policy = new AccessPolicyService();
  it('allows inherited membership access', () =>
    expect(policy.evaluate(MembershipTier.PLATINUM, MembershipTier.SILVER, true)).toEqual({
      decision: AccessDecision.ALLOWED,
      reason: AccessReason.TIER_ELIGIBLE,
    }));
  it('denies insufficient membership', () =>
    expect(policy.evaluate(MembershipTier.SILVER, MembershipTier.GOLD, true).reason).toBe(
      AccessReason.INSUFFICIENT_TIER,
    ));
  it('denies an inactive resource regardless of tier', () =>
    expect(policy.evaluate(MembershipTier.PLATINUM, MembershipTier.SILVER, false).reason).toBe(
      AccessReason.RESOURCE_INACTIVE,
    ));
});
