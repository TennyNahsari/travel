const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const futureOnly = await prisma.schedule.findMany({
    where: { isTemplate: false, departureDate: { gte: startOfToday } }
  });
  console.log('Count gte startOfToday:', futureOnly.length);

  const all = await prisma.schedule.findMany({
    where: { isTemplate: false }
  });
  console.log('Count ALL:', all.length);

  const past = all.filter(s => new Date(s.departureDate) < startOfToday);
  console.log('Past schedules:', past.map(p => ({ id: p.id, date: p.departureDate, status: p.status })));
}

run().finally(() => prisma.$disconnect());
