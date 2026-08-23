import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import api, { authService } from '../services/api';
import Pagination from '../components/Pagination';

function CheckIn() {
  const { t } = useTranslation();
  const currentUser = authService.getCurrentUser();
  const isDriver = currentUser?.role === 'DRIVER';
  const isStaff = currentUser?.role === 'ADMIN' || currentUser?.role === 'OPERATOR';

  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  const canCheckIn = isStaff || (isDriver && selectedSchedule?.driver?.userId === currentUser?.id);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [filterCheckedIn, setFilterCheckedIn] = useState('all');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const name = (booking.passengerName || booking.user?.name || '').toLowerCase();
      const phone = (booking.passengerPhone || booking.user?.phone || '').toLowerCase();
      const code = (booking.bookingCode || '').toLowerCase();
      const seats = (booking.seatNumbers || []).join(' ').toLowerCase();
      const nik = (booking.passengerNik || '').toLowerCase();
      return (
        name.includes(q) ||
        phone.includes(q) ||
        code.includes(q) ||
        seats.includes(q) ||
        nik.includes(q)
      );
    });
  }, [bookings, searchQuery]);

  useEffect(() => {
    fetchSchedules();
  }, [filterDate]);

  useEffect(() => {
    if (selectedSchedule) {
      fetchScheduleBookings(selectedSchedule.id);
    }
  }, [selectedSchedule, filterCheckedIn]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterDate) params.date = filterDate;
      
      const response = await api.get('/checkin/schedules', { params });
      setSchedules(response.data.data);
      
      // Auto-select first schedule if available
      if (response.data.data.length > 0 && !selectedSchedule) {
        setSelectedSchedule(response.data.data[0]);
      }
    } catch (err) {
      setError(t('checkIn.loadScheduleError'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduleBookings = async (scheduleId) => {
    try {
      setLoading(true);
      const params = {};
      if (filterCheckedIn !== 'all') {
        params.checkedIn = filterCheckedIn;
      }
      
      const response = await api.get(`/checkin/schedules/${scheduleId}/bookings`, { params });
      setBookings(response.data.data);
      setStats(response.data.stats);
      setError('');
    } catch (err) {
      setError(t('checkIn.loadBookingError'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (bookingId) => {
    try {
      const response = await api.post(`/checkin/bookings/${bookingId}/checkin`);
      setSuccess(t('checkIn.checkInSuccess'));
      setTimeout(() => setSuccess(''), 3000);
      
      // Refresh bookings
      if (selectedSchedule) {
        fetchScheduleBookings(selectedSchedule.id);
        fetchSchedules(); // Refresh schedule stats
      }
    } catch (err) {
      setError(err.response?.data?.message || t('checkIn.checkInError'));
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleUndoCheckIn = async (bookingId) => {
    if (!confirm(t('checkIn.undoConfirm'))) return;
    
    try {
      await api.post(`/checkin/bookings/${bookingId}/undo`);
      setSuccess(t('checkIn.undoSuccess'));
      setTimeout(() => setSuccess(''), 3000);
      
      // Refresh bookings
      if (selectedSchedule) {
        fetchScheduleBookings(selectedSchedule.id);
        fetchSchedules();
      }
    } catch (err) {
      setError(err.response?.data?.message || t('checkIn.undoError'));
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleBulkCheckIn = async () => {
    if (!confirm(t('checkIn.bulkCheckInConfirm'))) return;
    
    try {
      const response = await api.post(`/checkin/schedules/${selectedSchedule.id}/bulk-checkin`);
      setSuccess(response.data.message);
      setTimeout(() => setSuccess(''), 3000);
      
      // Refresh bookings
      fetchScheduleBookings(selectedSchedule.id);
      fetchSchedules();
    } catch (err) {
      setError(err.response?.data?.message || t('checkIn.bulkCheckInError'));
      setTimeout(() => setError(''), 5000);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('checkIn.title')}</h1>
        <p className="text-gray-600 mt-1">{t('checkIn.subtitle')}</p>
      </div>

      {/* Alert Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Date Filter */}
      <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <label className="text-xs sm:text-sm font-medium text-gray-700">
            {t('checkIn.filterDate')}
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <button
              onClick={() => setFilterDate('')}
              className="px-3 sm:px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition whitespace-nowrap"
            >
              {t('checkIn.reset')}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Schedule List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md p-3 sm:p-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">{t('checkIn.scheduleList')}</h2>
            
            {loading && !selectedSchedule ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 mt-2">{t('checkIn.loading')}</p>
              </div>
            ) : schedules.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {t('checkIn.noSchedule')}
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3 max-h-[400px] sm:max-h-[600px] overflow-y-auto">
                {schedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    onClick={() => setSelectedSchedule(schedule)}
                    className={`p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition ${
                      selectedSchedule?.id === schedule.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="text-sm sm:text-base font-semibold text-gray-800 mb-1">
                      {schedule.route.originCity.name} → {schedule.route.destinationCity.name}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 mb-2">
                      {formatDate(schedule.departureDate).split(',')[0]}, {schedule.departureTime}
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      {schedule.vehicle.plateNumber} • {schedule.driver.user.name}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="text-xs px-2 py-0.5 sm:py-1 rounded-full bg-green-100 text-green-800">
                        ✓ {schedule.bookingStats.checkedIn}
                      </span>
                      <span className="text-xs px-2 py-0.5 sm:py-1 rounded-full bg-yellow-100 text-yellow-800">
                        ⏳ {schedule.bookingStats.pending}
                      </span>
                      <span className="text-xs px-2 py-0.5 sm:py-1 rounded-full bg-gray-100 text-gray-800">
                        {t('common.total')}: {schedule.bookingStats.total}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Booking List & Details */}
        <div className="lg:col-span-2">
          {!selectedSchedule ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">{t('checkIn.selectSchedule')}</h2>
              <p className="text-gray-600">{t('checkIn.selectScheduleDesc')}</p>
            </div>
          ) : (
            <>
              {!canCheckIn && (
                <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm">
                  <span className="text-base sm:text-lg">⚠️</span>
                  <span>Jadwal ini ditugaskan kepada Driver: <strong>{selectedSchedule?.driver?.user?.name || 'Driver lain'}</strong>. Hak akses proses check-in hanya untuk Driver yang ditugaskan.</span>
                </div>
              )}

              {/* Stats Cards */}
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
                  <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-gray-600 mb-1">{t('checkIn.totalBookings')}</div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-800">{stats.total}</div>
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-gray-600 mb-1">{t('checkIn.checkedIn')}</div>
                    <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.checkedIn}</div>
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-gray-600 mb-1">{t('checkIn.notCheckedIn')}</div>
                    <div className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.pending}</div>
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-gray-600 mb-1">{t('checkIn.seatsCheckedIn')}</div>
                    <div className="text-xl sm:text-2xl font-bold text-blue-600">
                      {stats.checkedInSeats} / {stats.totalSeats}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Bar & Filters */}
              <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 mb-4 sm:mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex items-center gap-2">
                      <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
                        {t('checkIn.filterStatus')}
                      </label>
                      <select
                        value={filterCheckedIn}
                        onChange={(e) => setFilterCheckedIn(e.target.value)}
                        className="px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      >
                        <option value="all">{t('checkIn.all')}</option>
                        <option value="true">{t('checkIn.alreadyCheckedIn')}</option>
                        <option value="false">{t('checkIn.notYetCheckedIn')}</option>
                      </select>
                    </div>

                    <div className="flex-1 max-w-sm">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="🔎 Cari nama pemesan, No. WA, booking, kursi..."
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  {stats && stats.pending > 0 && canCheckIn && (
                    <button
                      onClick={handleBulkCheckIn}
                      className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition whitespace-nowrap shadow-sm"
                    >
                      {t('checkIn.checkInAll')} ({stats.pending})
                    </button>
                  )}
                </div>
              </div>

              {/* Bookings Table */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-gray-600 mt-2">{t('checkIn.loadingData')}</p>
                  </div>
                ) : (
                  <>
                  {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                              No. Booking
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                              Nama Pemesan & Contact
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                              Nomor Kursi
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                              Status Check-in
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                              Waktu Check-in
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                              Aksi
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {filteredBookings.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                {searchQuery ? `Tidak ada data booking cocok dengan "${searchQuery}"` : t('checkIn.noBooking')}
                              </td>
                            </tr>
                          ) : (
                            filteredBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((booking) => {
                              const passengerName = booking.passengerName || booking.user?.name || 'Customer';
                              const passengerPhone = booking.passengerPhone || booking.user?.phone || '-';

                              return (
                                <tr key={booking.id} className={`hover:bg-gray-50 transition ${booking.checkedIn ? 'bg-green-50/60' : ''}`}>
                                  <td className="px-6 py-4">
                                    <div className="text-sm font-bold text-gray-900">
                                      {booking.bookingCode}
                                    </div>
                                    <div className="text-xs font-semibold text-blue-600 mt-0.5">
                                      {booking.status}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center">
                                      <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center shadow-sm">
                                        <span className="text-white font-bold text-sm">
                                          {passengerName.charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                      <div className="ml-3">
                                        <div className="text-sm font-bold text-gray-800">{passengerName}</div>
                                        <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1 mt-0.5">
                                          <span>📱 WA:</span> {passengerPhone}
                                        </div>
                                        {booking.passengerNik && (
                                          <div className="text-[11px] text-gray-500 mt-0.5">NIK: {booking.passengerNik}</div>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                      {booking.seatNumbers.map((seat) => (
                                        <span key={seat} className="inline-block bg-blue-100 text-blue-800 font-extrabold px-2.5 py-1 rounded-md text-xs shadow-sm">
                                          Kursi {seat}
                                        </span>
                                      ))}
                                    </div>
                                    <div className="text-[11px] text-gray-500 mt-1 font-medium">
                                      Total {booking.totalSeats} {t('schedule.seats')}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    {booking.checkedIn ? (
                                      <span className="inline-flex items-center px-3 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800 border border-green-200">
                                        ✓ {t('checkIn.checkedIn')}
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-3 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                                        ⏳ {t('checkIn.notCheckedIn')}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                                    {booking.checkedIn ? formatTime(booking.checkInTime) : '-'}
                                  </td>
                                  <td className="px-6 py-4">
                                    {!canCheckIn ? (
                                      <span className="text-xs text-gray-400 font-semibold italic">Driver lain</span>
                                    ) : booking.checkedIn ? (
                                      <button
                                        onClick={() => handleUndoCheckIn(booking.id)}
                                        className="px-3 py-1.5 text-xs font-semibold bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                                      >
                                        {t('checkIn.undo')}
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleCheckIn(booking.id)}
                                        className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
                                      >
                                        {t('checkIn.checkIn')}
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Mobile Card View */}
                    <div className="md:hidden">
                      {filteredBookings.length === 0 ? (
                        <div className="px-6 py-8 text-center text-gray-500">
                          {searchQuery ? `Tidak ada data booking cocok dengan "${searchQuery}"` : t('checkIn.noBooking')}
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200">
                          {filteredBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((booking) => {
                            const passengerName = booking.passengerName || booking.user?.name || 'Customer';
                            const passengerPhone = booking.passengerPhone || booking.user?.phone || '-';

                            return (
                              <div key={booking.id} className={`p-4 ${booking.checkedIn ? 'bg-green-50/60' : ''}`}>
                                {/* Header: Booking Code & Status */}
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <p className="text-sm font-bold text-gray-900">{booking.bookingCode}</p>
                                    <p className="text-xs font-semibold text-blue-600 mt-0.5">{booking.status}</p>
                                  </div>
                                  {booking.checkedIn ? (
                                    <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800">
                                      ✓ {t('checkIn.checkedIn')}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-800">
                                      ⏳ {t('checkIn.notCheckedIn')}
                                    </span>
                                  )}
                                </div>

                                {/* Passenger Info */}
                                <div className="flex items-center mb-3 pb-3 border-b border-gray-100">
                                  <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center shadow-sm">
                                    <span className="text-white font-bold text-sm">
                                      {passengerName.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="ml-3">
                                    <div className="text-sm font-bold text-gray-800">{passengerName}</div>
                                    <div className="text-xs font-semibold text-emerald-700 mt-0.5">📱 WA: {passengerPhone}</div>
                                    {booking.passengerNik && (
                                      <div className="text-[11px] text-gray-500 mt-0.5">NIK: {booking.passengerNik}</div>
                                    )}
                                  </div>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                                  <div>
                                    <span className="text-gray-500 font-semibold">Nomor Kursi:</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {booking.seatNumbers.map((seat) => (
                                        <span key={seat} className="bg-blue-100 text-blue-800 font-extrabold px-2 py-0.5 rounded text-xs">
                                          Kursi {seat}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-gray-500 font-semibold">Waktu Check-in:</span>
                                    <p className="font-bold text-gray-800 mt-1">
                                      {booking.checkedIn ? formatTime(booking.checkInTime) : '-'}
                                    </p>
                                  </div>
                                </div>

                                {/* Action */}
                                <div className="pt-3 border-t border-gray-100">
                                  {!canCheckIn ? (
                                    <div className="text-xs text-gray-400 font-semibold italic text-center py-1">
                                      Hak akses check-in hanya untuk Driver bertugas
                                    </div>
                                  ) : booking.checkedIn ? (
                                    <button
                                      onClick={() => handleUndoCheckIn(booking.id)}
                                      className="w-full px-3 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition font-medium"
                                    >
                                      {t('checkIn.undo')}
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleCheckIn(booking.id)}
                                      className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-bold shadow-sm"
                                    >
                                      {t('checkIn.checkIn')}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {!loading && (
                      <Pagination
                        currentPage={currentPage}
                        totalItems={filteredBookings.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                      />
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default CheckIn;
