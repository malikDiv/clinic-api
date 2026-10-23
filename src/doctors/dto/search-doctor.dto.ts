import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsPositive } from 'class-validator';

export class SearchDoctorDto {
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  @IsOptional()
  specialtyId?: number;

  @IsInt()
  @IsPositive()
  @Type(() => Number)
  @IsOptional()
  clinicId?: number;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  @IsOptional()
  maxFee?: number;
}
