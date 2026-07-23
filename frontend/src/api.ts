import type { AccessDecision, Passenger, ShipResource, Tier } from './types';

export const CREW_LEAD_ID = '00000000-0000-4000-8000-000000000001';
const tierRank: Record<Tier, number> = { SILVER: 1, GOLD: 2, PLATINUM: 3 };

const demoPassengers: Passenger[] = [
  { id: '6cbf0e48-8729-4c82-9a2f-b6c9146c35b9', name: 'Avery Stone', email: 'avery@x26.space', tier: 'PLATINUM' },
  { id: '07a03cf4-5de0-48a8-84aa-3fa649202eef', name: 'Mika Chen', email: 'mika@x26.space', tier: 'GOLD' },
  { id: '87068ce8-12f1-4a68-8104-4f6d102dd34e', name: 'Nova Reed', email: 'nova@x26.space', tier: 'SILVER' },
];

const demoResources: ShipResource[] = [
  { id: 'b5d61d14-ed5e-4394-b3b8-a405447c016f', name: 'Cryo Sleep Pods', description: 'Adaptive rest chambers with circadian control.', minimumTier: 'SILVER', active: true, zone: 'Habitat ring · A2', icon: 'sleep' },
  { id: '463664b2-b8ac-48fc-9653-b45bb69f782d', name: 'Nebula Food Station', description: 'Chef-grade molecular nutrition on demand.', minimumTier: 'SILVER', active: true, zone: 'Commons · C1', icon: 'food' },
  { id: '2fc09252-5226-4c90-88d2-b34d1312580b', name: 'Oxygen Garden', description: 'A living biome for recovery and clear thinking.', minimumTier: 'GOLD', active: true, zone: 'Bio dome · B4', icon: 'oxygen' },
  { id: 'bc209bea-ae0e-47f0-a1e2-93e22116f97c', name: 'Medical Bay', description: 'Priority diagnostics and autonomous treatment.', minimumTier: 'GOLD', active: true, zone: 'Core · M1', icon: 'medical' },
  { id: 'ce4dc38d-4188-46e8-a366-c0f221093c74', name: 'Aurora Cabin', description: 'Private quarters with a panoramic starfield.', minimumTier: 'PLATINUM', active: true, zone: 'Observation ring · P7', icon: 'cabin' },
  { id: '9ed77396-df1d-47d6-a5e4-f9c456f5461a', name: 'Zero-G Recreation', description: 'Immersive movement arena in zero gravity.', minimumTier: 'PLATINUM', active: true, zone: 'Recreation · R3', icon: 'recreation' },
];

let demoHistory: AccessDecision[] = [
  { id: 'demo-1', passengerId: demoPassengers[0].id, resourceId: demoResources[2].id, passengerName: demoPassengers[0].name, resourceName: demoResources[2].name, passengerTier: demoPassengers[0].tier, requiredTier: demoResources[2].minimumTier, outcome: 'ALLOWED', reason: 'TIER_ELIGIBLE', attemptedAt: new Date(Date.now() - 420000).toISOString() },
  { id: 'demo-2', passengerId: demoPassengers[2].id, resourceId: demoResources[4].id, passengerName: demoPassengers[2].name, resourceName: demoResources[4].name, passengerTier: demoPassengers[2].tier, requiredTier: demoResources[4].minimumTier, outcome: 'DENIED', reason: 'INSUFFICIENT_TIER', attemptedAt: new Date(Date.now() - 1080000).toISOString() },
];

export interface SpaceshipApi {
  getPassengers(): Promise<Passenger[]>;
  getResources(): Promise<ShipResource[]>;
  getHistory(passengerId?: string): Promise<AccessDecision[]>;
  attemptAccess(passengerId: string, resourceId: string): Promise<AccessDecision>;
}

export class DemoSpaceshipApi implements SpaceshipApi {
  async getPassengers() { return structuredClone(demoPassengers); }
  async getResources() { return structuredClone(demoResources); }
  async getHistory(passengerId?: string) {
    return structuredClone(passengerId ? demoHistory.filter((item) => item.passengerId === passengerId) : demoHistory);
  }
  async attemptAccess(passengerId: string, resourceId: string) {
    const passenger = demoPassengers.find((item) => item.id === passengerId);
    const resource = demoResources.find((item) => item.id === resourceId);
    if (!passenger || !resource) throw new Error('Passenger or resource was not found.');
    const eligible = tierRank[passenger.tier] >= tierRank[resource.minimumTier];
    const decision: AccessDecision = {
      id: crypto.randomUUID(), passengerId, resourceId,
      passengerName: passenger.name, resourceName: resource.name,
      passengerTier: passenger.tier, requiredTier: resource.minimumTier,
      outcome: resource.active && eligible ? 'ALLOWED' : 'DENIED',
      reason: !resource.active ? 'RESOURCE_INACTIVE' : eligible ? 'TIER_ELIGIBLE' : 'INSUFFICIENT_TIER',
      attemptedAt: new Date().toISOString(),
    };
    demoHistory = [decision, ...demoHistory];
    return structuredClone(decision);
  }
}

export class HttpSpaceshipApi implements SpaceshipApi {
  constructor(private readonly baseUrl: string, private readonly crewLeadId = CREW_LEAD_ID) {}
  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl.replace(/\/$/, '')}${path}`, {
      ...init,
      headers: { 'content-type': 'application/json', 'x-crew-lead-id': this.crewLeadId, ...init?.headers },
    });
    if (!response.ok) throw new Error((await response.text()) || `API request failed (${response.status}).`);
    return response.json() as Promise<T>;
  }
  getPassengers() { return this.request<Passenger[]>('/api/passengers'); }
  async getResources() {
    const resources = await this.request<Array<Omit<ShipResource, 'zone' | 'icon'>>>('/api/resources');
    const icons: ShipResource['icon'][] = ['sleep', 'food', 'oxygen', 'medical', 'cabin', 'recreation'];
    return resources.map((resource, index) => ({ ...resource, zone: 'Spaceship X26', icon: icons[index % icons.length] }));
  }
  getHistory(passengerId?: string) {
    return passengerId ? this.request<AccessDecision[]>(`/api/access/passengers/${passengerId}/history`) : Promise.resolve([]);
  }
  attemptAccess(passengerId: string, resourceId: string) {
    return this.request<AccessDecision>('/api/access/attempts', { method: 'POST', body: JSON.stringify({ passengerId, resourceId }) });
  }
}
