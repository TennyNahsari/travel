const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const schedules = await prisma.schedule.findMany({
    where: { isTemplate: false },
    include: {
      bookings: true,
      route: {
        include: {
          originCity: true,
          destinationCity: true
        }
      }
    }
  });

  console.log(`Found ${schedules.length} total daily non-template schedule(s).`);

  let deleted = 0;
  let kept = 0;

  for (const s of schedules) {
    if (s.bookings && s.bookings.length > 0) {
      console.log(`[KEPT] ID: ${s.id} (${s.route.originCity.name} -> ${s.route.destinationCity.name} on ${s.departureDate.toISOString().split('T')[0]}) has ${s.bookings.length} booking(s).`);
      kept++;
    } else {
      try {
        await prisma.schedule.delete({
          where: { id: s.id }
        });
        deleted++;
      } catch (err) {
        console.error(`[ERROR] Deleting ID: ${s.id}:`, err.message);
        kept++;
      }
    }
  }

  console.log(`\nResult summary:`);
  console.log(`- Deleted: ${deleted} unbooked daily schedule(s)`);
  console.log(`- Kept: ${kept} schedule(s) with existing bookings`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
