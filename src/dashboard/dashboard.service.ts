import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../appointments/entities/appointment.entity.js';
import { Doctor } from '../doctors/entities/doctor.entity.js';
import { User } from '../users/entities/user.entity.js';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
  ) {}

  async getSummary(currentUser: { id: number; role: string }) {
    this.checkRole(currentUser, ['admin']);

    const appointments = await this.appointmentRepository.find({
      relations: { doctor: { user: true }, patient: true },
    });

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const appointmentsByStatus: any = {
      waiting: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
    };
    let todayAppointments = 0;
    let totalPaid = 0;
    let paidAppointments = 0;
    let pendingAmount = 0;

    for (const appointment of appointments) {
      if (appointmentsByStatus[appointment.status] !== undefined) {
        appointmentsByStatus[appointment.status]++;
      }
      if (appointment.date === today) {
        todayAppointments++;
      }
      if (appointment.paymentStatus === 'paid') {
        totalPaid += Number(appointment.fee);
        paidAppointments++;
      } else if (appointment.status === 'completed') {
        pendingAmount += Number(appointment.fee);
      }
    }

    const patients = await this.userRepository.find({
      where: { role: 'patient' },
    });
    const doctors = await this.doctorRepository.find({
      relations: { user: true },
    });

    const counts = new Map<number, number>();
    for (const appointment of appointments) {
      if (appointment.doctor) {
        counts.set(
          appointment.doctor.id,
          (counts.get(appointment.doctor.id) ?? 0) + 1,
        );
      }
    }

    const topDoctors = doctors
      .map((doctor) => ({
        doctorId: doctor.id,
        name: doctor.user ? doctor.user.name : '',
        appointmentsCount: counts.get(doctor.id) ?? 0,
      }))
      .sort((a, b) => b.appointmentsCount - a.appointmentsCount)
      .slice(0, 5);

    return {
      totalAppointments: appointments.length,
      appointmentsByStatus,
      todayAppointments,
      totalPatients: patients.length,
      totalDoctors: doctors.length,
      revenue: { totalPaid, paidAppointments, pendingAmount },
      topDoctors,
    };
  }

  private checkRole(currentUser: { role: string }, allowed: string[]) {
    if (!allowed.includes(currentUser.role)) {
      throw new ForbiddenException('لا تملك صلاحية تنفيذ هذه العملية');
    }
  }
}
