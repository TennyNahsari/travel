const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Generate booking code
const generateBookingCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BK-${timestamp}${random}`;
};

// Get all bookings
const getBookings = async (req, res) => {
  try {
    const { status, search, userId } = req.query;
    
    // Auto-cancel overdue PENDING bookings
    const now = new Date();
    await prisma.booking.updateMany({
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
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = eDate;
      }
    }
    
    // Filter by status
    if (status) {
      where.status = status;
    }
    
    // Filter by userId (for customer to see their own bookings)
    if (userId) {
      where.userId = userId;
    } else if (req.user.role === 'CUSTOMER') {
      // Customers can only see their own bookings
      where.userId = req.user.id;
    }
    
    // Search by booking code
    if (search) {
      where.bookingCode = {
        contains: search,
        mode: 'insensitive'
      };
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        schedule: {
          include: {
            route: {
              include: {
                originCity: true,
                destinationCity: true
              }
            },
            vehicle: true,
            driver: {
              include: {
                user: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data booking'
    });
  }
};

// Get booking by ID
const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        schedule: {
          include: {
            route: {
              include: {
                originCity: true,
                destinationCity: true
              }
            },
            vehicle: true,
            driver: {
              include: {
                user: {
                  select: {
                    name: true,
                    phone: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking tidak ditemukan'
      });
    }

    // Check authorization (customers can only view their own bookings)
    if (req.user.role === 'CUSTOMER' && booking.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Anda tidak memiliki akses ke booking ini'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data booking'
    });
  }
};

// Get available seats for a schedule
const getAvailableSeats = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        route: {
          include: {
            originCity: true,
            destinationCity: true
          }
        },
        vehicle: {
          include: {
            seatTemplate: true
          }
        },
        bookings: {
          where: {
            status: {
              in: ['PENDING', 'PAID', 'CONFIRMED']
            }
          },
          select: {
            seatNumbers: true,
            status: true
          }
        }
      }
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: 'Jadwal tidak ditemukan'
      });
    }

    // Get booked seats by status
    const pendingSeats = schedule.bookings
      .filter(b => b.status === 'PENDING')
      .flatMap(b => b.seatNumbers);

    const confirmedSeats = schedule.bookings
      .filter(b => b.status === 'PAID' || b.status === 'CONFIRMED')
      .flatMap(b => b.seatNumbers);

    const bookedSeats = schedule.bookings.flatMap(booking => booking.seatNumbers);
    
    // Generate all seat numbers based on vehicle capacity
    const allSeats = Array.from({ length: schedule.vehicle.capacity }, (_, i) => (i + 1).toString());
    
    // Filter available seats
    const availableSeats = allSeats.filter(seat => !bookedSeats.includes(seat));

    res.json({
      success: true,
      data: {
        schedule: schedule,
        totalSeats: schedule.vehicle.capacity,
        availableSeats: availableSeats,
        bookedSeats: bookedSeats,
        pendingSeats: pendingSeats,
        confirmedSeats: confirmedSeats,
        availableCount: availableSeats.length
      }
    });
  } catch (error) {
    console.error('Error fetching available seats:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data kursi'
    });
  }
};

// Create new booking
const createBooking = async (req, res) => {
  try {
    const { scheduleId, seatNumbers, userId, passengerName, passengerPhone, passengerEmail, passengerNik } = req.body;

    // Determine the customer (admin/operator can book for other users, fallback to logged-in user if empty)
    let customerId = userId;
    if (req.user.role === 'CUSTOMER' || !userId || typeof userId !== 'string' || userId.trim() === '') {
      customerId = req.user.id;
    }

    // Validate required fields
    if (!scheduleId || !seatNumbers || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Jadwal dan kursi wajib dipilih'
      });
    }

    // Check if schedule exists
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        vehicle: true,
        bookings: {
          where: {
            status: {
              in: ['PENDING', 'PAID', 'CONFIRMED']
            }
          },
          select: {
            seatNumbers: true
          }
        }
      }
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: 'Jadwal tidak ditemukan'
      });
    }

    // Check if seats are available
    const bookedSeats = schedule.bookings.flatMap(booking => booking.seatNumbers);
    const conflictingSeats = seatNumbers.filter(seat => bookedSeats.includes(seat));

    if (conflictingSeats.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Kursi ${conflictingSeats.join(', ')} sudah dipesan`
      });
    }

    // Check if requested seats exceed vehicle capacity
    const invalidSeats = seatNumbers.filter(seat => parseInt(seat) > schedule.vehicle.capacity);
    if (invalidSeats.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Nomor kursi ${invalidSeats.join(', ')} melebihi kapasitas armada`
      });
    }

    // Calculate total price
    const totalSeats = seatNumbers.length;
    const totalPrice = schedule.ticketPrice * totalSeats;

    // Generate booking code
    const bookingCode = generateBookingCode();

    // Create booking in transaction
    const booking = await prisma.$transaction(async (tx) => {
      // Create booking
      const newBooking = await tx.booking.create({
        data: {
          bookingCode,
          userId: customerId,
          scheduleId,
          seatNumbers,
          totalSeats,
          totalPrice,
          passengerName: passengerName || null,
          passengerPhone: passengerPhone || null,
          passengerEmail: passengerEmail || null,
          passengerNik: passengerNik || null,
          status: 'PENDING',
          paymentDeadline: new Date(Date.now() + 60 * 60 * 1000)
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          schedule: {
            include: {
              route: {
                include: {
                  originCity: true,
                  destinationCity: true
                }
              },
              vehicle: true
            }
          }
        }
      });

      // Update available seats in schedule
      await tx.schedule.update({
        where: { id: scheduleId },
        data: {
          availableSeats: {
            decrement: totalSeats
          }
        }
      });

      return newBooking;
    });

    res.status(201).json({
      success: true,
      data: booking,
      message: 'Booking berhasil dibuat'
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal membuat booking'
    });
  }
};

// Update booking status
const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentMethod } = req.body;

    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
      include: {
        schedule: true
      }
    });

    if (!existingBooking) {
      return res.status(404).json({
        success: false,
        error: 'Booking tidak ditemukan'
      });
    }

    // Check authorization (customers can only update their own bookings)
    if (req.user.role === 'CUSTOMER' && existingBooking.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Anda tidak memiliki akses untuk mengubah booking ini'
      });
    }

    const updateData = {};

    if (status) {
      const validStatuses = ['PENDING', 'PAID', 'CONFIRMED', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Status tidak valid'
        });
      }

      updateData.status = status;

      // Set paidAt when marking as PAID or CONFIRMED
      if ((status === 'PAID' || status === 'CONFIRMED') && !existingBooking.paidAt) {
        updateData.paidAt = new Date();
      }
    }

    if (paymentMethod) {
      updateData.paymentMethod = paymentMethod;
    } else if ((status === 'PAID' || status === 'CONFIRMED') && !existingBooking.paymentMethod) {
      updateData.paymentMethod = 'Cash';
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        schedule: {
          include: {
            route: {
              include: {
                originCity: true,
                destinationCity: true
              }
            },
            vehicle: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: booking,
      message: 'Booking berhasil diupdate'
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengupdate booking'
    });
  }
};

// Cancel booking
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if booking exists
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        schedule: true
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking tidak ditemukan'
      });
    }

    // Check authorization
    if (req.user.role === 'CUSTOMER' && booking.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Anda tidak memiliki akses untuk membatalkan booking ini'
      });
    }

    // Check if already cancelled
    if (booking.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        error: 'Booking sudah dibatalkan'
      });
    }

    // Cannot cancel if already paid/confirmed
    if (booking.status === 'PAID' || booking.status === 'CONFIRMED') {
      return res.status(400).json({
        success: false,
        error: 'Tidak dapat membatalkan booking yang sudah dibayar/dikonfirmasi'
      });
    }

    // Update booking and restore seats in transaction
    const updatedBooking = await prisma.$transaction(async (tx) => {
      // Update booking status
      const updated = await tx.booking.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          },
          schedule: {
            include: {
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

      // Restore available seats
      await tx.schedule.update({
        where: { id: booking.scheduleId },
        data: {
          availableSeats: {
            increment: booking.totalSeats
          }
        }
      });

      return updated;
    });

    res.json({
      success: true,
      data: updatedBooking,
      message: 'Booking berhasil dibatalkan'
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal membatalkan booking'
    });
  }
};

// Get available schedules for booking
const getAvailableSchedules = async (req, res) => {
  try {
    const { date, routeId } = req.query;
    
    const where = {
      availableSeats: {
        gt: 0
      }
    };
    
    if (date) {
      const searchDate = new Date(date);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      where.departureDate = {
        gte: searchDate,
        lt: nextDay
      };
    } else {
      // Show today's and future schedules
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      where.departureDate = {
        gte: startOfToday
      };
    }
    
    if (routeId) {
      where.routeId = routeId;
    }

    const schedules = await prisma.schedule.findMany({
      where,
      include: {
        route: {
          include: {
            originCity: true,
            destinationCity: true
          }
        },
        vehicle: {
          include: {
            seatTemplate: true
          }
        },
        driver: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: [
        { departureDate: 'asc' },
        { departureTime: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: schedules
    });
  } catch (error) {
    console.error('Error fetching available schedules:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil jadwal tersedia'
    });
  }
};

// Delete booking permanently
const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking tidak ditemukan'
      });
    }

    await prisma.$transaction(async (tx) => {
      // Delete booking record
      await tx.booking.delete({
        where: { id }
      });

      // Restore available seats if booking wasn't already cancelled
      if (booking.status !== 'CANCELLED') {
        await tx.schedule.update({
          where: { id: booking.scheduleId },
          data: {
            availableSeats: {
              increment: booking.totalSeats
            }
          }
        });
      }
    });

    res.json({
      success: true,
      message: 'Booking berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal menghapus data booking'
    });
  }
};

// Public endpoint for guest booking from landing page (no login required)
const createPublicBooking = async (req, res) => {
  try {
    const { scheduleId, seatNumbers, passengerName, passengerPhone, passengerEmail, passengerNik, paymentMethod } = req.body;

    if (!scheduleId || !seatNumbers || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Jadwal dan nomor kursi wajib dipilih'
      });
    }

    if (!passengerName || !passengerPhone) {
      return res.status(400).json({
        success: false,
        error: 'Nama dan Nomor Whatsapp pemesan wajib diisi'
      });
    }

    // Check if schedule exists
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        vehicle: true,
        bookings: {
          where: {
            status: {
              in: ['PENDING', 'PAID', 'CONFIRMED']
            }
          },
          select: {
            seatNumbers: true
          }
        }
      }
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: 'Jadwal tidak ditemukan'
      });
    }

    // Check seat availability
    const bookedSeats = schedule.bookings.flatMap(b => b.seatNumbers);
    const conflictingSeats = seatNumbers.filter(seat => bookedSeats.includes(seat));
    if (conflictingSeats.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Kursi ${conflictingSeats.join(', ')} sudah dipesan`
      });
    }

    // Find or get customer user
    let customerUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: passengerEmail || 'customer@travel.com' },
          { phone: passengerPhone }
        ]
      }
    });

    if (!customerUser) {
      customerUser = await prisma.user.findFirst({
        where: { role: 'CUSTOMER' }
      }) || await prisma.user.findFirst();
    }

    const totalSeats = seatNumbers.length;
    const totalPrice = schedule.ticketPrice * totalSeats;
    const bookingCode = 'TRV-' + Math.floor(100000 + Math.random() * 900000);

    const newBooking = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          bookingCode,
          userId: customerUser.id,
          scheduleId,
          seatNumbers,
          totalSeats,
          totalPrice,
          passengerName,
          passengerPhone,
          passengerEmail: passengerEmail || null,
          passengerNik: passengerNik || null,
          paymentMethod: paymentMethod || 'Transfer Bank / QRIS',
          status: 'PENDING',
          paidAt: null
        },
        include: {
          schedule: {
            include: {
              route: {
                include: {
                  originCity: true,
                  destinationCity: true
                }
              },
              vehicle: true
            }
          }
        }
      });

      await tx.schedule.update({
        where: { id: scheduleId },
        data: {
          availableSeats: {
            decrement: totalSeats
          }
        }
      });

      return booking;
    });

    res.json({
      success: true,
      message: 'Booking berhasil dibuat',
      data: newBooking
    });
  } catch (error) {
    console.error('Error creating public booking:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal membuat booking: ' + error.message
    });
  }
};

