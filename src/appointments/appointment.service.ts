import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { DoctorSchedule } from '../doctor-schedules/entities/doctor-schedule.entity.js';
import { Doctor } from '../doctors/entities/doctor.entity.js';
import { DoctorService } from '../doctors/doctor.service.js';
import { User } from '../users/entities/user.entity.js';
import {
  CreateAppointmentDto,
  appointmentStatus,
} from './dto/create-appointment.dto.js';
import { UpdateAppointmentDto } from './dto/update-appointment.dto.js';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto.js';
import { Appointment } from './entities/appointment.entity.js';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
    private readonly doctorService: DoctorService,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createAppointmentDto: CreateAppointmentDto,
    currentUser: { id: number; role: string },
  ) {
    this.checkRole(currentUser, ['admin', 'receptionist', 'patient']);
    const patientId = this.resolvePatientId(createAppointmentDto, currentUser);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const patient = await queryRunner.manager.findOne(User, {
        where: { id: patientId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!patient) {
        throw new NotFoundException(`Patient with ID ${patientId} not found`);
      }

      const doctor = await queryRunner.manager.findOne(Doctor, {
        where: { id: createAppointmentDto.doctorId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!doctor) {
        throw new NotFoundException(
          `Doctor with ID ${createAppointmentDto.doctorId} not found`,
        );
      }

      await this.assertDoctorAvailable(
        queryRunner,
        doctor.id,
        createAppointmentDto.date,
        createAppointmentDto.time,
      );

      await this.assertNoConflicts(
        queryRunner,
        doctor.id,
        patientId,
        createAppointmentDto.date,
        createAppointmentDto.time,
      );

      const appointment = queryRunner.manager.create(Appointment, {
        patient,
        doctor,
        date: createAppointmentDto.date,
        time: createAppointmentDto.time,
        status: appointmentStatus.Confirmed,
        paymentStatus: 'unpaid',
        fee: doctor.consultationFee,
        notes: createAppointmentDto.notes,
      });

      const savedAppointment = await queryRunner.manager.save(
        Appointment,
        appointment,
      );

      await queryRunner.commitTransaction();
      return this.sanitizeAppointment(savedAppointment);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async createWaiting(
    createAppointmentDto: CreateAppointmentDto,
    currentUser: { id: number; role: string },
  ) {
    this.checkRole(currentUser, ['admin', 'receptionist', 'patient']);
    const patientId = this.resolvePatientId(createAppointmentDto, currentUser);

    const patient = await this.userRepository.findOneBy({ id: patientId });
    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }

    const doctor = await this.doctorRepository.findOneBy({
      id: createAppointmentDto.doctorId,
    });
    if (!doctor) {
      throw new NotFoundException(
        `Doctor with ID ${createAppointmentDto.doctorId} not found`,
      );
    }

    const existingWaiting = await this.appointmentRepository.findOne({
      where: {
        patient: { id: patientId },
        doctor: { id: doctor.id },
        date: createAppointmentDto.date,
        time: createAppointmentDto.time,
        status: appointmentStatus.Waiting,
      },
    });
    if (existingWaiting) {
      throw new ConflictException(
        'يوجد طلب انتظار مطابق لنفس المريض مسبقاً',
      );
    }

    const appointment = this.appointmentRepository.create({
      patient,
      doctor,
      date: createAppointmentDto.date,
      time: createAppointmentDto.time,
      status: appointmentStatus.Waiting,
      paymentStatus: 'unpaid',
      fee: doctor.consultationFee,
      notes: createAppointmentDto.notes,
    });

    const savedAppointment = await this.appointmentRepository.save(appointment);
    return this.sanitizeAppointment(savedAppointment);
  }

  async findAll(currentUser: { id: number; role: string }) {
    this.checkRole(currentUser, ['admin', 'receptionist']);
    const appointments = await this.appointmentRepository.find({
      relations: {
        patient: true,
        doctor: { user: true, specialty: true, clinic: true },
      },
    });
    return appointments.map((appointment) =>
      this.sanitizeAppointment(appointment),
    );
  }

  async findMy(currentUser: { id: number; role: string }) {
    this.checkRole(currentUser, ['patient']);
    const appointments = await this.appointmentRepository.find({
      where: { patient: { id: currentUser.id } },
      relations: { doctor: { user: true, specialty: true, clinic: true } },
    });
    return appointments
      .sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1))
      .map((appointment) => this.sanitizeAppointment(appointment));
  }

  async findDoctorAppointments(
    currentUser: { id: number; role: string },
    date?: string,
    doctorId?: number,
  ) {
    this.checkRole(currentUser, ['admin', 'receptionist', 'doctor']);

    let resolvedDoctorId: number;
    if (currentUser.role === 'doctor') {
      const doctor = await this.doctorService.findByUser(currentUser.id);
      resolvedDoctorId = doctor.id;
    } else {
      if (!doctorId) {
        throw new ConflictException('يجب تحديد معرّف الطبيب');
      }
      resolvedDoctorId = doctorId;
    }

    const where: any = { doctor: { id: resolvedDoctorId } };
    if (date) {
      where.date = date;
    }

    const appointments = await this.appointmentRepository.find({
      where,
      relations: {
        patient: true,
        doctor: { user: true, specialty: true, clinic: true },
      },
    });
    return appointments.map((appointment) =>
      this.sanitizeAppointment(appointment),
    );
  }

  async findPatientAppointments(
    patientId: number,
    currentUser: { id: number; role: string },
  ) {
    if (
      currentUser.role === 'patient' &&
      currentUser.id !== patientId
    ) {
      throw new ForbiddenException('لا تملك صلاحية عرض مواعيد مريض آخر');
    }
    this.checkRole(currentUser, ['admin', 'receptionist', 'doctor', 'patient']);

    const patient = await this.userRepository.findOneBy({ id: patientId });
    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }

    const appointments = await this.appointmentRepository.find({
      where: { patient: { id: patientId } },
      relations: {
        doctor: { user: true, specialty: true, clinic: true },
      },
    });
    return appointments
      .sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1))
      .map((appointment) => this.sanitizeAppointment(appointment));
  }

  async findWaitingList(
    doctorId: number | undefined,
    date: string | undefined,
    currentUser: { id: number; role: string },
  ) {
    this.checkRole(currentUser, ['admin', 'receptionist', 'doctor']);
    if (!doctorId || !date) {
      throw new ConflictException('يجب تحديد معرّف الطبيب والتاريخ');
    }

    const appointments = await this.appointmentRepository.find({
      where: {
        status: appointmentStatus.Waiting,
        doctor: { id: doctorId },
        date,
      },
      relations: { patient: true, doctor: { user: true } },
    });
    return appointments
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
      .map((appointment) => this.sanitizeAppointment(appointment));
  }

  async findOne(id: number, currentUser: { id: number; role: string }) {
    const appointment = await this.getAppointmentEntity(id);

    if (
      currentUser.role === 'patient' &&
      appointment.patient.id !== currentUser.id
    ) {
      throw new ForbiddenException('لا تملك صلاحية عرض هذا الموعد');
    }
    if (
      currentUser.role === 'doctor' &&
      appointment.doctor.user.id !== currentUser.id
    ) {
      throw new ForbiddenException('لا تملك صلاحية عرض هذا الموعد');
    }

    return this.sanitizeAppointment(appointment);
  }

  async updateStatus(
    id: number,
    updateAppointmentStatusDto: UpdateAppointmentStatusDto,
    currentUser: { id: number; role: string },
  ) {
    const newStatus = updateAppointmentStatusDto.status;

    if (newStatus === appointmentStatus.Confirmed) {
      this.checkRole(currentUser, ['admin', 'receptionist']);
      return await this.confirmAppointment(id);
    }

    const appointment = await this.getAppointmentEntity(id);

    if (currentUser.role === 'patient') {
      if (appointment.patient.id !== currentUser.id) {
        throw new ForbiddenException('لا تملك صلاحية تغيير حالة هذا الموعد');
      }
      if (newStatus !== appointmentStatus.Cancelled) {
        throw new ForbiddenException(
          'يمكنك إلغاء موعدك فقط',
        );
      }
    } else if (currentUser.role === 'doctor') {
      if (appointment.doctor.user.id !== currentUser.id) {
        throw new ForbiddenException('لا تملك صلاحية تغيير حالة هذا الموعد');
      }
      if (
        ![appointmentStatus.Completed, appointmentStatus.Cancelled].includes(
          newStatus,
        )
      ) {
        throw new ForbiddenException(
          'يمكنك إكمال أو إلغاء مواعيدك فقط',
        );
      }
    } else {
      this.checkRole(currentUser, ['admin', 'receptionist']);
    }

    if (appointment.status === appointmentStatus.Completed) {
      throw new ConflictException('لا يمكن تغيير حالة موعد مكتمل');
    }
    if (appointment.status === appointmentStatus.Cancelled) {
      throw new ConflictException('لا يمكن تغيير حالة موعد ملغى');
    }
    if (
      appointment.status === appointmentStatus.Waiting &&
      newStatus !== appointmentStatus.Cancelled
    ) {
      throw new ConflictException(
        'الموعد في قائمة الانتظار يُرقّى إلى confirmed أو يُلغى فقط',
      );
    }
    if (
      appointment.status === appointmentStatus.Confirmed &&
      ![appointmentStatus.Completed, appointmentStatus.Cancelled].includes(
        newStatus,
      )
    ) {
      throw new ConflictException('انتقال حالة غير صالح');
    }

    appointment.status = newStatus;
    const savedAppointment = await this.appointmentRepository.save(appointment);
    return this.sanitizeAppointment(savedAppointment);
  }

  async update(
    id: number,
    updateAppointmentDto: UpdateAppointmentDto,
    currentUser: { id: number; role: string },
  ) {
    this.checkRole(currentUser, ['admin', 'receptionist']);
    const appointment = await this.getAppointmentEntity(id);

    if (updateAppointmentDto.paymentStatus !== undefined) {
      appointment.paymentStatus = updateAppointmentDto.paymentStatus;
    }
    if (updateAppointmentDto.notes !== undefined) {
      appointment.notes = updateAppointmentDto.notes;
    }

    const savedAppointment = await this.appointmentRepository.save(appointment);
    return this.sanitizeAppointment(savedAppointment);
  }

  async remove(id: number, currentUser: { id: number; role: string }) {
    this.checkRole(currentUser, ['admin']);
    const appointment = await this.getAppointmentEntity(id);
    await this.appointmentRepository.remove(appointment);
    return { message: 'Appointment deleted successfully' };
  }

  private async confirmAppointment(id: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const appointment = await queryRunner.manager.findOne(Appointment, {
        where: { id },
        relations: { patient: true, doctor: true },
      });
      if (!appointment) {
        throw new NotFoundException(`Appointment with ID ${id} not found`);
      }
      if (appointment.status !== appointmentStatus.Waiting) {
        throw new ConflictException(
          'الترقية إلى confirmed متاحة فقط لمواعيد قائمة الانتظار',
        );
      }

      const patient = await queryRunner.manager.findOne(User, {
        where: { id: appointment.patient.id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!patient) {
        throw new NotFoundException(
          `Patient with ID ${appointment.patient.id} not found`,
        );
      }

      const doctor = await queryRunner.manager.findOne(Doctor, {
        where: { id: appointment.doctor.id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!doctor) {
        throw new NotFoundException(
          `Doctor with ID ${appointment.doctor.id} not found`,
        );
      }

      if (this.isInPast(appointment.date, appointment.time)) {
        throw new ConflictException('انتهى وقت هذا الموعد');
      }

      await this.assertDoctorAvailable(
        queryRunner,
        doctor.id,
        appointment.date,
        appointment.time,
      );

      await this.assertSlotFree(
        queryRunner,
        doctor.id,
        patient.id,
        appointment.date,
        appointment.time,
        appointment.id,
      );

      appointment.status = appointmentStatus.Confirmed;
      const savedAppointment = await queryRunner.manager.save(
        Appointment,
        appointment,
      );

      await queryRunner.commitTransaction();
      return this.sanitizeAppointment(savedAppointment);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async assertDoctorAvailable(
    queryRunner: QueryRunner,
    doctorId: number,
    date: string,
    time: string,
  ) {
    const dayOfWeek = new Date(date).getDay();
    const schedules = await queryRunner.manager.find(DoctorSchedule, {
      where: { doctor: { id: doctorId }, dayOfWeek },
    });
    const isCovered = schedules.some(
      (schedule) => schedule.startTime <= time && time < schedule.endTime,
    );
    if (!isCovered) {
      throw new ConflictException('الطبيب غير متاح في هذا الوقت');
    }
  }

  private async assertNoConflicts(
    queryRunner: QueryRunner,
    doctorId: number,
    patientId: number,
    date: string,
    time: string,
  ) {
    const doctorConflict = await queryRunner.manager.find(Appointment, {
      where: [
        {
          doctor: { id: doctorId },
          date,
          time,
          status: appointmentStatus.Confirmed,
        },
        {
          doctor: { id: doctorId },
          date,
          time,
          status: appointmentStatus.Completed,
        },
        {
          doctor: { id: doctorId },
          date,
          time,
          status: appointmentStatus.Waiting,
        },
      ],
    });
    if (doctorConflict.length > 0) {
      throw new ConflictException(
        'الموعد محجوز لهذا الطبيب، يمكنك الانضمام لقائمة الانتظار',
      );
    }

    const patientConflict = await queryRunner.manager.find(Appointment, {
      where: [
        {
          patient: { id: patientId },
          date,
          time,
          status: appointmentStatus.Confirmed,
        },
        {
          patient: { id: patientId },
          date,
          time,
          status: appointmentStatus.Completed,
        },
        {
          patient: { id: patientId },
          date,
          time,
          status: appointmentStatus.Waiting,
        },
      ],
    });
    if (patientConflict.length > 0) {
      throw new ConflictException('لديك موعد آخر في نفس الوقت');
    }
  }

  private async assertSlotFree(
    queryRunner: QueryRunner,
    doctorId: number,
    patientId: number,
    date: string,
    time: string,
    excludeAppointmentId: number,
  ) {
    const doctorConflict = await queryRunner.manager.find(Appointment, {
      where: [
        {
          doctor: { id: doctorId },
          date,
          time,
          status: appointmentStatus.Confirmed,
        },
        {
          doctor: { id: doctorId },
          date,
          time,
          status: appointmentStatus.Completed,
        },
      ],
    });
    if (doctorConflict.some((a) => a.id !== excludeAppointmentId)) {
      throw new ConflictException('الموعد محجوز لهذا الطبيب');
    }

    const patientConflict = await queryRunner.manager.find(Appointment, {
      where: [
        {
          patient: { id: patientId },
          date,
          time,
          status: appointmentStatus.Confirmed,
        },
        {
          patient: { id: patientId },
          date,
          time,
          status: appointmentStatus.Completed,
        },
      ],
    });
    if (patientConflict.some((a) => a.id !== excludeAppointmentId)) {
      throw new ConflictException('لديك موعد آخر في نفس الوقت');
    }
  }

  private isInPast(date: string, time: string) {
    const now = new Date();
    const nowDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return `${date} ${time}` < `${nowDate} ${nowTime}`;
  }

  private async getAppointmentEntity(id: number): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: {
        patient: true,
        doctor: { user: true, specialty: true, clinic: true },
      },
    });
    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }
    return appointment;
  }

  private resolvePatientId(
    createAppointmentDto: CreateAppointmentDto,
    currentUser: { id: number; role: string },
  ): number {
    if (currentUser.role === 'patient') {
      return currentUser.id;
    }
    if (!createAppointmentDto.patientId) {
      throw new ConflictException('يجب تحديد معرّف المريض');
    }
    return createAppointmentDto.patientId;
  }

  private sanitizeAppointment(appointment: Appointment) {
    const result: any = { ...appointment };
    if (appointment.patient) {
      const safePatient: any = { ...appointment.patient };
      delete safePatient.password;
      result.patient = safePatient;
    }
    if (appointment.doctor && appointment.doctor.user) {
      const safeUser: any = { ...appointment.doctor.user };
      delete safeUser.password;
      result.doctor = { ...appointment.doctor, user: safeUser };
    }
    return result;
  }

  private checkRole(currentUser: { role: string }, allowed: string[]) {
    if (!allowed.includes(currentUser.role)) {
      throw new ForbiddenException('لا تملك صلاحية تنفيذ هذه العملية');
    }
  }
}
