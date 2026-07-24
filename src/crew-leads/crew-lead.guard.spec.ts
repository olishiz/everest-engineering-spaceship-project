import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { CrewLeadGuard } from './crew-lead.guard';
import { CrewLeadsService } from './crew-leads.service';

describe('CrewLeadGuard', () => {
  const crewLeads = { findById: jest.fn() };
  const guard = new CrewLeadGuard(crewLeads as unknown as CrewLeadsService);

  function context(header?: string): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ header: jest.fn().mockReturnValue(header) }),
      }),
    } as ExecutionContext;
  }

  beforeEach(() => jest.clearAllMocks());

  it('accepts a known Crew Lead identity', () => {
    crewLeads.findById.mockReturnValue({ id: 'lead-1', name: 'Lead' });
    expect(guard.canActivate(context('lead-1'))).toBe(true);
  });

  it('rejects missing and unknown identities', () => {
    expect(() => guard.canActivate(context())).toThrow(UnauthorizedException);
    crewLeads.findById.mockReturnValue(undefined);
    expect(() => guard.canActivate(context('unknown'))).toThrow(UnauthorizedException);
  });
});
