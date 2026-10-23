import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiModule } from './ai/ai.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AppointmentModule } from './appointments/appointment.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ClinicModule } from './clinics/clinic.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { DoctorScheduleModule } from './doctor-schedules/doctor-schedule.module.js';
import { DoctorModule } from './doctors/doctor.module.js';
import { MedicalRecordModule } from './medical-records/medical-record.module.js';
import { SpecialtyModule } from './specialties/specialty.module.js';
import { UserModule } from './users/user.module.js';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '',
      database: 'clinic_db',
      autoLoadEntities: true,
      synchronize: true,
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    UserModule,
    AuthModule,
    SpecialtyModule,
    ClinicModule,
    DoctorModule,
    DoctorScheduleModule,
    AppointmentModule,
    MedicalRecordModule,
    AiModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
