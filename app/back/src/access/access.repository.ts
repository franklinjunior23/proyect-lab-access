import { Injectable } from '@nestjs/common';
import { Result } from '../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';

const MAX_LOGS = 1000;

@Injectable()
export class AccessRepository {
  constructor(private readonly prisma: PrismaService) {}

  async logAccess(uid: string, result: Result, description?: string, userId?: number) {
    return this.prisma.accessLog.create({
      data: { uid, result, description, userId },
    });
  }

  async findAll(from?: Date, to?: Date) {
    return this.prisma.accessLog.findMany({
      where: {
        timestamp: {
          ...(from ? { gte: from } : {}),
          ...(to   ? { lte: to   } : {}),
        },
      },
      orderBy: { timestamp: 'desc' },
      take: MAX_LOGS,
      include: { user: { select: { name: true } } },
    });
  }

  async findByUserId(userId: number) {
    return this.prisma.accessLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
    });
  }
}
