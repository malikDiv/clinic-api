import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Clinic } from '../clinics/entities/clinic.entity.js';
import { Doctor } from '../doctors/entities/doctor.entity.js';
import { DoctorScheduleService } from './doctor-schedule.service.js';
import { DoctorSchedule } from './entities/doctor-schedule.entity.js';

describe('DoctorScheduleService', () => {
  let service: DoctorScheduleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorScheduleService,
        { provide: getRepositoryToken(DoctorSchedule), useValue: {} },
        { provide: getRepositoryToken(Doctor), useValue: {} },
        { provide: getRepositoryToken(Clinic), useValue: {} },
      ],
    }).compile();

    service = module.get<DoctorScheduleService>(DoctorScheduleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
