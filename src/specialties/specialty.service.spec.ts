import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Specialty } from './entities/specialty.entity.js';
import { SpecialtyService } from './specialty.service.js';

describe('SpecialtyService', () => {
  let service: SpecialtyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpecialtyService,
        { provide: getRepositoryToken(Specialty), useValue: {} },
      ],
    }).compile();

    service = module.get<SpecialtyService>(SpecialtyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
