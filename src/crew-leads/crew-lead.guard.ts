import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { CrewLeadsService } from './crew-leads.service';

@Injectable()
export class CrewLeadGuard implements CanActivate {
  constructor(private readonly crewLeads: CrewLeadsService) {}

  canActivate(context: ExecutionContext): boolean {
    const id = context.switchToHttp().getRequest<Request>().header('x-crew-lead-id');
    if (!id || !this.crewLeads.findById(id)) {
      throw new UnauthorizedException('A valid x-crew-lead-id header is required');
    }
    return true;
  }
}
