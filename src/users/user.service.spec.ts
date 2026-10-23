import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Appointment } from '../appointments/entities/appointment.entity.js';
import { DoctorSchedule } from '../doctor-schedules/entities/doctor-schedule.entity.js';
import { Doctor } from '../doctors/entities/doctor.entity.js';
import { MedicalRecord } from '../medical-records/entities/medical-record.entity.js';
import { User } from './entities/user.entity.js';
import { UserService } from './user.service.js';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: getRepositoryToken(Doctor), useValue: {} },
        { provide: getRepositoryToken(DoctorSchedule), useValue: {} },
        { provide: getRepositoryToken(Appointment), useValue: {} },
        { provide: getRepositoryToken(MedicalRecord), useValue: {} },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
