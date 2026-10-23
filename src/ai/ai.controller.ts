import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard.js';
import { AiService } from './ai.service.js';

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('medical-summary')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['recordId'],
      properties: {
        recordId: { type: 'number' },
      },
    },
  })
  medicalSummary(@Body('recordId') recordId: number, @Req() req: any) {
    return this.aiService.generateMedicalSummary(Number(recordId), req.user);
  }
}
