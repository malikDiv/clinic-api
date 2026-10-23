import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Appointment } from '../../appointments/entities/appointment.entity.js';
import { Clinic } from '../../clinics/entities/clinic.entity.js';
import { DoctorSchedule } from '../../doctor-schedules/entities/doctor-schedule.entity.js';
import { MedicalRecord } from '../../medical-records/entities/medical-record.entity.js';
import { Specialty } from '../../specialties/entities/specialty.entity.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('doctors')
export class Doctor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal', { precision: 10, scale: 2 })
  consultationFee: number;

  @Column({ type: 'int', nullable: true })
  experienceYears: number;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  photo: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.doctors, { onDelete: 'CASCADE' })
  user: Relation<User>;

  @ManyToOne(() => Specialty, (specialty) => specialty.doctors, {
    onDelete: 'CASCADE',
  })
  specialty: Relation<Specialty>;

  @ManyToOne(() => Clinic, (clinic) => clinic.doctors, { onDelete: 'CASCADE' })
  clinic: Relation<Clinic>;

  @OneToMany(() => DoctorSchedule, (schedule) => schedule.doctor)
  schedules: DoctorSchedule[];

  @OneToMany(() => Appointment, (appointment) => appointment.doctor)
  appointments: Appointment[];

  @OneToMany(() => MedicalRecord, (record) => record.doctor)
  medicalRecords: MedicalRecord[];
}
