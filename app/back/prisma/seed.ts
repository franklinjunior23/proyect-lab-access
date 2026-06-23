import 'dotenv/config';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '../src/generated/prisma';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.adminUser.findUnique({ where: { username: 'admin' } });

  if (!existing) {
    const password = await bcrypt.hash('admin123', 10);
    await prisma.adminUser.create({ data: { username: 'admin', password } });
    console.log('Seed: admin user created  →  username: admin  |  password: admin123');
  } else {
    console.log('Seed: admin user already exists, skipping.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
