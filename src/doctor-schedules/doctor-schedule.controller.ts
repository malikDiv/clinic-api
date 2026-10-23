import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard.js';
import { CreateDoctorScheduleDto } from './dto/create-doctor-schedule.dto.js';
import { UpdateDoctorScheduleDto } from './dto/update-doctor-schedule.dto.js';
import { DoctorScheduleService } from './doctor-schedule.service.js';

@ApiTags('doctor-schedules')
@Controller('doctor-schedules')
export class DoctorScheduleController {
  constructor(
    private readonly doctorScheduleService: DoctorScheduleService,
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createDoctorScheduleDto: CreateDoctorScheduleDto,
    @Req() req: any,
  ) {
    return this.doctorScheduleService.create(createDoctorScheduleDto, req.user);
  }

  @Get('doctor/:doctorId')
  findByDoctor(@Param('doctorId') doctorId: string) {
    return this.doctorScheduleService.findByDoctor(+doctorId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.doctorScheduleService.findOne(+id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateDoctorScheduleDto: UpdateDoctorScheduleDto,
    @Req() req: any,
  ) {
    return this.doctorScheduleService.update(
      +id,
      updateDoctorScheduleDto,
      req.user,
    );
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.doctorScheduleService.remove(+id, req.user);
  }
}
