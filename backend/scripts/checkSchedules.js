const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const allSchedules = await prisma.schedule.findMany({
    where: { isTemplate: false },
    include: {
      bookings: true,
      route: {
        include: { originCity: true, destinationCity: true }
      }
    }
  });

  console.log('Total non-template schedules in DB:', allSchedules.length);
  console.log('System current time:', new Date().toISOString());
  console.log('Today start:', today.toISOString());

  const pastSchedules = allSchedules.filter(s => new Date(s.departureDate) < today);
  const completedOrCancelledSchedules = allSchedules.filter(s => s.status === 'COMPLETED' || s.status === 'CANCELLED');

  console.log('\nPast schedules (date < today):', pastSchedules.length);
  pastSchedules.forEach(s => {
    console.log(`- ID: ${s.id}, Route: ${s.route.originCity.name} -> ${s.route.destinationCity.name}, Date: ${s.departureDate.toISOString().split('T')[0]}, Status: ${s.status}, Bookings: ${s.bookings.length}`);
  });

  console.log('\nCompleted / Cancelled schedules:', completedOrCancelledSchedules.length);
  completedOrCancelledSchedules.forEach(s => {
    console.log(`- ID: ${s.id}, Route: ${s.route.originCity.name} -> ${s.route.destinationCity.name}, Date: ${s.departureDate.toISOString().split('T')[0]}, Status: ${s.status}, Bookings: ${s.bookings.length}`);
  });
}

check().finally(() => prisma.$disconnect());
