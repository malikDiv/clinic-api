import { Test, TestingModule } from '@nestjs/testing';
import { DoctorScheduleController } from './doctor-schedule.controller.js';
import { DoctorScheduleService } from './doctor-schedule.service.js';

describe('DoctorScheduleController', () => {
  let controller: DoctorScheduleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DoctorScheduleController],
      providers: [{ provide: DoctorScheduleService, useValue: {} }],
    }).compile();

    controller = module.get<DoctorScheduleController>(DoctorScheduleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
