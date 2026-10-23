import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from '../appointments/entities/appointment.entity.js';
import { User } from '../users/entities/user.entity.js';
import { MedicalRecord } from './entities/medical-record.entity.js';
import { MedicalRecordController } from './medical-record.controller.js';
import { MedicalRecordService } from './medical-record.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([MedicalRecord, User, Appointment])],
  controllers: [MedicalRecordController],
  providers: [MedicalRecordService],
  exports: [MedicalRecordService],
})
export class MedicalRecordModule {}
