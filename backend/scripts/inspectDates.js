const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspect() {
  const schedules = await prisma.schedule.findMany({
    where: { isTemplate: false },
    take: 10,
    select: {
      id: true,
      departureDate: true,
      departureTime: true,
      route: {
        select: {
          originCity: { select: { name: true } },
          destinationCity: { select: { name: true } }
        }
      }
    }
  });

  console.log('Inspecting 10 schedule departureDates in DB:');
  schedules.forEach(s => {
    const raw = s.departureDate;
    const iso = raw.toISOString();
    const dateOnly = iso.split('T')[0];
    console.log(`ID: ${s.id} | ISO: ${iso} | DateOnly: ${dateOnly} | Time: ${s.departureTime} | Route: ${s.route.originCity.name}->${s.route.destinationCity.name}`);
  });
}

inspect().finally(() => prisma.$disconnect());
