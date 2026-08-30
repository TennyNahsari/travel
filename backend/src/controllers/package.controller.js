const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper to generate unique package code (PKG-YYYYMMDD-XXXX)
const generatePackageCode = async () => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const countToday = await prisma.packageBooking.count({
    where: {
      createdAt: {
        gte: new Date(now.setHours(0, 0, 0, 0))
      }
    }
  });
  const seq = (countToday + 1).toString().padStart(4, '0');
  return `PKG-${dateStr}-${seq}`;
};

// Check package availability & remaining quota for a schedule
exports.checkAvailability = async (req, res) => {
  try {
    const { scheduleId } = req.query;

    if (!scheduleId) {
      return res.status(400).json({ error: 'Schedule ID is required' });
    }

    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        vehicle: true,
        route: {
          include: {
            originCity: true,
            destinationCity: true
          }
        }
      }
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const vehicle = schedule.vehicle || {};
    const maxCount = (vehicle.maxPackageCount && Number(vehicle.maxPackageCount) > 0) ? Number(vehicle.maxPackageCount) : 5;
    const maxWeight = (vehicle.maxPackageWeight && Number(vehicle.maxPackageWeight) > 0) ? Number(vehicle.maxPackageWeight) : 50;
    const pricePerKg = (vehicle.packagePricePerKg && Number(vehicle.packagePricePerKg) > 0) ? Number(vehicle.packagePricePerKg) : 10000;

    // Aggregate active package bookings for this schedule
    const activePackages = await prisma.packageBooking.findMany({
      where: {
        scheduleId,
        status: { not: 'CANCELLED' }
      }
    });

    const usedItems = activePackages.reduce((sum, p) => sum + (p.itemCount || 1), 0);
    const usedWeight = activePackages.reduce((sum, p) => sum + (p.weightKg || 1), 0);

    const availableItems = Math.max(0, maxCount - usedItems);
    const availableWeight = Math.max(0, maxWeight - usedWeight);

    res.json({
      success: true,
      data: {
        scheduleId,
        vehicleType: vehicle.vehicleType || 'Shuttle',
        plateNumber: vehicle.plateNumber || '',
        route: `${schedule.route?.originCity?.name || ''} → ${schedule.route?.destinationCity?.name || ''}`,
        departureDate: schedule.departureDate,
        departureTime: schedule.departureTime,
        supportsPackage: true,
        maxPackageCount: maxCount,
        maxPackageWeight: maxWeight,
        usedItems,
        usedWeight,
        availableItems,
        availableWeight,
        packagePricePerKg: pricePerKg
      }
    });
  } catch (error) {
    console.error('Check package availability error:', error);
    res.status(500).json({ error: 'Failed to check package availability' });
  }
};

