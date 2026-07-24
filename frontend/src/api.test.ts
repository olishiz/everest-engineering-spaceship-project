import { describe, expect, it } from 'vitest';
import { DemoSpaceshipApi } from './api';

describe('DemoSpaceshipApi', () => {
  it('applies inherited membership access and records the decision', async () => {
    const api = new DemoSpaceshipApi();
    const passengers = await api.getPassengers();
    const resources = await api.getResources();
    const platinum = passengers.find((item) => item.tier === 'PLATINUM')!;
    const silverResource = resources.find((item) => item.minimumTier === 'SILVER')!;
    const result = await api.attemptAccess(platinum.id, silverResource.id);
    expect(result.outcome).toBe('ALLOWED');
    expect(result.reason).toBe('TIER_ELIGIBLE');
    expect((await api.getHistory(platinum.id))[0].id).toBe(result.id);
  });

  it('denies access when the passenger tier is too low', async () => {
    const api = new DemoSpaceshipApi();
    const passengers = await api.getPassengers();
    const resources = await api.getResources();
    const silver = passengers.find((item) => item.tier === 'SILVER')!;
    const platinumResource = resources.find((item) => item.minimumTier === 'PLATINUM')!;
    const result = await api.attemptAccess(silver.id, platinumResource.id);
    expect(result.outcome).toBe('DENIED');
    expect(result.reason).toBe('INSUFFICIENT_TIER');
  });

  it('reports successful uses by resource using the backend report shape', async () => {
    const api = new DemoSpaceshipApi();
    const passengers = await api.getPassengers();
    const resources = await api.getResources();
    const platinum = passengers.find((item) => item.tier === 'PLATINUM')!;
    await api.attemptAccess(platinum.id, resources[0].id);
    const report = await api.getResourceUsage();
    expect(
      report.find((item) => item.resourceId === resources[0].id)?.successfulUses,
    ).toBeGreaterThan(0);
    expect(report.every((item) => typeof item.successfulUses === 'number')).toBe(true);
  });

  it('creates a passenger, prevents duplicate emails, and updates membership', async () => {
    const api = new DemoSpaceshipApi();
    const passenger = await api.createPassenger({
      name: '  Maya Chen  ',
      email: 'MAYA@X26.SPACE',
      tier: 'SILVER',
    });

    expect(passenger).toMatchObject({
      name: 'Maya Chen',
      email: 'maya@x26.space',
      tier: 'SILVER',
    });
    await expect(
      api.createPassenger({
        name: 'Duplicate Maya',
        email: 'maya@x26.space',
        tier: 'GOLD',
      }),
    ).rejects.toThrow('already exists');

    const updated = await api.updatePassengerTier(passenger.id, 'PLATINUM');
    expect(updated.tier).toBe('PLATINUM');
    expect((await api.getPassengers()).find((item) => item.id === passenger.id)?.tier).toBe(
      'PLATINUM',
    );
  });

  it('provisions and decommissions resources without erasing their audit identity', async () => {
    const api = new DemoSpaceshipApi();
    const resource = await api.createResource({
      name: 'Observation Lounge',
      description: 'Deep-space viewing gallery.',
      minimumTier: 'GOLD',
    });

    expect(resource).toMatchObject({
      name: 'Observation Lounge',
      active: true,
      minimumTier: 'GOLD',
    });

    const decommissioned = await api.decommissionResource(resource.id);
    expect(decommissioned.active).toBe(false);
    expect((await api.getResources()).find((item) => item.id === resource.id)).toMatchObject({
      name: 'Observation Lounge',
      active: false,
    });
  });

  it('denies inactive resources and includes the decision in activity and tier reports', async () => {
    const api = new DemoSpaceshipApi();
    const passengers = await api.getPassengers();
    const resources = await api.getResources();
    const platinum = passengers.find((item) => item.tier === 'PLATINUM')!;
    const inactive = resources.find((item) => !item.active)!;
    const before = await api.getTierUsage();
    const result = await api.attemptAccess(platinum.id, inactive.id);
    const after = await api.getTierUsage();

    expect(result).toMatchObject({
      outcome: 'DENIED',
      reason: 'RESOURCE_INACTIVE',
    });
    expect((await api.getActivity(1))[0].id).toBe(result.id);
    expect(after.find((item) => item.passengerTier === 'PLATINUM')!.deniedAttempts).toBe(
      before.find((item) => item.passengerTier === 'PLATINUM')!.deniedAttempts + 1,
    );
  });
});
