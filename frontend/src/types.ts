export type Tier = 'SILVER' | 'GOLD' | 'PLATINUM';

export type Passenger = {
  id: string;
  name: string;
  email: string;
  tier: Tier;
};

export type ShipResource = {
  id: string;
  name: string;
  description?: string;
  minimumTier: Tier;
  active: boolean;
  zone: string;
  icon: 'sleep' | 'food' | 'oxygen' | 'medical' | 'cabin' | 'recreation';
};

export type AccessDecision = {
  id: string;
  passengerId: string;
  resourceId: string;
  passengerName: string;
  resourceName: string;
  passengerTier: Tier;
  requiredTier: Tier;
  outcome: 'ALLOWED' | 'DENIED';
  reason: 'TIER_ELIGIBLE' | 'INSUFFICIENT_TIER' | 'RESOURCE_INACTIVE';
  attemptedAt: string;
};
