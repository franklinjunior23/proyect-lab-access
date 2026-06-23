import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '../generated/prisma';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
