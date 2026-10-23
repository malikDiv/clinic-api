import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class CreateDoctorDto {
  @IsInt({ message: 'معرّف المستخدم غير صالح' })
  @IsPositive()
  @Type(() => Number)
  userId: number;

  @IsInt({ message: 'معرّف التخصص غير صالح' })
  @IsPositive()
  @Type(() => Number)
  specialtyId: number;

  @IsInt({ message: 'معرّف العيادة غير صالح' })
  @IsPositive()
  @Type(() => Number)
  clinicId: number;

  @IsNumber({}, { message: 'أجرة الكشف غير صالحة' })
  @IsPositive({ message: 'أجرة الكشف يجب أن تكون أكبر من صفر' })
  @Type(() => Number)
  consultationFee: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  experienceYears?: number;

  @IsString()
  @IsOptional()
  bio?: string;
}
