import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSpecialtyDto {
  @IsNotEmpty({ message: 'اسم التخصص مطلوب' })
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
