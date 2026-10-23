import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { DoctorSchedule } from '../../doctor-schedules/entities/doctor-schedule.entity.js';
import { Doctor } from '../../doctors/entities/doctor.entity.js';

@Entity('clinics')
export class Clinic {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  address: string;

  @Column()
  phone: string;

  @OneToMany(() => Doctor, (doctor) => doctor.clinic)
  doctors: Doctor[];

  @OneToMany(() => DoctorSchedule, (schedule) => schedule.clinic)
  doctorSchedules: DoctorSchedule[];
}
