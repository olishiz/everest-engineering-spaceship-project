import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { MembershipTier } from '../common/membership-tier';

export enum AccessDecision {
  ALLOWED = 'ALLOWED',
  DENIED = 'DENIED',
}
export enum AccessReason {
  TIER_ELIGIBLE = 'TIER_ELIGIBLE',
  INSUFFICIENT_TIER = 'INSUFFICIENT_TIER',
  RESOURCE_INACTIVE = 'RESOURCE_INACTIVE',
}

@Entity('usage_records')
@Index(['passengerId', 'occurredAt'])
@Index(['resourceId', 'decision'])
export class UsageRecord {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column('uuid') passengerId: string;
  @Column('uuid') resourceId: string;
  // Snapshots keep audit output understandable if a related record changes later.
  @Column({ length: 120 }) passengerName: string;
  @Column({ length: 120 }) resourceName: string;
  @Column({ type: 'enum', enum: MembershipTier, enumName: 'membership_tier_enum' })
  passengerTier: MembershipTier;
  @Column({ type: 'enum', enum: MembershipTier, enumName: 'membership_tier_enum' })
  requiredTier: MembershipTier;
  @Column({ type: 'enum', enum: AccessDecision, enumName: 'access_decision_enum' })
  decision: AccessDecision;
  @Column({ type: 'enum', enum: AccessReason, enumName: 'access_reason_enum' })
  reason: AccessReason;
  @CreateDateColumn() occurredAt: Date;
}
