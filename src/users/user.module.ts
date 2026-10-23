import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from '../appointments/entities/appointment.entity.js';
import { DoctorSchedule } from '../doctor-schedules/entities/doctor-schedule.entity.js';
import { Doctor } from '../doctors/entities/doctor.entity.js';
import { MedicalRecord } from '../medical-records/entities/medical-record.entity.js';
import { User } from './entities/user.entity.js';
import { UserController } from './user.controller.js';
import { UserService } from './user.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Doctor,
      DoctorSchedule,
      Appointment,
      MedicalRecord,
    ]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
