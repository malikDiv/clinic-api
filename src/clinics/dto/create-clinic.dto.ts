import { IsNotEmpty, IsString } from 'class-validator';

export class CreateClinicDto {
  @IsNotEmpty({ message: 'اسم العيادة مطلوب' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'عنوان العيادة مطلوب' })
  @IsString()
  address: string;

  @IsNotEmpty({ message: 'هاتف العيادة مطلوب' })
  @IsString()
  phone: string;
}
