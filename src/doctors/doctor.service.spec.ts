import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Clinic } from '../clinics/entities/clinic.entity.js';
import { Specialty } from '../specialties/entities/specialty.entity.js';
import { User } from '../users/entities/user.entity.js';
import { DoctorService } from './doctor.service.js';
import { Doctor } from './entities/doctor.entity.js';

describe('DoctorService', () => {
  let service: DoctorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorService,
        { provide: getRepositoryToken(Doctor), useValue: {} },
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: getRepositoryToken(Specialty), useValue: {} },
        { provide: getRepositoryToken(Clinic), useValue: {} },
      ],
    }).compile();

    service = module.get<DoctorService>(DoctorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
