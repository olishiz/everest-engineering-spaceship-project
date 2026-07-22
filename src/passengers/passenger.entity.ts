import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MembershipTier } from '../common/membership-tier';

@Entity('passengers')
export class Passenger {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ length: 120 }) name: string;
  @Column({ unique: true, length: 254 }) email: string;
  @Column({ type: 'enum', enum: MembershipTier }) tier: MembershipTier;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
