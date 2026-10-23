import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Doctor } from '../../doctors/entities/doctor.entity.js';
import { MedicalRecord } from '../../medical-records/entities/medical-record.entity.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 10 })
  date: string;

  @Column({ type: 'varchar', length: 5 })
  time: string;

  @Column()
  status: string;

  @Column({ default: 'unpaid' })
  paymentStatus: string;

  @Column('decimal', { precision: 10, scale: 2 })
  fee: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.appointments, { onDelete: 'CASCADE' })
  patient: Relation<User>;

  @ManyToOne(() => Doctor, (doctor) => doctor.appointments, {
    onDelete: 'CASCADE',
  })
  doctor: Relation<Doctor>;

  @OneToMany(() => MedicalRecord, (record) => record.appointment)
  medicalRecords: MedicalRecord[];
}
