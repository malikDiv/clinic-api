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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard.js';
import { CreateDoctorDto } from './dto/create-doctor.dto.js';
import { SearchDoctorDto } from './dto/search-doctor.dto.js';
import { UpdateDoctorDto } from './dto/update-doctor.dto.js';
import { DoctorService } from './doctor.service.js';

@ApiTags('doctors')
@Controller('doctors')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['userId', 'specialtyId', 'clinicId', 'consultationFee'],
      properties: {
        userId: { type: 'number' },
        specialtyId: { type: 'number' },
        clinicId: { type: 'number' },
        consultationFee: { type: 'number' },
        experienceYears: { type: 'number' },
        bio: { type: 'string' },
        photo: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: './uploads/doctors',
        filename: (req, file, callback) => {
          const uniqueName = `${Date.now()}${extname(file.originalname)}`;
          callback(null, uniqueName);
        },
      }),
    }),
  )
  create(
    @Body() createDoctorDto: CreateDoctorDto,
    @Req() req: any,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    return this.doctorService.create(createDoctorDto, req.user, photo);
  }

  @Get()
  findAll(@Query() searchDoctorDto: SearchDoctorDto) {
    return this.doctorService.findAll(searchDoctorDto);
  }

  @Get('me/profile')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  findMe(@Req() req: any) {
    return this.doctorService.findMe(req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.doctorService.findOne(+id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateDoctorDto: UpdateDoctorDto,
    @Req() req: any,
  ) {
    return this.doctorService.update(+id, updateDoctorDto, req.user);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Req() req: any) {
    return this.doctorService.remove(+id, req.user);
  }
}
