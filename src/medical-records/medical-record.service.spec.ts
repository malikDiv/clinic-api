import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Appointment } from '../appointments/entities/appointment.entity.js';
import { User } from '../users/entities/user.entity.js';
import { MedicalRecord } from './entities/medical-record.entity.js';
import { MedicalRecordService } from './medical-record.service.js';

describe('MedicalRecordService', () => {
  let service: MedicalRecordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MedicalRecordService,
        { provide: getRepositoryToken(MedicalRecord), useValue: {} },
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: getRepositoryToken(Appointment), useValue: {} },
      ],
    }).compile();

    service = module.get<MedicalRecordService>(MedicalRecordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
