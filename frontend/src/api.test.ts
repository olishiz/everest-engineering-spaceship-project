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
});
