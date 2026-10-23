import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClinicController } from './clinic.controller.js';
import { ClinicService } from './clinic.service.js';
import { Clinic } from './entities/clinic.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Clinic])],
  controllers: [ClinicController],
  providers: [ClinicService],
})
export class ClinicModule {}
