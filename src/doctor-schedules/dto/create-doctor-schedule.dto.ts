import { Type } from 'class-transformer';
import {
  IsInt,
  IsPositive,
  Matches,
  Min,
} from 'class-validator';

export class CreateDoctorScheduleDto {
  @IsInt({ message: 'معرّف الطبيب غير صالح' })
  @IsPositive()
  @Type(() => Number)
  doctorId: number;

  @IsInt({ message: 'معرّف العيادة غير صالح' })
  @IsPositive()
  @Type(() => Number)
  clinicId: number;

  @IsInt({ message: 'يوم الأسبوع غير صالح' })
  @Min(0)
  @Type(() => Number)
  dayOfWeek: number;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'صيغة وقت البداية يجب أن تكون HH:mm' })
  startTime: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'صيغة وقت النهاية يجب أن تكون HH:mm' })
  endTime: string;
}
