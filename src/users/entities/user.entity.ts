import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Appointment } from '../../appointments/entities/appointment.entity.js';
import { Doctor } from '../../doctors/entities/doctor.entity.js';
import { MedicalRecord } from '../../medical-records/entities/medical-record.entity.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'int', nullable: true })
  age: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  phone: string;

  @Column({ default: 'patient' })
  role: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Doctor, (doctor) => doctor.user)
  doctors: Doctor[];

  @OneToMany(() => Appointment, (appointment) => appointment.patient)
  appointments: Appointment[];

  @OneToMany(() => MedicalRecord, (record) => record.patient)
  medicalRecords: MedicalRecord[];
}