// Public lookup for guest booking by code
const getPublicBookingByCode = async (req, res) => {
  try {
    const { bookingCode } = req.params;

    if (!bookingCode) {
      return res.status(400).json({
        success: false,
        error: 'Kode Booking wajib diisi'
      });
    }

    const booking = await prisma.booking.findFirst({
      where: {
        bookingCode: {
          equals: bookingCode.trim(),
          mode: 'insensitive'
        }
      },
      include: {
        schedule: {
          include: {
            route: {
              include: {
                originCity: true,
                destinationCity: true
              }
            },
            vehicle: true
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: `Kode Booking "${bookingCode}" tidak ditemukan`
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error fetching public booking:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data booking'
    });
  }
};

// Public endpoint for submitting payment confirmation
const submitPaymentConfirmation = async (req, res) => {
  try {
    const { bookingCode, senderName, bankName, targetBank, transferAmount, paymentProofUrl, notes } = req.body;

    if (!bookingCode) {
      return res.status(400).json({
        success: false,
        error: 'Kode Booking wajib diisi'
      });
    }

    if (!senderName || !bankName) {
      return res.status(400).json({
        success: false,
        error: 'Nama pengirim dan nama bank pengirim wajib diisi'
      });
    }

    const booking = await prisma.booking.findFirst({
      where: {
        bookingCode: {
          equals: bookingCode.trim(),
          mode: 'insensitive'
        }
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: `Booking dengan kode "${bookingCode}" tidak ditemukan`
      });
    }

    // Update booking with payment proof data
    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        paymentSenderName: senderName,
        paymentBankName: bankName,
        paymentTargetBank: targetBank || 'PT Travel Shuttle Indonesia',
        paymentAmount: transferAmount ? parseInt(transferAmount) : booking.totalPrice,
        paymentProofUrl: paymentProofUrl || null,
        paymentNotes: notes || null,
        paymentMethod: `Transfer (${bankName})`
      },
      include: {
        schedule: {
          include: {
            route: {
              include: {
                originCity: true,
                destinationCity: true
              }
            },
            vehicle: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Konfirmasi pembayaran berhasil dikirim. Tim staf kami akan memverifikasi pembayaran Anda.',
      data: updatedBooking
    });
  } catch (error) {
    console.error('Error submitting payment confirmation:', error);
    res.status(500).json({
      success: false,
      error: 'Gagal mengonfirmasi pembayaran: ' + error.message
    });
  }
};

module.exports = {
  getBookings,
  getBookingById,
  getAvailableSeats,
  createBooking,
  updateBooking,
  cancelBooking,
  deleteBooking,
  getAvailableSchedules,
  createPublicBooking,
  getPublicBookingByCode,
  submitPaymentConfirmation
};
