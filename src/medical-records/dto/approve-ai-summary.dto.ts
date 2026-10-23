import { IsNotEmpty, IsString } from 'class-validator';

export class ApproveAiSummaryDto {
  @IsNotEmpty({ message: 'نص الملخص مطلوب' })
  @IsString()
  summary: string;
}
