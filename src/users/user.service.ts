import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Appointment } from '../appointments/entities/appointment.entity.js';
import { DoctorSchedule } from '../doctor-schedules/entities/doctor-schedule.entity.js';
import { Doctor } from '../doctors/entities/doctor.entity.js';
import { MedicalRecord } from '../medical-records/entities/medical-record.entity.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { User } from './entities/user.entity.js';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
    @InjectRepository(DoctorSchedule)
    private readonly doctorScheduleRepository: Repository<DoctorSchedule>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(MedicalRecord)
    private readonly medicalRecordRepository: Repository<MedicalRecord>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { password, ...rest } = createUserDto;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      ...rest,
      role: createUserDto.role ?? 'patient',
      password: hashedPassword,
    });
    return await this.userRepository.save(user);
  }

  async createByAdmin(createUserDto: CreateUserDto, currentUser: { id: number; role: string }) {
    this.checkRole(currentUser, ['admin']);
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('البريد الإلكتروني مستخدم مسبقاً');
    }
    const user = await this.create(createUserDto);
    return this.sanitize(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOneBy({ email });
  }

  async findAll(currentUser: { id: number; role: string }) {
    this.checkRole(currentUser, ['admin']);
    const users = await this.userRepository.find();
    return users.map((user) => this.sanitize(user));
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findOneSafe(id: number, currentUser: { id: number; role: string }) {
    const user = await this.findOne(id);
    if (currentUser.role !== 'admin' && currentUser.id !== user.id) {
      throw new ForbiddenException('لا تملك صلاحية عرض بيانات هذا المستخدم');
    }
    return this.sanitize(user);
  }

  async updateByAdmin(
    id: number,
    updateUserDto: UpdateUserDto,
    currentUser: { id: number; role: string },
  ) {
    this.checkRole(currentUser, ['admin']);
    const user = await this.findOne(id);
    const { password, ...rest } = updateUserDto;
    Object.assign(user, rest);
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }
    const savedUser = await this.userRepository.save(user);
    return this.sanitize(savedUser);
  }

  async updateProfile(
    currentUser: { id: number; role: string },
    updateUserDto: UpdateUserDto,
  ) {
    const user = await this.findOne(currentUser.id);
    const updateData: Record<string, unknown> = { ...updateUserDto };
    delete updateData.password;
    delete updateData.role;
    Object.assign(user, updateData);
    if (updateUserDto.password) {
      user.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    const savedUser = await this.userRepository.save(user);
    return this.sanitize(savedUser);
  }

  async removeByAdmin(
    id: number,
    currentUser: { id: number; role: string },
  ): Promise<{ message: string }> {
    this.checkRole(currentUser, ['admin']);
    const user = await this.findOne(id);

    const patientRecords = await this.medicalRecordRepository.find({
      where: { patient: { id } },
    });
    if (patientRecords.length > 0) {
      await this.medicalRecordRepository.remove(patientRecords);
    }

    const patientAppointments = await this.appointmentRepository.find({
      where: { patient: { id } },
    });
    if (patientAppointments.length > 0) {
      await this.appointmentRepository.remove(patientAppointments);
    }

    const doctor = await this.doctorRepository.findOne({
      where: { user: { id } },
    });
    if (doctor) {
      const doctorRecords = await this.medicalRecordRepository.find({
        where: { doctor: { id: doctor.id } },
      });
      if (doctorRecords.length > 0) {
        await this.medicalRecordRepository.remove(doctorRecords);
      }

      const doctorAppointments = await this.appointmentRepository.find({
        where: { doctor: { id: doctor.id } },
      });
      if (doctorAppointments.length > 0) {
        await this.appointmentRepository.remove(doctorAppointments);
      }

      const schedules = await this.doctorScheduleRepository.find({
        where: { doctor: { id: doctor.id } },
      });
      if (schedules.length > 0) {
        await this.doctorScheduleRepository.remove(schedules);
      }

      await this.doctorRepository.remove(doctor);
    }

    await this.userRepository.remove(user);

    return { message: 'User and all related data deleted successfully' };
  }

  private sanitize(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      age: user.age,
    };
  }

  private checkRole(currentUser: { role: string }, allowed: string[]) {
    if (!allowed.includes(currentUser.role)) {
      throw new ForbiddenException('لا تملك صلاحية تنفيذ هذه العملية');
    }
  }
}
