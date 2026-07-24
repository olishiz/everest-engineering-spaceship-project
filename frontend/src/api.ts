import type {
  AccessDecision,
  CreatePassengerInput,
  CreateResourceInput,
  Passenger,
  ResourceIcon,
  ResourceUsage,
  ShipResource,
  Tier,
  TierUsage,
} from './types';

export const CREW_LEAD_ID = '00000000-0000-4000-8000-000000000001';
const tierRank: Record<Tier, number> = { SILVER: 1, GOLD: 2, PLATINUM: 3 };
const tiers: Tier[] = ['SILVER', 'GOLD', 'PLATINUM'];

const seedPassengers: Passenger[] = [
  {
    id: '6cbf0e48-8729-4c82-9a2f-b6c9146c35b9',
    name: 'Avery Stone',
    email: 'avery@x26.space',
    tier: 'PLATINUM',
  },
  {
    id: '07a03cf4-5de0-48a8-84aa-3fa649202eef',
    name: 'Mika Chen',
    email: 'mika@x26.space',
    tier: 'GOLD',
  },
  {
    id: '87068ce8-12f1-4a68-8104-4f6d102dd34e',
    name: 'Nova Reed',
    email: 'nova@x26.space',
    tier: 'SILVER',
  },
  {
    id: '932fa70a-5de0-493a-84aa-3fa649202eef',
    name: 'Leo Martins',
    email: 'leo@x26.space',
    tier: 'GOLD',
  },
  {
    id: '242b9a44-8729-4c82-9a2f-b6c9146c35b9',
    name: 'Sana Okafor',
    email: 'sana@x26.space',
    tier: 'SILVER',
  },
];

const seedResources: ShipResource[] = [
  {
    id: 'b5d61d14-ed5e-4394-b3b8-a405447c016f',
    name: 'Cryo Sleep Pods',
    description: 'Adaptive rest chambers with circadian control.',
    minimumTier: 'SILVER',
    active: true,
    zone: 'Habitat ring · A2',
    icon: 'sleep',
  },
  {
    id: '463664b2-b8ac-48fc-9653-b45bb69f782d',
    name: 'Nebula Food Station',
    description: 'Chef-grade molecular nutrition on demand.',
    minimumTier: 'SILVER',
    active: true,
    zone: 'Commons · C1',
    icon: 'food',
  },
  {
    id: '2fc09252-5226-4c90-88d2-b34d1312580b',
    name: 'Oxygen Garden',
    description: 'A living biome for recovery and clear thinking.',
    minimumTier: 'GOLD',
    active: true,
    zone: 'Bio dome · B4',
    icon: 'oxygen',
  },
  {
    id: 'bc209bea-ae0e-47f0-a1e2-93e22116f97c',
    name: 'Advanced Medical Bay',
    description: 'Priority diagnostics and autonomous treatment.',
    minimumTier: 'GOLD',
    active: true,
    zone: 'Core · M1',
    icon: 'medical',
  },
  {
    id: 'ce4dc38d-4188-46e8-a366-c0f221093c74',
    name: 'Aurora Cabin',
    description: 'Private quarters with a panoramic starfield.',
    minimumTier: 'PLATINUM',
    active: true,
    zone: 'Observation ring · P7',
    icon: 'cabin',
  },
  {
    id: '9ed77396-df1d-47d6-a5e4-f9c456f5461a',
    name: 'Zero-G Recreation',
    description: 'Immersive movement arena in zero gravity.',
    minimumTier: 'PLATINUM',
    active: false,
    zone: 'Recreation · R3',
    icon: 'recreation',
  },
];

function iconFor(name: string, index = 0): ResourceIcon {
  const normalized = name.toLowerCase();
  if (normalized.includes('sleep') || normalized.includes('pod')) return 'sleep';
  if (normalized.includes('food')) return 'food';
  if (normalized.includes('oxygen') || normalized.includes('garden')) return 'oxygen';
  if (normalized.includes('medical')) return 'medical';
  if (normalized.includes('cabin')) return 'cabin';
  const icons: ResourceIcon[] = ['sleep', 'food', 'oxygen', 'medical', 'cabin', 'recreation'];
  return icons[index % icons.length];
}

function seedHistory(passengers: Passenger[], resources: ShipResource[]): AccessDecision[] {
  const counts = [14, 11, 9, 7, 4, 2];
  return counts.flatMap((count, resourceIndex) =>
    Array.from({ length: count }, (_, attemptIndex) => {
      const resource = resources[resourceIndex];
      const eligiblePassengers = passengers.filter(
        (passenger) => tierRank[passenger.tier] >= tierRank[resource.minimumTier],
      );
      const passenger = eligiblePassengers[attemptIndex % eligiblePassengers.length];
      const denied = attemptIndex === count - 1 && resource.minimumTier !== 'SILVER';
      const deniedPassenger = denied
        ? passengers.find((item) => tierRank[item.tier] < tierRank[resource.minimumTier])!
        : passenger;
      return {
        id: `seed-${resourceIndex}-${attemptIndex}`,
        passengerId: deniedPassenger.id,
        resourceId: resource.id,
        passengerName: deniedPassenger.name,
        resourceName: resource.name,
        passengerTier: deniedPassenger.tier,
        requiredTier: resource.minimumTier,
        outcome: resource.active && !denied ? 'ALLOWED' : 'DENIED',
        reason: !resource.active
          ? 'RESOURCE_INACTIVE'
          : denied
            ? 'INSUFFICIENT_TIER'
            : 'TIER_ELIGIBLE',
        attemptedAt: new Date(
          Date.now() - (resourceIndex * 12 + attemptIndex + 1) * 1_650_000,
        ).toISOString(),
      } satisfies AccessDecision;
    }),
  );
}

