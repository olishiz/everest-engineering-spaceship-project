import { Injectable } from '@nestjs/common';
import { MembershipTier, meetsMinimumTier } from '../common/membership-tier';
import { AccessDecision, AccessReason } from './usage-record.entity';

export interface AccessEvaluation {
  decision: AccessDecision;
  reason: AccessReason;
}

@Injectable()
export class AccessPolicyService {
  evaluate(
    passengerTier: MembershipTier,
    minimumTier: MembershipTier,
    resourceActive: boolean,
  ): AccessEvaluation {
    if (!resourceActive)
      return { decision: AccessDecision.DENIED, reason: AccessReason.RESOURCE_INACTIVE };
    if (!meetsMinimumTier(passengerTier, minimumTier))
      return { decision: AccessDecision.DENIED, reason: AccessReason.INSUFFICIENT_TIER };
    return { decision: AccessDecision.ALLOWED, reason: AccessReason.TIER_ELIGIBLE };
  }
}
