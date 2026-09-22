const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testFix() {
  const dateStr = '2026-09-23';
  const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);

  // WRONG WAY (UTC parse):
  const wrongStart = new Date(dateStr);
  const wrongEnd = new Date(wrongStart);
  wrongEnd.setDate(wrongEnd.getDate() + 1);

  const wrongResults = await prisma.schedule.findMany({
    where: {
      isTemplate: false,
      departureDate: { gte: wrongStart, lt: wrongEnd }
    }
  });

  console.log('--- WRONG (UTC parse new Date("2026-09-23")) ---');
  console.log('Query range:', wrongStart.toISOString(), 'to', wrongEnd.toISOString());
  console.log('Count returned:', wrongResults.length);
  wrongResults.forEach(s => {
    console.log(`- ID: ${s.id}, stored ISO: ${s.departureDate.toISOString()}, formatted id-ID: ${s.departureDate.toLocaleDateString('id-ID')}`);
  });

  // CORRECT WAY (Local date bounds):
  const correctStart = new Date(year, month - 1, day, 0, 0, 0, 0);
  const correctEnd = new Date(year, month - 1, day, 23, 59, 59, 999);

  const correctResults = await prisma.schedule.findMany({
    where: {
      isTemplate: false,
      departureDate: { gte: correctStart, lte: correctEnd }
    }
  });

  console.log('\n--- CORRECT (Local parse new Date(2026, 8, 23)) ---');
  console.log('Query range:', correctStart.toISOString(), 'to', correctEnd.toISOString());
  console.log('Count returned:', correctResults.length);
  correctResults.forEach(s => {
    console.log(`- ID: ${s.id}, stored ISO: ${s.departureDate.toISOString()}, formatted id-ID: ${s.departureDate.toLocaleDateString('id-ID')}`);
  });
}

testFix().finally(() => prisma.$disconnect());
