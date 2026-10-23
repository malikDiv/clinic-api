import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Doctor } from '../doctors/entities/doctor.entity.js';
import { DoctorService } from '../doctors/doctor.service.js';
import { User } from '../users/entities/user.entity.js';
import { AppointmentService } from './appointment.service.js';
import { Appointment } from './entities/appointment.entity.js';

describe('AppointmentService', () => {
  let service: AppointmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentService,
        { provide: getRepositoryToken(Appointment), useValue: {} },
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: getRepositoryToken(Doctor), useValue: {} },
        { provide: DoctorService, useValue: {} },
        { provide: DataSource, useValue: {} },
      ],
    }).compile();

    service = module.get<AppointmentService>(AppointmentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
