import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Clinic } from '../../clinics/entities/clinic.entity.js';
import { Doctor } from '../../doctors/entities/doctor.entity.js';

@Entity('doctor_schedules')
export class DoctorSchedule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int')
  dayOfWeek: number;

  @Column({ type: 'varchar', length: 5 })
  startTime: string;

  @Column({ type: 'varchar', length: 5 })
  endTime: string;

  @ManyToOne(() => Doctor, (doctor) => doctor.schedules, { onDelete: 'CASCADE' })
  doctor: Relation<Doctor>;

  @ManyToOne(() => Clinic, (clinic) => clinic.doctorSchedules, {
    onDelete: 'CASCADE',
  })
  clinic: Relation<Clinic>;
}
