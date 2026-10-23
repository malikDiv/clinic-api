import { Test, TestingModule } from '@nestjs/testing';
import { MedicalRecordController } from './medical-record.controller.js';
import { MedicalRecordService } from './medical-record.service.js';

describe('MedicalRecordController', () => {
  let controller: MedicalRecordController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MedicalRecordController],
      providers: [{ provide: MedicalRecordService, useValue: {} }],
    }).compile();

    controller = module.get<MedicalRecordController>(MedicalRecordController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
