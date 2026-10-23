import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsPositive, IsString } from 'class-validator';

export class CreateMedicalRecordDto {
  @IsInt({ message: 'معرّف الموعد غير صالح' })
  @IsPositive()
  @Type(() => Number)
  appointmentId: number;

  @IsNotEmpty({ message: 'التشخيص مطلوب' })
  @IsString()
  diagnosis: string;

  @IsNotEmpty({ message: 'الملاحظات مطلوبة' })
  @IsString()
  notes: string;
}
