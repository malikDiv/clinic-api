import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Clinic } from '../clinics/entities/clinic.entity.js';
import { Doctor } from '../doctors/entities/doctor.entity.js';
import { CreateDoctorScheduleDto } from './dto/create-doctor-schedule.dto.js';
import { UpdateDoctorScheduleDto } from './dto/update-doctor-schedule.dto.js';
import { DoctorSchedule } from './entities/doctor-schedule.entity.js';

@Injectable()
export class DoctorScheduleService {
  constructor(
    @InjectRepository(DoctorSchedule)
    private readonly scheduleRepository: Repository<DoctorSchedule>,
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
    @InjectRepository(Clinic)
    private readonly clinicRepository: Repository<Clinic>,
  ) {}

  async create(
    createDoctorScheduleDto: CreateDoctorScheduleDto,
    currentUser: { id: number; role: string },
  ): Promise<DoctorSchedule> {
    const doctor = await this.getDoctorWithUser(
      createDoctorScheduleDto.doctorId,
    );
    this.checkScheduleManagement(doctor, currentUser);

    const clinic = await this.clinicRepository.findOneBy({
      id: createDoctorScheduleDto.clinicId,
    });
    if (!clinic) {
      throw new NotFoundException(
        `Clinic with ID ${createDoctorScheduleDto.clinicId} not found`,
      );
    }

    this.validateDayOfWeek(createDoctorScheduleDto.dayOfWeek);
    this.validateTimes(
      createDoctorScheduleDto.startTime,
      createDoctorScheduleDto.endTime,
    );
    await this.checkOverlap(
      doctor.id,
      createDoctorScheduleDto.dayOfWeek,
      createDoctorScheduleDto.startTime,
      createDoctorScheduleDto.endTime,
    );

    const schedule = this.scheduleRepository.create({
      doctor,
      clinic,
      dayOfWeek: createDoctorScheduleDto.dayOfWeek,
      startTime: createDoctorScheduleDto.startTime,
      endTime: createDoctorScheduleDto.endTime,
    });

    const savedSchedule = await this.scheduleRepository.save(schedule);
    return this.stripUserPassword(savedSchedule);
  }

  async findByDoctor(doctorId: number): Promise<DoctorSchedule[]> {
    const doctor = await this.doctorRepository.findOneBy({ id: doctorId });
    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${doctorId} not found`);
    }
    return await this.scheduleRepository.find({
      where: { doctor: { id: doctorId } },
      relations: { clinic: true },
    });
  }

  async findOne(id: number): Promise<DoctorSchedule> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id },
      relations: { doctor: true, clinic: true },
    });
    if (!schedule) {
      throw new NotFoundException(`Doctor schedule with ID ${id} not found`);
    }
    return schedule;
  }

  async update(
    id: number,
    updateDoctorScheduleDto: UpdateDoctorScheduleDto,
    currentUser: { id: number; role: string },
  ) {
    const schedule = await this.getScheduleEntity(id);
    this.checkScheduleManagement(schedule.doctor, currentUser);

    const dayOfWeek = updateDoctorScheduleDto.dayOfWeek ?? schedule.dayOfWeek;
    const startTime = updateDoctorScheduleDto.startTime ?? schedule.startTime;
    const endTime = updateDoctorScheduleDto.endTime ?? schedule.endTime;

    this.validateDayOfWeek(dayOfWeek);
    this.validateTimes(startTime, endTime);
    await this.checkOverlap(
      schedule.doctor.id,
      dayOfWeek,
      startTime,
      endTime,
      id,
    );

    if (updateDoctorScheduleDto.clinicId) {
      const clinic = await this.clinicRepository.findOneBy({
        id: updateDoctorScheduleDto.clinicId,
      });
      if (!clinic) {
        throw new NotFoundException(
          `Clinic with ID ${updateDoctorScheduleDto.clinicId} not found`,
        );
      }
      schedule.clinic = clinic;
    }

    schedule.dayOfWeek = dayOfWeek;
    schedule.startTime = startTime;
    schedule.endTime = endTime;

    const savedSchedule = await this.scheduleRepository.save(schedule);
    return this.stripUserPassword(savedSchedule);
  }

  async remove(
    id: number,
    currentUser: { id: number; role: string },
  ): Promise<{ message: string }> {
    const schedule = await this.getScheduleEntity(id);
    this.checkScheduleManagement(schedule.doctor, currentUser);
    await this.scheduleRepository.remove(schedule);
    return { message: 'Doctor schedule deleted successfully' };
  }

  private async getDoctorWithUser(doctorId: number): Promise<Doctor> {
    const doctor = await this.doctorRepository.findOne({
      where: { id: doctorId },
      relations: { user: true },
    });
    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${doctorId} not found`);
    }
    return doctor;
  }

  private async getScheduleEntity(id: number): Promise<DoctorSchedule> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id },
      relations: { doctor: { user: true }, clinic: true },
    });
    if (!schedule) {
      throw new NotFoundException(`Doctor schedule with ID ${id} not found`);
    }
    return schedule;
  }

  private checkScheduleManagement(
    doctor: Doctor,
    currentUser: { id: number; role: string },
  ) {
    if (currentUser.role === 'admin') {
      return;
    }
    if (currentUser.role === 'doctor' && doctor.user.id === currentUser.id) {
      return;
    }
    throw new ForbiddenException('لا تملك صلاحية إدارة دوام هذا الطبيب');
  }

  private validateDayOfWeek(dayOfWeek: number) {
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      throw new ConflictException('يوم الأسبوع يجب أن يكون بين 0 (الأحد) و 6 (السبت)');
    }
  }

  private validateTimes(startTime: string, endTime: string) {
    if (startTime >= endTime) {
      throw new ConflictException('وقت البداية يجب أن يسبق وقت النهاية');
    }
  }

  private async checkOverlap(
    doctorId: number,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    excludeId?: number,
  ) {
    const schedules = await this.scheduleRepository.find({
      where: { doctor: { id: doctorId }, dayOfWeek },
    });
    const overlap = schedules.find(
      (schedule) =>
        schedule.id !== excludeId &&
        startTime < schedule.endTime &&
        schedule.startTime < endTime,
    );
    if (overlap) {
      throw new ConflictException(
        'يوجد تداخل مع دوام آخر لنفس الطبيب في نفس اليوم',
      );
    }
  }

  private stripUserPassword(schedule: DoctorSchedule) {
    if (schedule.doctor && schedule.doctor.user) {
      const safeUser: any = { ...schedule.doctor.user };
      delete safeUser.password;
      return {
        ...schedule,
        doctor: { ...schedule.doctor, user: safeUser },
      };
    }
    return schedule;
  }
}
