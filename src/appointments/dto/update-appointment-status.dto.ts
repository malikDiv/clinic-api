import { IsEnum } from 'class-validator';
import { appointmentStatus } from './create-appointment.dto.js';

export class UpdateAppointmentStatusDto {
  @IsEnum(appointmentStatus, { message: 'حالة الموعد غير صالحة' })
  status: appointmentStatus;
}
