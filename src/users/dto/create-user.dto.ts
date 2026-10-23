import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  Matches,
  Min,
} from 'class-validator';

export enum userRole {
  Admin = 'admin',
  Doctor = 'doctor',
  Receptionist = 'receptionist',
  Patient = 'patient',
}

export class CreateUserDto {
  @IsNotEmpty({ message: 'الاسم مطلوب' })
  @IsString()
  name: string;

  @IsEmail({}, { message: 'البريد الإلكتروني غير صالح' })
  email: string;

  @Matches(/^09[0-9]{8}$/, { message: 'رقم الهاتف يجب أن يبدأ بـ 09 ويتكون من 10 أرقام' })
  phone: string;

  @IsStrongPassword({}, { message: 'كلمة المرور ضعيفة جداً' })
  password: string;

  @IsEnum(userRole, { message: 'الدور غير صالح' })
  @IsOptional()
  role?: userRole;

  @IsInt()
  @Min(1)
  @IsOptional()
  age?: number;
}
