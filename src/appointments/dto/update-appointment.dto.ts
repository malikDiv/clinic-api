import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum appointmentPaymentStatus {
  Unpaid = 'unpaid',
  Paid = 'paid',
}

export class UpdateAppointmentDto {
  @IsEnum(appointmentPaymentStatus, { message: 'حالة الدفع غير صالحة' })
  @IsOptional()
  paymentStatus?: appointmentPaymentStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}
