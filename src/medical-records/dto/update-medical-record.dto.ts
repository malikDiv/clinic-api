import { PartialType, PickType } from '@nestjs/mapped-types';
import { CreateMedicalRecordDto } from './create-medical-record.dto.js';

export class UpdateMedicalRecordDto extends PartialType(
  PickType(CreateMedicalRecordDto, ['diagnosis', 'notes'] as const),
) {}
