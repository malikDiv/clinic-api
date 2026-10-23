import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSpecialtyDto } from './dto/create-specialty.dto.js';
import { UpdateSpecialtyDto } from './dto/update-specialty.dto.js';
import { Specialty } from './entities/specialty.entity.js';

@Injectable()
export class SpecialtyService {
  constructor(
    @InjectRepository(Specialty)
    private readonly specialtyRepository: Repository<Specialty>,
  ) {}

  async create(
    createSpecialtyDto: CreateSpecialtyDto,
    currentUser: { id: number; role: string },
  ): Promise<Specialty> {
    this.checkRole(currentUser, ['admin']);
    const specialty = this.specialtyRepository.create(createSpecialtyDto);
    return await this.specialtyRepository.save(specialty);
  }

  async findAll(): Promise<Specialty[]> {
    return await this.specialtyRepository.find();
  }

  async findOne(id: number): Promise<Specialty> {
    const specialty = await this.specialtyRepository.findOneBy({ id });
    if (!specialty) {
      throw new NotFoundException(`Specialty with ID ${id} not found`);
    }
    return specialty;
  }

  async update(
    id: number,
    updateSpecialtyDto: UpdateSpecialtyDto,
    currentUser: { id: number; role: string },
  ): Promise<Specialty> {
    this.checkRole(currentUser, ['admin']);
    const specialty = await this.findOne(id);
    Object.assign(specialty, updateSpecialtyDto);
    return await this.specialtyRepository.save(specialty);
  }

  async remove(
    id: number,
    currentUser: { id: number; role: string },
  ): Promise<{ message: string }> {
    this.checkRole(currentUser, ['admin']);
    const specialty = await this.findOne(id);
    await this.specialtyRepository.remove(specialty);
    return { message: 'Specialty deleted successfully' };
  }

  private checkRole(currentUser: { role: string }, allowed: string[]) {
    if (!allowed.includes(currentUser.role)) {
      throw new ForbiddenException('لا تملك صلاحية تنفيذ هذه العملية');
    }
  }
}