// Create package booking (Public / Landing Page / Authenticated)
exports.createPackageBooking = async (req, res) => {
  try {
    const {
      scheduleId,
      senderName,
      senderPhone,
      senderAddress,
      recipientName,
      recipientPhone,
      recipientAddress,
      packageDescription,
      itemCount = 1,
      weightKg = 1,
      notes,
      paymentMethod = 'TRANSFER'
    } = req.body;

    // Basic Validation
    if (!scheduleId || !senderName || !senderPhone || !recipientName || !recipientPhone || !recipientAddress || !packageDescription) {
      return res.status(400).json({ error: 'Mohon lengkapi semua field formulir pengiriman paket yang wajib diisi' });
    }

    const parsedItemCount = parseInt(itemCount, 10) || 1;
    const parsedWeightKg = parseInt(weightKg, 10) || 1;

    // Get Schedule & Vehicle
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        vehicle: true
      }
    });

    if (!schedule) {
      return res.status(404).json({ error: 'Jadwal keberangkatan tidak ditemukan' });
    }

    const vehicle = schedule.vehicle || {};
    const maxCount = (vehicle.maxPackageCount && Number(vehicle.maxPackageCount) > 0) ? Number(vehicle.maxPackageCount) : 5;
    const maxWeight = (vehicle.maxPackageWeight && Number(vehicle.maxPackageWeight) > 0) ? Number(vehicle.maxPackageWeight) : 50;
    const pricePerKg = (vehicle.packagePricePerKg && Number(vehicle.packagePricePerKg) > 0) ? Number(vehicle.packagePricePerKg) : 10000;

    // Check existing load
    const activePackages = await prisma.packageBooking.findMany({
      where: {
        scheduleId,
        status: { not: 'CANCELLED' }
      }
    });

    const currentUsedItems = activePackages.reduce((sum, p) => sum + (p.itemCount || 1), 0);
    const currentUsedWeight = activePackages.reduce((sum, p) => sum + (p.weightKg || 1), 0);

    if (maxCount > 0 && currentUsedItems + parsedItemCount > maxCount) {
      return res.status(400).json({
        error: `Batas maksimal jumlah unit paket (${maxCount} paket) untuk jadwal ini telah terpenuhi. Sisa kuota: ${Math.max(0, maxCount - currentUsedItems)} paket.`
      });
    }

    if (maxWeight > 0 && currentUsedWeight + parsedWeightKg > maxWeight) {
      return res.status(400).json({
        error: `Batas maksimal berat paket (${maxWeight} Kg) untuk jadwal ini telah terpenuhi. Sisa kuota: ${Math.max(0, maxWeight - currentUsedWeight)} Kg.`
      });
    }

    // Calculate total price
    const totalPrice = parsedWeightKg * pricePerKg;
    const packageCode = await generatePackageCode();

    const newPackage = await prisma.packageBooking.create({
      data: {
        packageCode,
        scheduleId,
        userId: req.user ? req.user.id : null,
        senderName,
        senderPhone,
        senderAddress: senderAddress || null,
        recipientName,
        recipientPhone,
        recipientAddress,
        packageDescription,
        itemCount: parsedItemCount,
        weightKg: parsedWeightKg,
        totalPrice,
        paymentMethod,
        status: 'PENDING',
        paymentDeadline: new Date(Date.now() + 60 * 60 * 1000),
        paymentNotes: notes || null
      },
      include: {
        schedule: {
          include: {
            vehicle: true,
            route: {
              include: {
                originCity: true,
                destinationCity: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Pemesanan pengiriman paket berhasil dibuat',
      data: newPackage
    });
  } catch (error) {
    console.error('Create package booking error:', error);
    res.status(500).json({ error: 'Gagal membuat pemesanan pengiriman paket' });
  }
};

// Get all packages (Admin / Dashboard)
exports.getPackages = async (req, res) => {
  try {

    // Auto-cancel overdue PENDING package bookings
    const now = new Date();
    await prisma.packageBooking.updateMany({
      where: {
        status: 'PENDING',
        OR: [
          { paymentDeadline: { lt: now } },
          { paymentDeadline: null, createdAt: { lt: new Date(now.getTime() - 60 * 60 * 1000) } }
        ]
      },
      data: { status: 'CANCELLED' }
    });

    const { status, search, startDate, endDate } = req.query;

    const where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = eDate;
      }
    }
    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { packageCode: { contains: search, mode: 'insensitive' } },
        { senderName: { contains: search, mode: 'insensitive' } },
        { senderPhone: { contains: search, mode: 'insensitive' } },
        { recipientName: { contains: search, mode: 'insensitive' } },
        { recipientPhone: { contains: search, mode: 'insensitive' } },
        { packageDescription: { contains: search, mode: 'insensitive' } }
      ];
    }

    const packages = await prisma.packageBooking.findMany({
      where,
      include: {
        schedule: {
          include: {
            vehicle: true,
            route: {
              include: {
                originCity: true,
                destinationCity: true
              }
            }
          }
        },
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: packages
    });
  } catch (error) {
    console.error('Get packages error:', error);
    res.status(500).json({ error: 'Gagal mengambil data pengiriman paket' });
  }
};