export interface SpaceshipApi {
  getPassengers(): Promise<Passenger[]>;
  createPassenger(input: CreatePassengerInput): Promise<Passenger>;
  updatePassengerTier(id: string, tier: Tier): Promise<Passenger>;
  getResources(): Promise<ShipResource[]>;
  createResource(input: CreateResourceInput): Promise<ShipResource>;
  decommissionResource(id: string): Promise<ShipResource>;
  getResourceUsage(): Promise<ResourceUsage[]>;
  getTierUsage(): Promise<TierUsage[]>;
  getActivity(limit?: number): Promise<AccessDecision[]>;
  getHistory(passengerId: string): Promise<AccessDecision[]>;
  attemptAccess(passengerId: string, resourceId: string): Promise<AccessDecision>;
}

export class DemoSpaceshipApi implements SpaceshipApi {
  private passengers = structuredClone(seedPassengers);
  private resources = structuredClone(seedResources);
  private history = seedHistory(this.passengers, this.resources);

  async getPassengers() {
    return structuredClone(this.passengers.sort((a, b) => a.name.localeCompare(b.name)));
  }

  async createPassenger(input: CreatePassengerInput) {
    const email = input.email.trim().toLowerCase();
    if (this.passengers.some((passenger) => passenger.email === email))
      throw new Error('A passenger with this email already exists.');
    const passenger: Passenger = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      email,
      tier: input.tier,
      createdAt: new Date().toISOString(),
    };
    this.passengers.push(passenger);
    return structuredClone(passenger);
  }

  async updatePassengerTier(id: string, tier: Tier) {
    const passenger = this.passengers.find((item) => item.id === id);
    if (!passenger) throw new Error('Passenger was not found.');
    passenger.tier = tier;
    passenger.updatedAt = new Date().toISOString();
    return structuredClone(passenger);
  }

  async getResources() {
    return structuredClone(this.resources.sort((a, b) => a.name.localeCompare(b.name)));
  }

  async createResource(input: CreateResourceInput) {
    if (
      this.resources.some(
        (resource) => resource.name.toLowerCase() === input.name.trim().toLowerCase(),
      )
    )
      throw new Error('A resource with this name already exists.');
    const resource: ShipResource = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      description: input.description?.trim(),
      minimumTier: input.minimumTier,
      active: true,
      zone: 'Newly provisioned',
      icon: iconFor(input.name, this.resources.length),
      createdAt: new Date().toISOString(),
    };
    this.resources.push(resource);
    return structuredClone(resource);
  }

  async decommissionResource(id: string) {
    const resource = this.resources.find((item) => item.id === id);
    if (!resource) throw new Error('Resource was not found.');
    resource.active = false;
    resource.updatedAt = new Date().toISOString();
    return structuredClone(resource);
  }

  async getResourceUsage() {
    const report = this.resources
      .map((resource) => ({
        resourceId: resource.id,
        resourceName: resource.name,
        successfulUses: this.history.filter(
          (item) => item.resourceId === resource.id && item.outcome === 'ALLOWED',
        ).length,
      }))
      .sort(
        (left, right) =>
          right.successfulUses - left.successfulUses ||
          left.resourceName.localeCompare(right.resourceName),
      );
    return structuredClone(report);
  }

  async getTierUsage() {
    return structuredClone(
      tiers.map((passengerTier) => {
        const attempts = this.history.filter((item) => item.passengerTier === passengerTier);
        return {
          passengerTier,
          totalAttempts: attempts.length,
          successfulUses: attempts.filter((item) => item.outcome === 'ALLOWED').length,
          deniedAttempts: attempts.filter((item) => item.outcome === 'DENIED').length,
        };
      }),
    );
  }

  async getActivity(limit = 50) {
    return structuredClone(
      [...this.history]
        .sort((a, b) => Date.parse(b.attemptedAt) - Date.parse(a.attemptedAt))
        .slice(0, limit),
    );
  }

  async getHistory(passengerId: string) {
    return structuredClone(
      this.history
        .filter((item) => item.passengerId === passengerId)
        .sort((a, b) => Date.parse(b.attemptedAt) - Date.parse(a.attemptedAt)),
    );
  }

  async attemptAccess(passengerId: string, resourceId: string) {
    const passenger = this.passengers.find((item) => item.id === passengerId);
    const resource = this.resources.find((item) => item.id === resourceId);
    if (!passenger || !resource) throw new Error('Passenger or resource was not found.');
    const eligible = tierRank[passenger.tier] >= tierRank[resource.minimumTier];
    const decision: AccessDecision = {
      id: crypto.randomUUID(),
      passengerId,
      resourceId,
      passengerName: passenger.name,
      resourceName: resource.name,
      passengerTier: passenger.tier,
      requiredTier: resource.minimumTier,
      outcome: resource.active && eligible ? 'ALLOWED' : 'DENIED',
      reason: !resource.active
        ? 'RESOURCE_INACTIVE'
        : eligible
          ? 'TIER_ELIGIBLE'
          : 'INSUFFICIENT_TIER',
      attemptedAt: new Date().toISOString(),
    };
    this.history.unshift(decision);
    return structuredClone(decision);
  }
}

