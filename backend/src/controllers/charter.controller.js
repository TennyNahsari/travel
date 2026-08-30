const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Generate unique charter code
const generateCharterCode = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `CTR-${dateStr}-${randomSuffix}`;
};

// Check availability for a specific vehicle and date
exports.checkAvailability = async (req, res) => {
  try {
    const { vehicleId, charterDate } = req.query;

    if (!vehicleId || !charterDate) {
      return res.status(400).json({ error: 'vehicleId and charterDate are required' });
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId }
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const targetDate = new Date(charterDate);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // Get active charters for date A
    const activeCharters = await prisma.charter.findMany({
      where: {
        vehicleId,
        charterDate: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: {
          not: 'CANCELLED'
        }
      }
    });

    const currentBookedCount = activeCharters.reduce((acc, item) => acc + (item.totalVehicles || 1), 0);
    const maxCharter = vehicle.maxCharter > 0 ? vehicle.maxCharter : 2;
    const charterPrice = vehicle.charterPrice > 0 ? vehicle.charterPrice : 1000000;
    const availableQuota = Math.max(0, maxCharter - currentBookedCount);

    res.json({
      success: true,
      data: {
        vehicleId: vehicle.id,
        vehicleType: vehicle.vehicleType,
        maxCharter,
        charterPrice,
        currentBookedCount,
        availableQuota,
        isAvailable: availableQuota > 0
      }
    });
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
};

// Create new charter booking
exports.createCharter = async (req, res) => {
  try {
    const {
      vehicleId,
      originCityId,
      destinationCityId,
      originAddress,
      destinationAddress,
      charterDate,
      durationDays = 1,
      totalVehicles = 1,
      customerName,
      customerPhone,
      customerEmail,
      notes,
      paymentMethod,
      userId
    } = req.body;

    // Basic validation
    if (!vehicleId || !charterDate || !originAddress || !destinationAddress || !customerName || !customerPhone) {
      return res.status(400).json({
        error: 'Armada, tanggal charter, alamat asal, alamat tujuan, nama, dan no WhatsApp wajib diisi.'
      });
    }

    // Check vehicle
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId }
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Armada tidak ditemukan' });
    }

    if (vehicle.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Armada sedang tidak aktif untuk dicarter' });
    }

    const maxCharter = vehicle.maxCharter > 0 ? vehicle.maxCharter : 2;
    const charterPrice = vehicle.charterPrice > 0 ? vehicle.charterPrice : 1000000;

    const requestedVehicles = parseInt(totalVehicles, 10) || 1;
    const requestedDays = parseInt(durationDays, 10) || 1;

    // Check charter quota for date A
    const targetDate = new Date(charterDate);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const activeCharters = await prisma.charter.findMany({
      where: {
        vehicleId,
        charterDate: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: {
          not: 'CANCELLED'
        }
      }
    });

    const currentBookedCount = activeCharters.reduce((acc, item) => acc + (item.totalVehicles || 1), 0);
    const availableQuota = maxCharter - currentBookedCount;

    if (requestedVehicles > availableQuota) {
      return res.status(400).json({
        error: `Kuota charter armada ${vehicle.vehicleType} untuk tanggal tersebut sudah penuh. Maksimal ${maxCharter} unit per hari (Sisa kuota: ${Math.max(0, availableQuota)} unit).`
      });
    }

    // Calculate total price
    const unitPrice = charterPrice;
    const totalPrice = unitPrice * requestedDays * requestedVehicles;

    const charterCode = generateCharterCode();

    const charter = await prisma.charter.create({
      data: {
        charterCode,
        userId: userId || null,
        vehicleId,
        originCityId: originCityId || null,
        destinationCityId: destinationCityId || null,
        originAddress,
        destinationAddress,
        charterDate: new Date(charterDate),
        durationDays: requestedDays,
        totalVehicles: requestedVehicles,
        totalPrice,
        customerName,
        customerPhone,
        customerEmail: customerEmail || null,
        notes: notes || null,
        paymentMethod: paymentMethod || 'TRANSFER',
        status: 'PENDING',
        paymentDeadline: new Date(Date.now() + 60 * 60 * 1000)
      },
      include: {
        vehicle: true,
        originCity: true,
        destinationCity: true
      }
    });

    res.status(201).json({
      message: 'Booking charter berhasil dibuat',
      data: charter
    });
  } catch (error) {
    console.error('Create charter error:', error);
    res.status(500).json({ error: 'Gagal membuat booking charter' });
  }
};

