import { Module } from '@nestjs/common';
import { MedicalRecordModule } from '../medical-records/medical-record.module.js';
import { AiController } from './ai.controller.js';
import { AiService } from './ai.service.js';

@Module({
  imports: [MedicalRecordModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
