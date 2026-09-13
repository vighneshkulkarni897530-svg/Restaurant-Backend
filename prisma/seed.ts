import { PrismaClient } from '@prisma/client';
import { ensureDatabaseInitialized } from '../src/lib/bootstrap';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting safe database seeding...');
  await ensureDatabaseInitialized();
  console.log('✅ Seeding completed safely without overwriting previous orders or customer data.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
