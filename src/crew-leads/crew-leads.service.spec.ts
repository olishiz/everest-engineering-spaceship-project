import { CREW_LEADS, CrewLeadsService } from './crew-leads.service';

describe('CrewLeadsService', () => {
  const service = new CrewLeadsService();
  it('exposes exactly three crew leads', () => expect(service.findAll()).toHaveLength(3));
  it('does not accept an unknown identity', () =>
    expect(service.findById('unknown')).toBeUndefined());
  it('finds every member of the fixed manifest', () =>
    CREW_LEADS.forEach((lead) => expect(service.findById(lead.id)).toEqual(lead)));
});