type ApiUsageRecord = {
  id: string;
  passengerId: string;
  resourceId: string;
  passengerName: string;
  resourceName: string;
  passengerTier: Tier;
  requiredTier: Tier;
  decision: AccessDecision['outcome'];
  reason: AccessDecision['reason'];
  occurredAt: string;
};

type ApiResource = Omit<ShipResource, 'zone' | 'icon'>;

export class HttpSpaceshipApi implements SpaceshipApi {
  private passengers = new Map<string, Passenger>();
  private resources = new Map<string, ShipResource>();

  constructor(
    private readonly baseUrl: string,
    private readonly crewLeadId = CREW_LEAD_ID,
  ) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl.replace(/\/$/, '')}${path}`, {
      ...init,
      headers: {
        'content-type': 'application/json',
        'x-crew-lead-id': this.crewLeadId,
        ...init?.headers,
      },
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        message?: string | string[];
      } | null;
      const message = Array.isArray(body?.message) ? body.message.join(' ') : body?.message;
      throw new Error(message || `API request failed (${response.status}).`);
    }
    return response.json() as Promise<T>;
  }

  private decorateResource(resource: ApiResource, index = 0): ShipResource {
    return {
      ...resource,
      zone: 'Spaceship X26',
      icon: iconFor(resource.name, index),
    };
  }

  private normalize(record: ApiUsageRecord): AccessDecision {
    return {
      id: record.id,
      passengerId: record.passengerId,
      resourceId: record.resourceId,
      passengerName: record.passengerName,
      resourceName: record.resourceName,
      passengerTier:
        record.passengerTier ?? this.passengers.get(record.passengerId)?.tier ?? 'SILVER',
      requiredTier:
        record.requiredTier ?? this.resources.get(record.resourceId)?.minimumTier ?? 'SILVER',
      outcome: record.decision,
      reason: record.reason,
      attemptedAt: record.occurredAt,
    };
  }

  async getPassengers() {
    const passengers = await this.request<Passenger[]>('/api/passengers');
    passengers.forEach((passenger) => this.passengers.set(passenger.id, passenger));
    return passengers;
  }

  async createPassenger(input: CreatePassengerInput) {
    const passenger = await this.request<Passenger>('/api/passengers', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    this.passengers.set(passenger.id, passenger);
    return passenger;
  }

  async updatePassengerTier(id: string, tier: Tier) {
    const passenger = await this.request<Passenger>(`/api/passengers/${id}/tier`, {
      method: 'PATCH',
      body: JSON.stringify({ tier }),
    });
    this.passengers.set(passenger.id, passenger);
    return passenger;
  }

  async getResources() {
    const resources = await this.request<ApiResource[]>('/api/resources');
    const decorated = resources.map((resource, index) => this.decorateResource(resource, index));
    decorated.forEach((resource) => this.resources.set(resource.id, resource));
    return decorated;
  }

  async createResource(input: CreateResourceInput) {
    const created = await this.request<ApiResource>('/api/resources', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    const resource = this.decorateResource(created, this.resources.size);
    this.resources.set(resource.id, resource);
    return resource;
  }

  async decommissionResource(id: string) {
    const updated = await this.request<ApiResource>(`/api/resources/${id}/decommission`, {
      method: 'PATCH',
    });
    const resource = this.decorateResource(updated);
    this.resources.set(resource.id, resource);
    return resource;
  }

  getResourceUsage() {
    return this.request<ResourceUsage[]>('/api/access/reports/resources');
  }

  getTierUsage() {
    return this.request<TierUsage[]>('/api/access/reports/tiers');
  }

  async getActivity(limit = 50) {
    const records = await this.request<ApiUsageRecord[]>(
      `/api/access/reports/activity?limit=${limit}`,
    );
    return records.map((record) => this.normalize(record));
  }

  async getHistory(passengerId: string) {
    const records = await this.request<ApiUsageRecord[]>(
      `/api/access/passengers/${passengerId}/history`,
    );
    return records.map((record) => this.normalize(record));
  }

  async attemptAccess(passengerId: string, resourceId: string) {
    const record = await this.request<ApiUsageRecord>('/api/access/attempts', {
      method: 'POST',
      body: JSON.stringify({ passengerId, resourceId }),
    });
    return this.normalize(record);
  }
}
