import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MembershipTier } from '../common/membership-tier';

@Entity('resources')
export class SpaceshipResource {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true, length: 120 }) name: string;
  @Column({ type: 'text', default: '' }) description: string;
  @Column({ type: 'enum', enum: MembershipTier }) minimumTier: MembershipTier;
  @Column({ default: true }) active: boolean;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
