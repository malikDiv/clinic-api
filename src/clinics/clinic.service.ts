import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateClinicDto } from './dto/create-clinic.dto.js';
import { UpdateClinicDto } from './dto/update-clinic.dto.js';
import { Clinic } from './entities/clinic.entity.js';

@Injectable()
export class ClinicService {
  constructor(
    @InjectRepository(Clinic)
    private readonly clinicRepository: Repository<Clinic>,
  ) {}

  async create(
    createClinicDto: CreateClinicDto,
    currentUser: { id: number; role: string },
  ): Promise<Clinic> {
    this.checkRole(currentUser, ['admin']);
    const clinic = this.clinicRepository.create(createClinicDto);
    return await this.clinicRepository.save(clinic);
  }

  async findAll(): Promise<Clinic[]> {
    return await this.clinicRepository.find();
  }

  async findOne(id: number): Promise<Clinic> {
    const clinic = await this.clinicRepository.findOneBy({ id });
    if (!clinic) {
      throw new NotFoundException(`Clinic with ID ${id} not found`);
    }
    return clinic;
  }

  async update(
    id: number,
    updateClinicDto: UpdateClinicDto,
    currentUser: { id: number; role: string },
  ): Promise<Clinic> {
    this.checkRole(currentUser, ['admin']);
    const clinic = await this.findOne(id);
    Object.assign(clinic, updateClinicDto);
    return await this.clinicRepository.save(clinic);
  }

  async remove(
    id: number,
    currentUser: { id: number; role: string },
  ): Promise<{ message: string }> {
    this.checkRole(currentUser, ['admin']);
    const clinic = await this.findOne(id);
    await this.clinicRepository.remove(clinic);
    return { message: 'Clinic deleted successfully' };
  }

  private checkRole(currentUser: { role: string }, allowed: string[]) {
    if (!allowed.includes(currentUser.role)) {
      throw new ForbiddenException('لا تملك صلاحية تنفيذ هذه العملية');
    }
  }
}
