import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard.js';
import { AppointmentService } from './appointment.service.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto.js';
import { UpdateAppointmentDto } from './dto/update-appointment.dto.js';

@ApiTags('appointments')
@ApiBearerAuth()
@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  create(@Body() createAppointmentDto: CreateAppointmentDto, @Req() req: any) {
    return this.appointmentService.create(createAppointmentDto, req.user);
  }

  @Post('waiting')
  createWaiting(
    @Body() createAppointmentDto: CreateAppointmentDto,
    @Req() req: any,
  ) {
    return this.appointmentService.createWaiting(
      createAppointmentDto,
      req.user,
    );
  }

  @Get()
  findAll(@Req() req: any) {
    return this.appointmentService.findAll(req.user);
  }

  @Get('my')
  findMy(@Req() req: any) {
    return this.appointmentService.findMy(req.user);
  }

  @Get('doctor')
  findDoctorAppointments(
    @Req() req: any,
    @Query('date') date?: string,
    @Query('doctorId') doctorId?: string,
  ) {
    return this.appointmentService.findDoctorAppointments(
      req.user,
      date,
      doctorId ? +doctorId : undefined,
    );
  }

  @Get('waiting/list')
  findWaitingList(
    @Req() req: any,
    @Query('doctorId') doctorId?: string,
    @Query('date') date?: string,
  ) {
    return this.appointmentService.findWaitingList(
      doctorId ? +doctorId : undefined,
      date,
      req.user,
    );
  }

  @Get('patient/:patientId')
  findPatientAppointments(
    @Param('patientId') patientId: string,
    @Req() req: any,
  ) {
    return this.appointmentService.findPatientAppointments(
      +patientId,
      req.user,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.appointmentService.findOne(+id, req.user);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateAppointmentStatusDto: UpdateAppointmentStatusDto,
    @Req() req: any,
  ) {
    return this.appointmentService.updateStatus(
      +id,
      updateAppointmentStatusDto,
      req.user,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
    @Req() req: any,
  ) {
    return this.appointmentService.update(
      +id,
      updateAppointmentDto,
      req.user,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.appointmentService.remove(+id, req.user);
  }
}
