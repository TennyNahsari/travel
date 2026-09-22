const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper: Check if should generate for this date based on recurring type
function shouldGenerateForDate(template, date) {
  const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday

  switch (template.recurringType) {
    case 'DAILY':
      return true;

    case 'WEEKLY':
      if (!template.recurringDays || !Array.isArray(template.recurringDays)) {
        return false;
      }
      return template.recurringDays.includes(dayOfWeek);

    case 'MONTHLY':
      const templateDate = new Date(template.departureDate);
      return date.getDate() === templateDate.getDate();

    default:
      return false;
  }
}

// Helper: Check if schedule already exists
async function checkScheduleExists(template, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const existing = await prisma.schedule.findFirst({
    where: {
      routeId: template.routeId,
      vehicleId: template.vehicleId,
      departureDate: {
        gte: startOfDay,
        lte: endOfDay
      },
      departureTime: template.departureTime,
      isTemplate: false
    }
  });

  return !!existing;
}

// Helper: Check vehicle & driver availability
async function checkAvailability(template, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const conflictingSchedule = await prisma.schedule.findFirst({
    where: {
      departureDate: {
        gte: startOfDay,
        lte: endOfDay
      },
      departureTime: template.departureTime,
      isTemplate: false,
      OR: [
        { vehicleId: template.vehicleId },
        { driverId: template.driverId }
      ],
      NOT: {
        routeId: template.routeId
      }
    }
  });

  if (conflictingSchedule) {
    return {
      available: false,
      reason: 'Kendaraan atau driver sudah terjadwal'
    };
  }

  return { available: true };
}

/**
 * Ensures schedules exist for all active recurring templates within the given date range.
 * If schedules don't exist yet for a matching template date, creates them automatically.
 */
async function ensureSchedulesForDateRange(startDateInput, endDateInput) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = startDateInput ? new Date(startDateInput) : new Date(today);
    start.setHours(0, 0, 0, 0);

    const effectiveStart = start < today ? today : start;

    const end = endDateInput ? new Date(endDateInput) : new Date(effectiveStart);
    if (!endDateInput || end <= effectiveStart) {
      end.setDate(effectiveStart.getDate() + 14);
    }
    end.setHours(23, 59, 59, 999);

    const templates = await prisma.schedule.findMany({
      where: {
        isTemplate: true,
        isActive: true,
        recurringType: { not: 'NONE' }
      },
      include: {
        vehicle: true
      }
    });

    if (templates.length === 0) return 0;

    const dateRange = [];
    for (let d = new Date(effectiveStart); d <= end; d.setDate(d.getDate() + 1)) {
      dateRange.push(new Date(d));
    }

    const schedulesToCreate = [];

    for (const template of templates) {
      for (const date of dateRange) {
        if (!shouldGenerateForDate(template, date)) {
          continue;
        }

        const exists = await checkScheduleExists(template, date);
        if (exists) continue;

        const availability = await checkAvailability(template, date);
        if (!availability.available) continue;

        schedulesToCreate.push({
          routeId: template.routeId,
          vehicleId: template.vehicleId,
          driverId: template.driverId,
          departureDate: new Date(date),
          departureTime: template.departureTime,
          ticketPrice: template.ticketPrice,
          availableSeats: template.vehicle?.capacity || template.availableSeats || 10,
          sourceTemplateId: template.id,
          poolOrigin: template.poolOrigin || null,
          poolDestination: template.poolDestination || null,
          imageUrl: template.imageUrl || null,
          isTemplate: false,
          isActive: true
        });
      }
    }

    if (schedulesToCreate.length > 0) {
      await prisma.schedule.createMany({
        data: schedulesToCreate
      });
    }

    return schedulesToCreate.length;
  } catch (error) {
    console.error('Error in ensureSchedulesForDateRange:', error);
    return 0;
  }
}

module.exports = {
  shouldGenerateForDate,
  checkScheduleExists,
  checkAvailability,
  ensureSchedulesForDateRange
};
