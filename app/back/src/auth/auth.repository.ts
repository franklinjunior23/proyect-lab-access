import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUsername(username: string) {
    return this.prisma.adminUser.findUnique({ where: { username } });
  }

  async create(username: string, hashedPassword: string) {
    return this.prisma.adminUser.create({
      data: { username, password: hashedPassword },
    });
  }
}
