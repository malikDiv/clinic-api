import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { appointmentStatus } from '../appointments/dto/create-appointment.dto.js';
import { Appointment } from '../appointments/entities/appointment.entity.js';
import { User } from '../users/entities/user.entity.js';
import { ApproveAiSummaryDto } from './dto/approve-ai-summary.dto.js';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto.js';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto.js';
import { MedicalRecord } from './entities/medical-record.entity.js';

@Injectable()
export class MedicalRecordService {
  constructor(
    @InjectRepository(MedicalRecord)
    private readonly medicalRecordRepository: Repository<MedicalRecord>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
  ) {}

  async create(
    createMedicalRecordDto: CreateMedicalRecordDto,
    currentUser: { id: number; role: string },
  ) {
    this.checkRole(currentUser, ['doctor']);

    const appointment = await this.appointmentRepository.findOne({
      where: { id: createMedicalRecordDto.appointmentId },
      relations: { doctor: { user: true }, patient: true },
    });
    if (!appointment) {
      throw new NotFoundException(
        `Appointment with ID ${createMedicalRecordDto.appointmentId} not found`,
      );
    }
    if (appointment.doctor.user.id !== currentUser.id) {
      throw new ForbiddenException('لا يمكنك إنشاء سجل لموعد لا يخصك');
    }
    if (appointment.status !== appointmentStatus.Completed) {
      throw new ConflictException('لا يمكن إنشاء سجل قبل إتمام الزيارة');
    }

    const existingRecord = await this.medicalRecordRepository.findOne({
      where: { appointment: { id: appointment.id } },
    });
    if (existingRecord) {
      throw new ConflictException('يوجد سجل طبي لهذا الموعد مسبقاً');
    }

    const record = this.medicalRecordRepository.create({
      appointment,
      patient: appointment.patient,
      doctor: appointment.doctor,
      diagnosis: createMedicalRecordDto.diagnosis,
      notes: createMedicalRecordDto.notes,
    });

    const savedRecord = await this.medicalRecordRepository.save(record);
    return this.sanitizeRecord(savedRecord);
  }

  async findByPatient(
    patientId: number,
    currentUser: { id: number; role: string },
  ) {
    if (currentUser.role === 'patient' && currentUser.id !== patientId) {
      throw new ForbiddenException('لا تملك صلاحية عرض الملف الطبي لمريض آخر');
    }
    this.checkRole(currentUser, [
      'admin',
      'receptionist',
      'doctor',
      'patient',
    ]);

    const patient = await this.userRepository.findOneBy({ id: patientId });
    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }

    const records = await this.medicalRecordRepository.find({
      where: { patient: { id: patientId } },
      relations: { appointment: true, doctor: { user: true, specialty: true } },
    });

    return {
      patient: {
        id: patient.id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        age: patient.age,
        role: patient.role,
      },
      records: records.map((record) => this.sanitizeRecord(record)),
    };
  }

  async findMy(currentUser: { id: number; role: string }) {
    this.checkRole(currentUser, ['patient']);
    const records = await this.medicalRecordRepository.find({
      where: { patient: { id: currentUser.id } },
      relations: { appointment: true, doctor: { user: true, specialty: true } },
    });
    return records.map((record) => this.sanitizeRecord(record));
  }

  async findOne(id: number, currentUser: { id: number; role: string }) {
    const record = await this.getRecordEntity(id);

    if (currentUser.role === 'patient' && record.patient.id !== currentUser.id) {
      throw new ForbiddenException('لا تملك صلاحية عرض هذا السجل');
    }
    if (
      currentUser.role === 'doctor' &&
      record.doctor.user.id !== currentUser.id
    ) {
      throw new ForbiddenException('لا تملك صلاحية عرض هذا السجل');
    }

    return this.sanitizeRecord(record);
  }

  async findWithRelations(id: number): Promise<MedicalRecord> {
    return await this.getRecordEntity(id);
  }

  async update(
    id: number,
    updateMedicalRecordDto: UpdateMedicalRecordDto,
    currentUser: { id: number; role: string },
  ) {
    this.checkRole(currentUser, ['doctor']);
    const record = await this.getRecordEntity(id);

    if (record.doctor.user.id !== currentUser.id) {
      throw new ForbiddenException('لا تملك صلاحية تعديل هذا السجل');
    }

    if (updateMedicalRecordDto.diagnosis !== undefined) {
      record.diagnosis = updateMedicalRecordDto.diagnosis;
    }
    if (updateMedicalRecordDto.notes !== undefined) {
      record.notes = updateMedicalRecordDto.notes;
    }

    const savedRecord = await this.medicalRecordRepository.save(record);
    return this.sanitizeRecord(savedRecord);
  }

  async approveAiSummary(
    id: number,
    approveAiSummaryDto: ApproveAiSummaryDto,
    currentUser: { id: number; role: string },
  ) {
    this.checkRole(currentUser, ['doctor']);
    const record = await this.getRecordEntity(id);

    if (record.doctor.user.id !== currentUser.id) {
      throw new ForbiddenException('لا تملك صلاحية اعتماد هذا السجل');
    }

    record.aiSummary = approveAiSummaryDto.summary;
    record.aiSummaryApproved = 1;

    const savedRecord = await this.medicalRecordRepository.save(record);
    return this.sanitizeRecord(savedRecord);
  }

  private async getRecordEntity(id: number): Promise<MedicalRecord> {
    const record = await this.medicalRecordRepository.findOne({
      where: { id },
      relations: {
        appointment: true,
        patient: true,
        doctor: { user: true, specialty: true },
      },
    });
    if (!record) {
      throw new NotFoundException(`Medical record with ID ${id} not found`);
    }
    return record;
  }

  private sanitizeRecord(record: MedicalRecord) {
    const result: any = { ...record };
    if (record.patient) {
      const safePatient: any = { ...record.patient };
      delete safePatient.password;
      result.patient = safePatient;
    }
    if (record.doctor && record.doctor.user) {
      const safeUser: any = { ...record.doctor.user };
      delete safeUser.password;
      result.doctor = { ...record.doctor, user: safeUser };
    }
    return result;
  }

  private checkRole(currentUser: { role: string }, allowed: string[]) {
    if (!allowed.includes(currentUser.role)) {
      throw new ForbiddenException('لا تملك صلاحية تنفيذ هذه العملية');
    }
  }
}
