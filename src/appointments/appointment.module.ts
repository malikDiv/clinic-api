import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorSchedule } from '../doctor-schedules/entities/doctor-schedule.entity.js';
import { Doctor } from '../doctors/entities/doctor.entity.js';
import { DoctorModule } from '../doctors/doctor.module.js';
import { User } from '../users/entities/user.entity.js';
import { AppointmentController } from './appointment.controller.js';
import { AppointmentService } from './appointment.service.js';
import { Appointment } from './entities/appointment.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, User, Doctor, DoctorSchedule]),
    DoctorModule,
  ],
  controllers: [AppointmentController],
  providers: [AppointmentService],
})
export class AppointmentModule {}
