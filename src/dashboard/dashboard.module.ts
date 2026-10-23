import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from '../appointments/entities/appointment.entity.js';
import { Doctor } from '../doctors/entities/doctor.entity.js';
import { User } from '../users/entities/user.entity.js';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, User, Doctor])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
