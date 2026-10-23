import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
} from 'class-validator';

export enum appointmentStatus {
  Waiting = 'waiting',
  Confirmed = 'confirmed',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export class CreateAppointmentDto {
  @IsInt({ message: 'معرّف المريض غير صالح' })
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  patientId?: number;

  @IsInt({ message: 'معرّف الطبيب غير صالح' })
  @IsPositive()
  @Type(() => Number)
  doctorId: number;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'صيغة التاريخ يجب أن تكون YYYY-MM-DD',
  })
  date: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'صيغة الوقت يجب أن تكون HH:mm',
  })
  time: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
