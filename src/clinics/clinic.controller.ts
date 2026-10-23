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
import { ClinicService } from './clinic.service.js';
import { CreateClinicDto } from './dto/create-clinic.dto.js';
import { UpdateClinicDto } from './dto/update-clinic.dto.js';

@ApiTags('clinics')
@Controller('clinics')
export class ClinicController {
  constructor(private readonly clinicService: ClinicService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(@Body() createClinicDto: CreateClinicDto, @Req() req: any) {
    return this.clinicService.create(createClinicDto, req.user);
  }

  @Get()
  findAll() {
    return this.clinicService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clinicService.findOne(+id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateClinicDto: UpdateClinicDto,
    @Req() req: any,
  ) {
    return this.clinicService.update(+id, updateClinicDto, req.user);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.clinicService.remove(+id, req.user);
  }
}
