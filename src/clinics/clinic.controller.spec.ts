import { Test, TestingModule } from '@nestjs/testing';
import { ClinicController } from './clinic.controller.js';
import { ClinicService } from './clinic.service.js';

describe('ClinicController', () => {
  let controller: ClinicController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClinicController],
      providers: [{ provide: ClinicService, useValue: {} }],
    }).compile();

    controller = module.get<ClinicController>(ClinicController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
