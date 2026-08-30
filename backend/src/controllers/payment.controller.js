const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get unified payments (Tickets CONFIRMED, Charters COMPLETED, Packages COMPLETED)
const getPayments = async (req, res) => {
  try {
    const { startDate, endDate, paymentMethod, type, search } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      if (startDate) {
        dateFilter.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.lte = end;
      }
    }

    let ticketList = [];
    let charterList = [];
    let packageList = [];

    // 1. Fetch Shuttle Ticket Bookings (CONFIRMED / PAID)
    if (!type || type === 'ALL' || type === 'TICKET') {
      const ticketWhere = {
        status: { in: ['CONFIRMED', 'PAID'] }
      };
      if (startDate || endDate) {
        ticketWhere.paidAt = dateFilter;
      }
      if (paymentMethod) {
        ticketWhere.paymentMethod = paymentMethod;
      }
      if (search) {
        ticketWhere.OR = [
          { bookingCode: { contains: search, mode: 'insensitive' } },
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { passengerName: { contains: search, mode: 'insensitive' } },
          { passengerPhone: { contains: search, mode: 'insensitive' } }
        ];
      }

      ticketList = await prisma.booking.findMany({
        where: ticketWhere,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          schedule: {
            include: {
              route: { include: { originCity: true, destinationCity: true } },
              vehicle: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    // 2. Fetch Charter Car Bookings (COMPLETED)
    if (!type || type === 'ALL' || type === 'CHARTER') {
      const charterWhere = {
        status: 'COMPLETED'
      };
      if (startDate || endDate) {
        charterWhere.createdAt = dateFilter;
      }
      if (paymentMethod) {
        charterWhere.paymentMethod = paymentMethod;
      }
      if (search) {
        charterWhere.OR = [
          { charterCode: { contains: search, mode: 'insensitive' } },
          { customerName: { contains: search, mode: 'insensitive' } },
          { customerPhone: { contains: search, mode: 'insensitive' } }
        ];
      }

      charterList = await prisma.charter.findMany({
        where: charterWhere,
        include: {
          vehicle: true,
          originCity: true,
          destinationCity: true,
          user: { select: { id: true, name: true, email: true, phone: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    // 3. Fetch Package Bookings (COMPLETED)
    if (!type || type === 'ALL' || type === 'PACKAGE') {
      const packageWhere = {
        status: 'COMPLETED'
      };
      if (startDate || endDate) {
        packageWhere.createdAt = dateFilter;
      }
      if (paymentMethod) {
        packageWhere.paymentMethod = paymentMethod;
      }
      if (search) {
        packageWhere.OR = [
          { packageCode: { contains: search, mode: 'insensitive' } },
          { senderName: { contains: search, mode: 'insensitive' } },
          { senderPhone: { contains: search, mode: 'insensitive' } },
          { recipientName: { contains: search, mode: 'insensitive' } }
        ];
      }

      packageList = await prisma.packageBooking.findMany({
        where: packageWhere,
        include: {
          schedule: {
            include: {
              route: { include: { originCity: true, destinationCity: true } },
              vehicle: true
            }
          },
          user: { select: { id: true, name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    // Normalize into unified structure
    const formattedTickets = ticketList.map((b) => ({
      id: b.id,
      type: 'TICKET',
      typeLabel: 'Tiket Shuttle',
      code: b.bookingCode,
      customerName: b.user?.name || b.passengerName || 'Pelanggan Tiket',
      customerPhone: b.user?.phone || b.passengerPhone || '-',
      serviceName: `${b.schedule?.route?.originCity?.name || ''} → ${b.schedule?.route?.destinationCity?.name || ''}`,
      details: `${b.seats?.length || 1} Kursi (${b.seats?.join(', ') || 'Auto'})`,
      totalPrice: b.totalPrice,
      paymentMethod: b.paymentMethod || 'TRANSFER',
      status: b.status,
      paidAt: b.paidAt || b.createdAt,
      createdAt: b.createdAt,
      fullData: b
    }));

    const formattedCharters = charterList.map((c) => ({
      id: c.id,
      type: 'CHARTER',
      typeLabel: 'Charter Car',
      code: c.charterCode,
      customerName: c.customerName,
      customerPhone: c.customerPhone,
      serviceName: `Charter ${c.vehicle?.vehicleType || 'Armada'} (${c.originCity?.name || c.originAddress || ''} → ${c.destinationCity?.name || c.destinationAddress || ''})`,
      details: `${c.totalVehicles || 1} Unit (${c.durationDays || 1} Hari)`,
      totalPrice: c.totalPrice,
      paymentMethod: c.paymentMethod || 'TRANSFER',
      status: c.status,
      paidAt: c.paidAt || c.updatedAt || c.createdAt,
      createdAt: c.createdAt,
      fullData: c
    }));

    const formattedPackages = packageList.map((p) => ({
      id: p.id,
      type: 'PACKAGE',
      typeLabel: 'Pengiriman Paket',
      code: p.packageCode,
      customerName: p.senderName,
      customerPhone: p.senderPhone,
      serviceName: `Paket (${p.schedule?.route?.originCity?.name || ''} → ${p.schedule?.route?.destinationCity?.name || ''})`,
      details: `${p.itemCount || 1} Unit (${p.weightKg || 1} Kg) - ${p.packageDescription || ''}`,
      totalPrice: p.totalPrice,
      paymentMethod: p.paymentMethod || 'TRANSFER',
      status: p.status,
      paidAt: p.paidAt || p.updatedAt || p.createdAt,
      createdAt: p.createdAt,
      fullData: p
    }));

    // Combine & sort descending by date
    const combinedPayments = [...formattedTickets, ...formattedCharters, ...formattedPackages].sort(
      (a, b) => new Date(b.paidAt) - new Date(a.paidAt)
    );

    res.json({
      success: true,
      data: combinedPayments
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data pembayaran'
    });
  }
};

// Get aggregated payment statistics
const getPaymentStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.lte = end;
      }
    }

    const ticketWhere = { status: { in: ['CONFIRMED', 'PAID'] } };
    const charterWhere = { status: 'COMPLETED' };
    const packageWhere = { status: 'COMPLETED' };

    if (startDate || endDate) {
      ticketWhere.paidAt = dateFilter;
      charterWhere.createdAt = dateFilter;
      packageWhere.createdAt = dateFilter;
    }

    const [tickets, charters, packages] = await Promise.all([
      prisma.booking.findMany({ where: ticketWhere, select: { totalPrice: true, paidAt: true, createdAt: true } }),
      prisma.charter.findMany({ where: charterWhere, select: { totalPrice: true, createdAt: true } }),
      prisma.packageBooking.findMany({ where: packageWhere, select: { totalPrice: true, createdAt: true } })
    ]);

    const ticketRevenue = tickets.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const charterRevenue = charters.reduce((sum, c) => sum + (c.totalPrice || 0), 0);
    const packageRevenue = packages.reduce((sum, p) => sum + (p.totalPrice || 0), 0);

    const totalRevenue = ticketRevenue + charterRevenue + packageRevenue;
    const totalPayments = tickets.length + charters.length + packages.length;

    // Calculate today's revenue
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayTickets = tickets.filter(t => new Date(t.paidAt || t.createdAt) >= startOfToday);
    const todayCharters = charters.filter(c => new Date(c.createdAt) >= startOfToday);
    const todayPackages = packages.filter(p => new Date(p.createdAt) >= startOfToday);

    const todayRevenue = 
      todayTickets.reduce((sum, t) => sum + (t.totalPrice || 0), 0) +
      todayCharters.reduce((sum, c) => sum + (c.totalPrice || 0), 0) +
      todayPackages.reduce((sum, p) => sum + (p.totalPrice || 0), 0);

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalPayments,
        todayRevenue,
        breakdown: {
          ticketsCount: tickets.length,
          ticketRevenue,
          chartersCount: charters.length,
          charterRevenue,
          packagesCount: packages.length,
          packageRevenue
        }
      }
    });
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil statistik pembayaran'
    });
  }
};

// Delete payment transaction by type and ID
const deletePayment = async (req, res) => {
  try {
    const { type, id } = req.params;

    if (type === 'TICKET') {
      await prisma.booking.delete({ where: { id } });
    } else if (type === 'CHARTER') {
      await prisma.charter.delete({ where: { id } });
    } else if (type === 'PACKAGE') {
      await prisma.packageBooking.delete({ where: { id } });
    } else {
      // Fallback try deleting from booking or charter or package
      try {
        await prisma.booking.delete({ where: { id } });
      } catch (e1) {
        try {
          await prisma.charter.delete({ where: { id } });
        } catch (e2) {
          await prisma.packageBooking.delete({ where: { id } });
        }
      }
    }

    res.json({
      success: true,
      message: 'Transaksi pembayaran berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal menghapus transaksi pembayaran'
    });
  }
};

// Get single payment details
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check booking first
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        schedule: {
          include: {
            route: { include: { originCity: true, destinationCity: true } },
            vehicle: true
          }
        }
      }
    });

    if (booking) {
      return res.json({
        success: true,
        data: {
          id: booking.id,
          type: 'TICKET',
          code: booking.bookingCode,
          customerName: booking.user?.name || booking.passengerName,
          customerPhone: booking.user?.phone || booking.passengerPhone,
          serviceName: `${booking.schedule?.route?.originCity?.name} → ${booking.schedule?.route?.destinationCity?.name}`,
          details: `${booking.seats?.length || 1} Kursi (${booking.seats?.join(', ') || 'Auto'})`,
          totalPrice: booking.totalPrice,
          paymentMethod: booking.paymentMethod,
          status: booking.status,
          paidAt: booking.paidAt || booking.createdAt,
          fullData: booking
        }
      });
    }

    // Check charter
    const charter = await prisma.charter.findUnique({
      where: { id },
      include: {
        vehicle: true,
        originCity: true,
        destinationCity: true,
        user: { select: { id: true, name: true, email: true, phone: true } }
      }
    });

    if (charter) {
      return res.json({
        success: true,
        data: {
          id: charter.id,
          type: 'CHARTER',
          code: charter.charterCode,
          customerName: charter.customerName,
          customerPhone: charter.customerPhone,
          serviceName: `Charter ${charter.vehicle?.vehicleType} (${charter.originCity?.name || charter.originAddress} → ${charter.destinationCity?.name || charter.destinationAddress})`,
          details: `${charter.totalVehicles} Unit (${charter.durationDays} Hari)`,
          totalPrice: charter.totalPrice,
          paymentMethod: charter.paymentMethod,
          status: charter.status,
          paidAt: charter.paidAt || charter.createdAt,
          fullData: charter
        }
      });
    }

    // Check package
    const pkg = await prisma.packageBooking.findUnique({
      where: { id },
      include: {
        schedule: {
          include: {
            route: { include: { originCity: true, destinationCity: true } },
            vehicle: true
          }
        },
        user: { select: { id: true, name: true, email: true } }
      }
    });

    if (pkg) {
      return res.json({
        success: true,
        data: {
          id: pkg.id,
          type: 'PACKAGE',
          code: pkg.packageCode,
          customerName: pkg.senderName,
          customerPhone: pkg.senderPhone,
          serviceName: `Paket (${pkg.schedule?.route?.originCity?.name} → ${pkg.schedule?.route?.destinationCity?.name})`,
          details: `${pkg.itemCount} Unit (${pkg.weightKg} Kg) - ${pkg.packageDescription}`,
          totalPrice: pkg.totalPrice,
          paymentMethod: pkg.paymentMethod,
          status: pkg.status,
          paidAt: pkg.paidAt || pkg.createdAt,
          fullData: pkg
        }
      });
    }

    return res.status(404).json({ success: false, error: 'Transaksi tidak ditemukan' });
  } catch (error) {
    console.error('Get payment by id error:', error);
    res.status(500).json({ success: false, error: 'Gagal mengambil detail pembayaran' });
  }
};

const getDailyRevenue = async (req, res) => {
  res.json({ success: true, data: [] });
};

const getPaymentMethods = async (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'TRANSFER', name: 'Bank Transfer / QRIS' },
      { id: 'CASH', name: 'Cash / Tunai' }
    ]
  });
};

module.exports = {
  getPayments,
  getPaymentStats,
  getPaymentById,
  deletePayment,
  getDailyRevenue,
  getPaymentMethods
};
