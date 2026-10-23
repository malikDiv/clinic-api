import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard.js';
import { ApproveAiSummaryDto } from './dto/approve-ai-summary.dto.js';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto.js';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto.js';
import { MedicalRecordService } from './medical-record.service.js';

@ApiTags('medical-records')
@ApiBearerAuth()
@Controller('medical-records')
@UseGuards(JwtAuthGuard)
export class MedicalRecordController {
  constructor(
    private readonly medicalRecordService: MedicalRecordService,
  ) {}

  @Post()
  create(
    @Body() createMedicalRecordDto: CreateMedicalRecordDto,
    @Req() req: any,
  ) {
    return this.medicalRecordService.create(createMedicalRecordDto, req.user);
  }

  @Get('my')
  findMy(@Req() req: any) {
    return this.medicalRecordService.findMy(req.user);
  }

  @Get('patient/:patientId')
  findByPatient(
    @Param('patientId') patientId: string,
    @Req() req: any,
  ) {
    return this.medicalRecordService.findByPatient(+patientId, req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.medicalRecordService.findOne(+id, req.user);
  }

  @Patch(':id/ai-summary/approve')
  approveAiSummary(
    @Param('id') id: string,
    @Body() approveAiSummaryDto: ApproveAiSummaryDto,
    @Req() req: any,
  ) {
    return this.medicalRecordService.approveAiSummary(
      +id,
      approveAiSummaryDto,
      req.user,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateMedicalRecordDto: UpdateMedicalRecordDto,
    @Req() req: any,
  ) {
    return this.medicalRecordService.update(
      +id,
      updateMedicalRecordDto,
      req.user,
    );
  }
}
