import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClinicService } from './clinic.service.js';
import { Clinic } from './entities/clinic.entity.js';

describe('ClinicService', () => {
  let service: ClinicService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClinicService,
        { provide: getRepositoryToken(Clinic), useValue: {} },
      ],
    }).compile();

    service = module.get<ClinicService>(ClinicService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
