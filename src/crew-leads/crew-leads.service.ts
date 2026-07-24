import { Injectable } from '@nestjs/common';

export interface CrewLead {
  readonly id: string;
  readonly name: string;
}

/** Fixed manifest guarantees the spaceship always has exactly three administrative leads. */
export const CREW_LEADS: readonly CrewLead[] = Object.freeze([
  Object.freeze({ id: '00000000-0000-4000-8000-000000000001', name: 'Crew Lead Alpha' }),
  Object.freeze({ id: '00000000-0000-4000-8000-000000000002', name: 'Crew Lead Beta' }),
  Object.freeze({ id: '00000000-0000-4000-8000-000000000003', name: 'Crew Lead Gamma' }),
]);

@Injectable()
export class CrewLeadsService {
  findById(id: string): CrewLead | undefined {
    return CREW_LEADS.find((lead) => lead.id === id);
  }

  findAll(): readonly CrewLead[] {
    return CREW_LEADS;
  }
}