// Get all charters (Dashboard Admin & User)
exports.getCharters = async (req, res) => {
  try {
    const { status, search, vehicleId, startDate, endDate } = req.query;

    // Auto-cancel overdue PENDING charters
    const now = new Date();
    await prisma.charter.updateMany({
      where: {
        status: 'PENDING',
        OR: [
          { paymentDeadline: { lt: now } },
          { paymentDeadline: null, createdAt: { lt: new Date(now.getTime() - 60 * 60 * 1000) } }
        ]
      },
      data: { status: 'CANCELLED' }
    });

    const where = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (vehicleId) {
      where.vehicleId = vehicleId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = eDate;
      }
    }

    if (search) {
      where.OR = [
        { charterCode: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
        { originAddress: { contains: search, mode: 'insensitive' } },
        { destinationAddress: { contains: search, mode: 'insensitive' } }
      ];
    }

    const charters = await prisma.charter.findMany({
      where,
      include: {
        vehicle: true,
        originCity: true,
        destinationCity: true,
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      message: 'Charters retrieved successfully',
      data: charters
    });
  } catch (error) {
    console.error('Get charters error:', error);
    res.status(500).json({ error: 'Failed to get charters' });
  }
};

// Get charter detail by ID or Code
exports.getCharterByCode = async (req, res) => {
  try {
    const { code } = req.params;

    const charter = await prisma.charter.findFirst({
      where: {
        OR: [
          { id: code },
          { charterCode: code }
        ]
      },
      include: {
        vehicle: true,
        originCity: true,
        destinationCity: true,
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!charter) {
      return res.status(404).json({ error: 'Charter not found' });
    }

    res.json({
      message: 'Charter retrieved successfully',
      data: charter
    });
  } catch (error) {
    console.error('Get charter error:', error);
    res.status(500).json({ error: 'Failed to get charter' });
  }
};

// Update charter status (Admin)
exports.updateCharterStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentNotes } = req.body;

    const charter = await prisma.charter.findUnique({
      where: { id }
    });

    if (!charter) {
      return res.status(404).json({ error: 'Charter not found' });
    }

    const updatedData = {
      status,
      paymentNotes: paymentNotes !== undefined ? paymentNotes : charter.paymentNotes
    };

    if (status === 'PAID' && !charter.paidAt) {
      updatedData.paidAt = new Date();
    }

    const updatedCharter = await prisma.charter.update({
      where: { id },
      data: updatedData,
      include: {
        vehicle: true,
        originCity: true,
        destinationCity: true
      }
    });

    res.json({
      message: 'Status charter berhasil diperbarui',
      data: updatedCharter
    });
  } catch (error) {
    console.error('Update charter status error:', error);
    res.status(500).json({ error: 'Gagal mengubah status charter' });
  }
};

// Submit payment proof for charter
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

    const charter = await prisma.charter.findUnique({
      where: { id }
    });

    if (!charter) {
      return res.status(404).json({ error: 'Charter tidak ditemukan' });
    }

    const updatedCharter = await prisma.charter.update({
      where: { id },
      data: {
        paymentProofUrl: paymentProofUrl || charter.paymentProofUrl,
        paymentSenderName: paymentSenderName || charter.paymentSenderName,
        paymentBankName: paymentBankName || charter.paymentBankName,
        paymentTargetBank: paymentTargetBank || charter.paymentTargetBank,
        paymentAmount: paymentAmount ? parseInt(paymentAmount, 10) : (charter.paymentAmount || charter.totalPrice),
        paymentNotes: paymentNotes || charter.paymentNotes,
        status: charter.status === 'PENDING' ? 'PAID' : charter.status,
        paidAt: charter.paidAt || new Date()
      },
      include: {
        vehicle: true,
        originCity: true,
        destinationCity: true
      }
    });

    res.json({
      message: 'Bukti pembayaran charter berhasil dikirim',
      data: updatedCharter
    });
  } catch (error) {
    console.error('Submit payment proof error:', error);
    res.status(500).json({ error: 'Gagal mengunggah bukti pembayaran' });
  }
};

// Delete charter (Admin/Operator)
exports.deleteCharter = async (req, res) => {
  try {
    const { id } = req.params;

    const charter = await prisma.charter.findUnique({
      where: { id }
    });

    if (!charter) {
      return res.status(404).json({ error: 'Charter tidak ditemukan' });
    }

    await prisma.charter.delete({
      where: { id }
    });

    res.json({
      message: 'Pemesanan charter berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete charter error:', error);
    res.status(500).json({ error: 'Gagal menghapus pemesanan charter' });
  }
};
