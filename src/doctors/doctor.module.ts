import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Clinic } from '../clinics/entities/clinic.entity.js';
import { Specialty } from '../specialties/entities/specialty.entity.js';
import { User } from '../users/entities/user.entity.js';
import { DoctorController } from './doctor.controller.js';
import { DoctorService } from './doctor.service.js';
import { Doctor } from './entities/doctor.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Doctor, User, Specialty, Clinic])],
  controllers: [DoctorController],
  providers: [DoctorService],
  exports: [DoctorService],
})
export class DoctorModule {}
