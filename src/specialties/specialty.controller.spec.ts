import { Test, TestingModule } from '@nestjs/testing';
import { SpecialtyController } from './specialty.controller.js';
import { SpecialtyService } from './specialty.service.js';

describe('SpecialtyController', () => {
  let controller: SpecialtyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SpecialtyController],
      providers: [{ provide: SpecialtyService, useValue: {} }],
    }).compile();

    controller = module.get<SpecialtyController>(SpecialtyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
