import { Test, TestingModule } from '@nestjs/testing';
import { MedicalRecordService } from '../medical-records/medical-record.service.js';
import { AiService } from './ai.service.js';

describe('AiService', () => {
  let service: AiService;

  beforeEach(async () => {
    process.env.GEMINI_API_KEY = 'test-key';
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: MedicalRecordService, useValue: {} },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
