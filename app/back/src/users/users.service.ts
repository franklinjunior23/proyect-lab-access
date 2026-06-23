import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  findAll() {
    return this.usersRepository.findAll();
  }

  async findOne(id: number) {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async create(dto: CreateUserDto) {
    const existing = await this.usersRepository.findByUid(dto.uid);
    if (existing) throw new ConflictException(`UID ${dto.uid} already registered`);
    return this.usersRepository.create(dto);
  }

  async update(id: number, dto: UpdateUserDto) {
    await this.findOne(id);
    return this.usersRepository.update(id, dto);
  }

  async toggle(id: number) {
    const user = await this.findOne(id);
    return this.usersRepository.update(id, { active: !user.active });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.usersRepository.delete(id);
  }
}
