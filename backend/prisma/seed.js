const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create users
  console.log('Creating users...');
  
  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@travel.com' },
    update: {},
    create: {
      email: 'admin@travel.com',
      password: hashedPassword,
      name: 'Admin Travel',
      phone: '081234567890',
      role: 'ADMIN'
    }
  });

  const operator = await prisma.user.upsert({
    where: { email: 'operator@travel.com' },
    update: {},
    create: {
      email: 'operator@travel.com',
      password: hashedPassword,
      name: 'Operator Travel',
      phone: '081234567891',
      role: 'OPERATOR'
    }
  });

  const driverUser = await prisma.user.upsert({
    where: { email: 'driver@travel.com' },
    update: {},
    create: {
      email: 'driver@travel.com',
      password: hashedPassword,
      name: 'Driver Budi',
      phone: '081234567892',
      role: 'DRIVER'
    }
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@travel.com' },
    update: {},
    create: {
      email: 'customer@travel.com',
      password: hashedPassword,
      name: 'Customer Test',
      phone: '081234567893',
      role: 'CUSTOMER'
    }
  });

  console.log('✅ Users created');

  // Create cities
  console.log('Creating cities...');

  const jakarta = await prisma.city.upsert({
    where: { id: 'jakarta-id' },
    update: {},
    create: {
      id: 'jakarta-id',
      name: 'Jakarta',
      province: 'DKI Jakarta'
    }
  });

  const bandung = await prisma.city.upsert({
    where: { id: 'bandung-id' },
    update: {},
    create: {
      id: 'bandung-id',
      name: 'Bandung',
      province: 'Jawa Barat'
    }
  });

  const surabaya = await prisma.city.upsert({
    where: { id: 'surabaya-id' },
    update: {},
    create: {
      id: 'surabaya-id',
      name: 'Surabaya',
      province: 'Jawa Timur'
    }
  });

  const yogyakarta = await prisma.city.upsert({
    where: { id: 'yogyakarta-id' },
    update: {},
    create: {
      id: 'yogyakarta-id',
      name: 'Yogyakarta',
      province: 'DI Yogyakarta'
    }
  });

  const cirebon = await prisma.city.upsert({
    where: { id: 'cirebon-id' },
    update: {},
    create: {
      id: 'cirebon-id',
      name: 'Cirebon',
      province: 'Jawa Barat'
    }
  });

  const semarang = await prisma.city.upsert({
    where: { id: 'semarang-id' },
    update: {},
    create: {
      id: 'semarang-id',
      name: 'Semarang',
      province: 'Jawa Tengah'
    }
  });

  console.log('✅ Cities created');

  // Create routes
  console.log('Creating routes...');

  const getOrCreateRoute = async (originCityId, destinationCityId, distance, estimatedTime, basePrice) => {
    let r = await prisma.route.findFirst({
      where: { originCityId, destinationCityId }
    });
    if (!r) {
      r = await prisma.route.create({
        data: { originCityId, destinationCityId, distance, estimatedTime, basePrice }
      });
    }
    return r;
  };

  const route1 = await getOrCreateRoute(jakarta.id, bandung.id, 150, 180, 100000);
  const route2 = await getOrCreateRoute(jakarta.id, surabaya.id, 800, 720, 300000);
  const route3 = await getOrCreateRoute(bandung.id, yogyakarta.id, 400, 480, 200000);
  const routeCrb = await getOrCreateRoute(jakarta.id, cirebon.id, 220, 210, 130000);
  const routeSmg = await getOrCreateRoute(jakarta.id, semarang.id, 450, 360, 200000);

  console.log('✅ Routes created');

  // Create vehicles
  console.log('Creating vehicles...');

  const getOrCreateVehicle = async (plateNumber, vehicleType, capacity, status = 'ACTIVE', description = null, facilities = null, imageUrl = null) => {
    let v = await prisma.vehicle.findUnique({ where: { plateNumber } });
    if (!v) {
      v = await prisma.vehicle.create({
        data: {
          plateNumber,
          vehicleType,
          capacity,
          status,
          description,
          facilities,
          imageUrl,
          maxCharter: 2,
          charterPrice: 1000000,
          maxPackageCount: 5,
          maxPackageWeight: 50,
          packagePricePerKg: 10000
        }
      });
    } else {
      v = await prisma.vehicle.update({
        where: { plateNumber },
        data: { description, facilities, imageUrl }
      });
    }
    return v;
  };

  const vehicle1 = await getOrCreateVehicle(
    'B-1234-XYZ',
    'Toyota Hiace Premio Executive',
    12,
    'ACTIVE',
    'Armada flagship mewah 12 kursi captain seat Reclining 1-1 dengan legroom lega, USB fast charger, Full AC, dan suspense empuk.',
    ["Reclining Captain Seat", "USB Charging Port", "Full AC Premium", "WiFi Hi-Speed", "Bagasi Ekstra", "Air Minum Gratis"],
    'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80'
  );
  const vehicle2 = await getOrCreateVehicle(
    'B-5678-ABC',
    'Isuzu Elf Long Luxury',
    16,
    'ACTIVE',
    'Armada kapasitas besar 16 kursi ekonomis-mewah dengan kabin tinggi, AC double blower dingin merata, dan peredam suara halus.',
    ["Seat Reclining", "AC Double Blower", "USB Charger", "Sound System TV", "Bagasi Luas"],
    'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'
  );
  const vehicle3 = await getOrCreateVehicle('AB-9999-CD', 'Avanza Executive', 7, 'MAINTENANCE');

  console.log('✅ Vehicles created with description and facilities');

  // Create driver
  console.log('Creating driver...');

  let driver = await prisma.driver.findUnique({
    where: { userId: driverUser.id }
  });
  if (!driver) {
    driver = await prisma.driver.create({
      data: {
        userId: driverUser.id,
        licenseNumber: 'SIM-123456789',
        status: 'ACTIVE'
      }
    });
  }

  console.log('✅ Driver created');

  // Create schedule templates
  console.log('Creating schedule templates...');

  const createTemplateIfNotExists = async (templateName, routeId, vehicleId, driverId, departureTime, ticketPrice, availableSeats, poolOrigin, poolDestination, imageUrl) => {
    const existing = await prisma.schedule.findFirst({
      where: { templateName, isTemplate: true }
    });
    if (!existing) {
      await prisma.schedule.create({
        data: {
          templateName,
          routeId,
          vehicleId,
          driverId,
          departureDate: new Date('2026-01-01'),
          departureTime,
          ticketPrice,
          availableSeats,
          poolOrigin,
          poolDestination,
          imageUrl,
          isTemplate: true,
          isActive: true,
          recurringType: 'DAILY'
        }
      });
    } else {
      // Update existing template with pool & image info
      await prisma.schedule.update({
        where: { id: existing.id },
        data: { poolOrigin, poolDestination, imageUrl }
      });
    }
  };

  await createTemplateIfNotExists('Rute Pagi JKT-BDG', route1.id, vehicle1.id, driver.id, '08:00', 120000, 14, 'Pool Semanggi / Lebak Bulus', 'Pool Pasteur / Dipatiukur', 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80');
  await createTemplateIfNotExists('Rute Pagi JKT-CRB', routeCrb.id, vehicle1.id, driver.id, '09:00', 150000, 14, 'Pool Semanggi / Pulo Gebang', 'Pool Cirebon Superblock (CSB)', 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80');
  await createTemplateIfNotExists('Trans-Jawa JKT-SMG', routeSmg.id, vehicle2.id, driver.id, '07:00', 230000, 16, 'Pool Lebak Bulus', 'Pool Simpang Lima Semarang', 'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&w=800&q=80');

  console.log('✅ Schedule templates created/updated');

  // Update existing active schedules with pool & image info if missing
  await prisma.schedule.updateMany({
    where: { routeId: route1.id, isTemplate: false },
    data: { poolOrigin: 'Pool Semanggi / Lebak Bulus', poolDestination: 'Pool Pasteur / Dipatiukur', imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80' }
  });

  await prisma.schedule.updateMany({
    where: { routeId: routeCrb.id, isTemplate: false },
    data: { poolOrigin: 'Pool Semanggi / Pulo Gebang', poolDestination: 'Pool Cirebon Superblock (CSB)', imageUrl: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80' }
  });

  await prisma.schedule.updateMany({
    where: { routeId: routeSmg.id, isTemplate: false },
    data: { poolOrigin: 'Pool Lebak Bulus', poolDestination: 'Pool Simpang Lima Semarang', imageUrl: 'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&w=800&q=80' }
  });

  // Create schedules
  console.log('Creating schedules...');

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const schedule1 = await prisma.schedule.create({
    data: {
      routeId: route1.id,
      vehicleId: vehicle1.id,
      driverId: driver.id,
      departureDate: tomorrow,
      departureTime: '08:00',
      ticketPrice: 120000,
      availableSeats: 14
    }
  });

  const schedule2 = await prisma.schedule.create({
    data: {
      routeId: route2.id,
      vehicleId: vehicle2.id,
      driverId: driver.id,
      departureDate: tomorrow,
      departureTime: '20:00',
      ticketPrice: 350000,
      availableSeats: 16
    }
  });

  console.log('✅ Schedules created');

  // Create sample booking
  console.log('Creating sample booking...');

  const booking = await prisma.booking.create({
    data: {
      bookingCode: 'BK-' + Date.now(),
      userId: customer.id,
      scheduleId: schedule1.id,
      seatNumbers: ['A1', 'A2'],
      totalSeats: 2,
      totalPrice: 240000,
      status: 'PAID',
      paymentMethod: 'Transfer Bank',
      paidAt: new Date()
    }
  });

  console.log('✅ Sample booking created');

  console.log('🎉 Seed completed successfully!');
  console.log('\n📧 Default users:');
  console.log('Admin: admin@travel.com / password123');
  console.log('Operator: operator@travel.com / password123');
  console.log('Driver: driver@travel.com / password123');
  console.log('Customer: customer@travel.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
