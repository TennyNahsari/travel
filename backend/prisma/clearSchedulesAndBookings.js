const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearData() {
  try {
    console.log('🗑️  Memulai penghapusan data tabel Booking dan Jadwal Perjalanan...\n');

    // 1. Delete all bookings
    console.log('📋 Menghapus semua data Booking & Pembayaran...');
    const deletedBookings = await prisma.booking.deleteMany({});
    console.log(`✅ ${deletedBookings.count} data booking berhasil dihapus.\n`);

    // 2. Delete all schedules (both template and generated schedules)
    console.log('📅 Menghapus semua data Jadwal Perjalanan...');
    const deletedSchedules = await prisma.schedule.deleteMany({});
    console.log(`✅ ${deletedSchedules.count} data jadwal perjalanan berhasil dihapus.\n`);

    console.log('🎉 Selesai! Data tabel booking, pembayaran, dan jadwal perjalanan berhasil dibersihkan.');
  } catch (error) {
    console.error('❌ Error saat menghapus data:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

clearData();

