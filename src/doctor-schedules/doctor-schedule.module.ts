import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Clinic } from '../clinics/entities/clinic.entity.js';
import { Doctor } from '../doctors/entities/doctor.entity.js';
import { DoctorScheduleController } from './doctor-schedule.controller.js';
import { DoctorScheduleService } from './doctor-schedule.service.js';
import { DoctorSchedule } from './entities/doctor-schedule.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([DoctorSchedule, Doctor, Clinic])],
  controllers: [DoctorScheduleController],
  providers: [DoctorScheduleService],
})
export class DoctorScheduleModule {}