// Get package by Code or ID
exports.getPackageByCode = async (req, res) => {
  try {
    const { code } = req.params;

    const packageData = await prisma.packageBooking.findFirst({
      where: {
        OR: [
          { id: code },
          { packageCode: code }
        ]
      },
      include: {
        schedule: {
          include: {
            vehicle: true,
            route: {
              include: {
                originCity: true,
                destinationCity: true
              }
            }
          }
        },
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!packageData) {
      return res.status(404).json({ error: 'Data paket tidak ditemukan' });
    }

    res.json({
      success: true,
      data: packageData
    });
  } catch (error) {
    console.error('Get package by code error:', error);
    res.status(500).json({ error: 'Gagal mengambil detail paket' });
  }
};

// Update package status (Admin/Operator)
exports.updatePackageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentNotes } = req.body;

    const packageData = await prisma.packageBooking.findUnique({
      where: { id }
    });

    if (!packageData) {
      return res.status(404).json({ error: 'Data paket tidak ditemukan' });
    }

    const updatedData = {
      status,
      paymentNotes: paymentNotes !== undefined ? paymentNotes : packageData.paymentNotes
    };

    if ((status === 'PAID' || status === 'CONFIRMED') && !packageData.paidAt) {
      updatedData.paidAt = new Date();
    }

    const updated = await prisma.packageBooking.update({
      where: { id },
      data: updatedData,
      include: {
        schedule: {
          include: {
            vehicle: true,
            route: {
              include: {
                originCity: true,
                destinationCity: true
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Status pengiriman paket berhasil diperbarui',
      data: updated
    });
  } catch (error) {
    console.error('Update package status error:', error);
    res.status(500).json({ error: 'Gagal mengubah status paket' });
  }
};

// Submit payment proof for package
exports.submitPaymentProof = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      paymentProofUrl,
      paymentSenderName,
      paymentBankName,
      paymentTargetBank,
      paymentAmount,
      paymentNotes
    } = req.body;

    const packageData = await prisma.packageBooking.findUnique({
      where: { id }
    });

    if (!packageData) {
      return res.status(404).json({ error: 'Data paket tidak ditemukan' });
    }

    const updated = await prisma.packageBooking.update({
      where: { id },
      data: {
        paymentProofUrl: paymentProofUrl || packageData.paymentProofUrl,
        paymentSenderName: paymentSenderName || packageData.paymentSenderName,
        paymentBankName: paymentBankName || packageData.paymentBankName,
        paymentTargetBank: paymentTargetBank || packageData.paymentTargetBank,
        paymentAmount: paymentAmount ? parseInt(paymentAmount, 10) : (packageData.paymentAmount || packageData.totalPrice),
        paymentNotes: paymentNotes || packageData.paymentNotes,
        status: packageData.status === 'PENDING' ? 'PAID' : packageData.status,
        paidAt: packageData.paidAt || new Date()
      },
      include: {
        schedule: {
          include: {
            vehicle: true,
            route: {
              include: {
                originCity: true,
                destinationCity: true
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Bukti pembayaran paket berhasil dikirim',
      data: updated
    });
  } catch (error) {
    console.error('Submit package payment proof error:', error);
    res.status(500).json({ error: 'Gagal mengunggah bukti pembayaran paket' });
  }
};

// Delete package (Admin/Operator)
exports.deletePackage = async (req, res) => {
  try {
    const { id } = req.params;

    const packageData = await prisma.packageBooking.findUnique({
      where: { id }
    });

    if (!packageData) {
      return res.status(404).json({ error: 'Data paket tidak ditemukan' });
    }

    await prisma.packageBooking.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Data pengiriman paket berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete package error:', error);
    res.status(500).json({ error: 'Gagal menghapus data pengiriman paket' });
  }
};
