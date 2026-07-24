export type Tier = 'SILVER' | 'GOLD' | 'PLATINUM';

export type Passenger = {
  id: string;
  name: string;
  email: string;
  tier: Tier;
  createdAt?: string;
  updatedAt?: string;
};

export type ResourceIcon = 'sleep' | 'food' | 'oxygen' | 'medical' | 'cabin' | 'recreation';

export type ShipResource = {
  id: string;
  name: string;
  description?: string;
  minimumTier: Tier;
  active: boolean;
  zone: string;
  icon: ResourceIcon;
  createdAt?: string;
  updatedAt?: string;
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

export type ResourceUsage = {
  resourceId: string;
  resourceName: string;
  successfulUses: number;
};

export type TierUsage = {
  passengerTier: Tier;
  totalAttempts: number;
  successfulUses: number;
  deniedAttempts: number;
};

export type CreatePassengerInput = Pick<Passenger, 'name' | 'email' | 'tier'>;
export type CreateResourceInput = Pick<ShipResource, 'name' | 'description' | 'minimumTier'>;
export type DashboardSection = 'overview' | 'passengers' | 'resources' | 'activity';
