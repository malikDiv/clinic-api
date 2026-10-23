import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Clinic } from '../clinics/entities/clinic.entity.js';
import { Specialty } from '../specialties/entities/specialty.entity.js';
import { User } from '../users/entities/user.entity.js';
import { CreateDoctorDto } from './dto/create-doctor.dto.js';
import { SearchDoctorDto } from './dto/search-doctor.dto.js';
import { UpdateDoctorDto } from './dto/update-doctor.dto.js';
import { Doctor } from './entities/doctor.entity.js';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Specialty)
    private readonly specialtyRepository: Repository<Specialty>,
    @InjectRepository(Clinic)
    private readonly clinicRepository: Repository<Clinic>,
  ) {}

  async create(
    createDoctorDto: CreateDoctorDto,
    currentUser: { id: number; role: string },
    photo?: Express.Multer.File,
  ) {
    this.checkRole(currentUser, ['admin']);

    const user = await this.userRepository.findOneBy({
      id: createDoctorDto.userId,
    });
    if (!user) {
      throw new NotFoundException(
        `User with ID ${createDoctorDto.userId} not found`,
      );
    }
    if (user.role !== 'doctor') {
      throw new ConflictException('المستخدم المحدد ليس طبيباً');
    }

    const specialty = await this.specialtyRepository.findOneBy({
      id: createDoctorDto.specialtyId,
    });
    if (!specialty) {
      throw new NotFoundException(
        `Specialty with ID ${createDoctorDto.specialtyId} not found`,
      );
    }

    const clinic = await this.clinicRepository.findOneBy({
      id: createDoctorDto.clinicId,
    });
    if (!clinic) {
      throw new NotFoundException(
        `Clinic with ID ${createDoctorDto.clinicId} not found`,
      );
    }

    const existingProfile = await this.doctorRepository.findOne({
      where: { user: { id: createDoctorDto.userId } },
    });
    if (existingProfile) {
      throw new ConflictException('يوجد ملف طبيب لهذا المستخدم مسبقاً');
    }

    const doctor = this.doctorRepository.create({
      user,
      specialty,
      clinic,
      consultationFee: createDoctorDto.consultationFee,
      experienceYears: createDoctorDto.experienceYears,
      bio: createDoctorDto.bio,
      photo: photo ? `doctors/${photo.filename}` : null,
    });

    const savedDoctor = await this.doctorRepository.save(doctor);
    return this.sanitizeDoctor(savedDoctor);
  }

  async findAll(searchDoctorDto: SearchDoctorDto) {
    const where: any = {};
    if (searchDoctorDto.specialtyId) {
      where.specialty = { id: searchDoctorDto.specialtyId };
    }
    if (searchDoctorDto.clinicId) {
      where.clinic = { id: searchDoctorDto.clinicId };
    }
    if (searchDoctorDto.maxFee) {
      where.consultationFee = Between(0, searchDoctorDto.maxFee);
    }

    const doctors = await this.doctorRepository.find({
      where,
      relations: { user: true, specialty: true, clinic: true },
    });
    return doctors.map((doctor) => this.sanitizeDoctor(doctor));
  }

  async findOne(id: number) {
    const doctor = await this.getDoctorEntity(id);
    return this.sanitizeDoctor(doctor);
  }

  async findByUser(userId: number): Promise<Doctor> {
    const doctor = await this.doctorRepository.findOne({
      where: { user: { id: userId } },
      relations: { user: true, specialty: true, clinic: true },
    });
    if (!doctor) {
      throw new NotFoundException('لا يوجد ملف طبيب مرتبط بهذا المستخدم');
    }
    return doctor;
  }

  async findMe(currentUser: { id: number; role: string }) {
    const doctor = await this.findByUser(currentUser.id);
    return this.sanitizeDoctor(doctor);
  }

  async update(
    id: number,
    updateDoctorDto: UpdateDoctorDto,
    currentUser: { id: number; role: string },
  ) {
    const doctor = await this.getDoctorEntity(id);

    if (currentUser.role === 'admin') {
      const { specialtyId, clinicId, ...rest } = updateDoctorDto;

      if (specialtyId) {
        const specialty = await this.specialtyRepository.findOneBy({
          id: specialtyId,
        });
        if (!specialty) {
          throw new NotFoundException(
            `Specialty with ID ${specialtyId} not found`,
          );
        }
        doctor.specialty = specialty;
      }

      if (clinicId) {
        const clinic = await this.clinicRepository.findOneBy({ id: clinicId });
        if (!clinic) {
          throw new NotFoundException(`Clinic with ID ${clinicId} not found`);
        }
        doctor.clinic = clinic;
      }

      Object.assign(doctor, rest);
    } else if (currentUser.role === 'doctor') {
      if (doctor.user.id !== currentUser.id) {
        throw new ForbiddenException('لا تملك صلاحية تعديل بيانات هذا الطبيب');
      }
      if (updateDoctorDto.bio !== undefined) {
        doctor.bio = updateDoctorDto.bio;
      }
      if (updateDoctorDto.experienceYears !== undefined) {
        doctor.experienceYears = updateDoctorDto.experienceYears;
      }
    } else {
      throw new ForbiddenException('لا تملك صلاحية تنفيذ هذه العملية');
    }

    const savedDoctor = await this.doctorRepository.save(doctor);
    return this.sanitizeDoctor(savedDoctor);
  }

  async remove(
    id: number,
    currentUser: { id: number; role: string },
  ): Promise<{ message: string }> {
    this.checkRole(currentUser, ['admin']);
    const doctor = await this.getDoctorEntity(id);
    await this.doctorRepository.remove(doctor);
    return { message: 'Doctor deleted successfully' };
  }

  private async getDoctorEntity(id: number): Promise<Doctor> {
    const doctor = await this.doctorRepository.findOne({
      where: { id },
      relations: { user: true, specialty: true, clinic: true },
    });
    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }
    return doctor;
  }

  private sanitizeDoctor(doctor: Doctor) {
    if (doctor.user) {
      const safeUser: any = { ...doctor.user };
      delete safeUser.password;
      return { ...doctor, user: safeUser };
    }
    return { ...doctor };
  }

  private checkRole(currentUser: { role: string }, allowed: string[]) {
    if (!allowed.includes(currentUser.role)) {
      throw new ForbiddenException('لا تملك صلاحية تنفيذ هذه العملية');
    }
  }
}
