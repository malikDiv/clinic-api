import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Appointment } from '../../appointments/entities/appointment.entity.js';
import { Doctor } from '../../doctors/entities/doctor.entity.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('medical_records')
export class MedicalRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  diagnosis: string;

  @Column({ type: 'text' })
  notes: string;

  @Column({ type: 'text', nullable: true })
  aiSummary: string;

  @Column('int', { default: 0 })
  aiSummaryApproved: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Appointment, (appointment) => appointment.medicalRecords, {
    onDelete: 'CASCADE',
  })
  appointment: Relation<Appointment>;

  @ManyToOne(() => User, (user) => user.medicalRecords, { onDelete: 'CASCADE' })
  patient: Relation<User>;

  @ManyToOne(() => Doctor, (doctor) => doctor.medicalRecords, {
    onDelete: 'CASCADE',
  })
  doctor: Relation<Doctor>;
}
