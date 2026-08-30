import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Bus, Calendar, MapPin, Users, Ticket, CheckCircle2, QrCode, ArrowRight, ShieldCheck, CreditCard, Clock, ChevronDown, Search, Copy, Check } from 'lucide-react';
import api, { authService, qrisService, getImageUrl } from '../../services/api';

const getRowSeats = (rowIndex, rowsConfig) => {
  const seatsBeforeRow = rowsConfig.slice(0, rowIndex).reduce((sum, seats) => sum + seats, 0);
  const seatsInRow = rowsConfig[rowIndex];
  return Array.from({ length: seatsInRow }, (_, i) => (seatsBeforeRow + i + 1).toString());
};

const formatCurrency = (val) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);
};

const formatDate = (dateString, locale = 'id-ID') => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const TicketBookingModal = ({ isOpen, onClose, initialOrigin = 'Jakarta', initialDestination = 'Bandung', initialScheduleId = null }) => {
  const { t } = useTranslation();
  const currentUser = authService.getCurrentUser();
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [availableSeats, setAvailableSeats] = useState(null);

  const [showSeatModal, setShowSeatModal] = useState(false);
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);
  const [createdBookingInfo, setCreatedBookingInfo] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [qrisData, setQrisData] = useState(null);

  useEffect(() => {
    const fetchQris = async () => {
      try {
        const res = await qrisService.getQris();
        if (res.success && res.data) {
          setQrisData(res.data);
        }
      } catch (e) {
        console.error('Failed to fetch QRIS in modal:', e);
      }
    };
    fetchQris();
  }, []);

  const [isScheduleDropdownOpen, setIsScheduleDropdownOpen] = useState(false);
  const [scheduleSearchQuery, setScheduleSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [currentBooking, setCurrentBooking] = useState({
    scheduleId: '',
    seatNumbers: [],
    passengerName: currentUser?.name || '',
    passengerPhone: currentUser?.phone || '',
    passengerEmail: currentUser?.email || '',
    passengerNik: ''
  });

  useEffect(() => {
    if (isOpen) {
      setError('');
      setShowSeatModal(false);
      setShowPaymentInfo(false);
      setCreatedBookingInfo(null);
      fetchSchedulesAndMatch();
    }
  }, [isOpen, initialOrigin, initialDestination, initialScheduleId]);

  const fetchSchedulesAndMatch = async () => {
    try {
      setLoading(true);
      const res = await api.get('/bookings/schedules/available');
      const loadedSchedules = res.data.data || [];
      setSchedules(loadedSchedules);

      const targetOrigin = (initialOrigin || '').toLowerCase();
      const targetDest = (initialDestination || '').toLowerCase();

      let matchedSchedule = null;

      if (initialScheduleId) {
        matchedSchedule = loadedSchedules.find((s) => s.id === initialScheduleId);
      }

      if (!matchedSchedule && targetOrigin && targetDest) {
        matchedSchedule = loadedSchedules.find((s) => {
          const origName = (s.route?.originCity?.name || '').toLowerCase();
          const destName = (s.route?.destinationCity?.name || '').toLowerCase();
          return (
            (origName.includes(targetOrigin) || targetOrigin.includes(origName)) &&
            (destName.includes(targetDest) || targetDest.includes(destName))
          );
        });
      }

      const initSchedule = matchedSchedule || (loadedSchedules.length > 0 ? loadedSchedules[0] : null);

      setScheduleSearchQuery('');

      if (initSchedule) {
        setSelectedSchedule(initSchedule);
        setCurrentBooking({
          scheduleId: initSchedule.id,
          seatNumbers: [],
          passengerName: currentUser?.name || '',
          passengerPhone: currentUser?.phone || '',
          passengerEmail: currentUser?.email || '',
          passengerNik: ''
        });
        fetchAvailableSeats(initSchedule.id);
      } else {
        setSelectedSchedule(null);
        setCurrentBooking({
          scheduleId: '',
          seatNumbers: [],
          passengerName: currentUser?.name || '',
          passengerPhone: currentUser?.phone || '',
          passengerEmail: currentUser?.email || '',
          passengerNik: ''
        });
      }
    } catch (err) {
      console.error('Error loading available schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSeats = async (scheduleId) => {
    try {
      const res = await api.get(`/bookings/schedules/${scheduleId}/seats`);
      setAvailableSeats(res.data.data);
      if (res.data.data?.schedule) {
        setSelectedSchedule((prev) => ({
          ...prev,
          ...res.data.data.schedule,
          route: res.data.data.schedule.route || prev?.route
        }));
      }
    } catch (err) {
      console.error('Error fetching available seats:', err);
    }
  };

  const handleScheduleSelect = async (scheduleId) => {
    const schedule = schedules.find((s) => s.id === scheduleId);
    setSelectedSchedule(schedule);
    setCurrentBooking((prev) => ({ ...prev, scheduleId, seatNumbers: [] }));
    setScheduleSearchQuery('');
    setIsScheduleDropdownOpen(false);
    await fetchAvailableSeats(scheduleId);
  };

  const handleSeatToggle = (seatNumber) => {
    const seats = [...currentBooking.seatNumbers];
    const idx = seats.indexOf(seatNumber);
    if (idx > -1) {
      seats.splice(idx, 1);
    } else {
      seats.push(seatNumber);
    }
    seats.sort((a, b) => parseInt(a) - parseInt(b));
    setCurrentBooking((prev) => ({ ...prev, seatNumbers: seats }));
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    setError('');

    if (!currentBooking.scheduleId) {
      setError('Pilih jadwal terlebih dahulu');
      return;
    }

    if (currentBooking.seatNumbers.length === 0) {
      setError('Pilih minimal 1 kursi');
      return;
    }

    if (!currentBooking.passengerName || !currentBooking.passengerPhone) {
      setError('Nama penumpang dan Nomor Whatsapp wajib diisi');
      return;
    }

    try {
      setLoading(true);
      const endpoint = currentUser ? '/bookings' : '/bookings/public';
      const payload = {
        scheduleId: currentBooking.scheduleId,
        seatNumbers: currentBooking.seatNumbers,
        passengerName: currentBooking.passengerName,
        passengerPhone: currentBooking.passengerPhone,
        passengerEmail: currentBooking.passengerEmail || null,
        passengerNik: currentBooking.passengerNik || null,
        paymentMethod: 'Transfer Bank / QRIS'
      };

      const response = await api.post(endpoint, payload);

      if (response.data.success) {
        setCreatedBookingInfo({
          bookingCode: response.data.data.bookingCode,
          totalAmount: response.data.data.totalPrice,
          seatNumbers: response.data.data.seatNumbers,
          schedule: response.data.data.schedule || selectedSchedule,
          passengerName: currentBooking.passengerName,
          passengerPhone: currentBooking.passengerPhone
        });
        setShowPaymentInfo(true);
      }
    } catch (err) {
      console.error('Submit booking error:', err);
      setError(err.response?.data?.error || 'Gagal membuat booking. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Main Booking Modal */}
      {!showPaymentInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-y-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-blue-600" />
                <span>{t('booking.addBooking', 'Tambah Booking Tiket')}</span>
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition p-1 rounded-lg hover:bg-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitBooking} className="p-6 space-y-4 text-left">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-xs sm:text-sm font-semibold">
                  {error}
                </div>
              )}

              {/* Schedule Selection Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('booking.selectSchedule', 'Pilih Jadwal Perjalanan')} *
                </label>
                <div className="relative">
                  <div
                    onClick={() => setIsScheduleDropdownOpen(!isScheduleDropdownOpen)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white cursor-pointer flex items-center justify-between hover:border-blue-500 focus:outline-none transition shadow-sm"
                  >
                    <span className={selectedSchedule ? 'text-gray-900 font-bold' : 'text-gray-400'}>
                      {selectedSchedule
                        ? `${selectedSchedule.route?.originCity?.name || 'N/A'} → ${selectedSchedule.route?.destinationCity?.name || 'N/A'} | ${formatDate(selectedSchedule.departureDate, t('common.locale'))} ${selectedSchedule.departureTime}`
                        : t('booking.selectOrSearchSchedule', 'Pilih / Cari Jadwal Perjalanan')}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isScheduleDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>

                  {/* Dropdown Options */}
                  {isScheduleDropdownOpen && (
                    <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-gray-300 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                      <div className="p-2 border-b border-gray-100 sticky top-0 bg-white z-10">
                        <div className="relative">
                          <input
                            type="text"
                            value={scheduleSearchQuery}
                            onChange={(e) => setScheduleSearchQuery(e.target.value)}
                            placeholder={t('booking.searchSchedulePlaceholder', '🔎 Cari rute, jam, tanggal, armada...')}
                            className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                            autoFocus
                          />
                          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                        </div>
                      </div>

                      {(() => {
                        const filtered = schedules.filter((schedule) => {
                          if (!scheduleSearchQuery.trim()) return true;
                          const q = scheduleSearchQuery.toLowerCase();
                          const origin = (schedule.route?.originCity?.name || '').toLowerCase();
                          const destination = (schedule.route?.destinationCity?.name || '').toLowerCase();
                          const vehicle = (schedule.vehicle?.vehicleType || '').toLowerCase();
                          const plate = (schedule.vehicle?.plateNumber || '').toLowerCase();
                          const time = (schedule.departureTime || '').toLowerCase();
                          const dateStr = formatDate(schedule.departureDate, t('common.locale')).toLowerCase();
                          return (
                            origin.includes(q) ||
                            destination.includes(q) ||
                            vehicle.includes(q) ||
                            plate.includes(q) ||
                            time.includes(q) ||
                            dateStr.includes(q)
                          );
                        });

                        if (filtered.length === 0) {
                          return (
                            <div className="p-4 text-center text-xs text-gray-500">
                              {t('booking.noScheduleMatch', 'Tidak ada jadwal perjalanan yang sesuai.')}
                            </div>
                          );
                        }

                        return (
                          <>
                            <div className="px-3 py-1 bg-slate-100 text-[10px] font-bold text-slate-500 flex justify-between border-b border-slate-200">
                              <span>{t('booking.showingSchedulesCount', { count: filtered.length, total: schedules.length, defaultValue: `Menampilkan ${filtered.length} Jadwal` })}</span>
                              <span>{t('booking.clickToSelect', 'Klik untuk memilih')}</span>
                            </div>
                            {filtered.map((schedule) => {
                              const isSelected = currentBooking.scheduleId === schedule.id;
                              return (
                                <div
                                  key={schedule.id}
                                  onClick={() => {
                                    handleScheduleSelect(schedule.id);
                                    setScheduleSearchQuery(
                                      `${schedule.route?.originCity?.name || ''} → ${schedule.route?.destinationCity?.name || ''} | ${schedule.departureTime}`
                                    );
                                    setIsScheduleDropdownOpen(false);
                                  }}
                                  className={`p-3 cursor-pointer hover:bg-blue-50 transition-colors flex items-center justify-between text-xs border-b border-gray-100 ${
                                    isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                                  }`}
                                >
                                  <div>
                                    <div className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                                      <span>{schedule.route?.originCity?.name || 'N/A'}</span>
                                      <span className="text-blue-600 font-extrabold">→</span>
                                      <span>{schedule.route?.destinationCity?.name || 'N/A'}</span>
                                    </div>
                                    <div className="text-gray-500 mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                                      <span className="bg-gray-100 px-1.5 py-0.5 rounded">📅 {formatDate(schedule.departureDate, t('common.locale'))}</span>
                                      <span className="bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">⏰ {schedule.departureTime}</span>
                                      <span>🚌 {schedule.vehicle?.vehicleType || 'Armada'} ({schedule.vehicle?.plateNumber})</span>
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0 ml-3">
                                    <div className="font-extrabold text-blue-600 text-sm">
                                      {formatCurrency(schedule.ticketPrice)}
                                    </div>
                                    <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-block mt-0.5">
                                      {t('schedule.seatsLeftCount', { available: schedule.availableSeats, total: schedule.vehicle?.capacity || 0, defaultValue: `Sisa ${schedule.availableSeats}/${schedule.vehicle?.capacity || 0} Kursi` })}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Schedule Summary Box */}
              {selectedSchedule && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-2 text-xs uppercase tracking-wider">{t('booking.selectedScheduleSummary', 'Ringkasan Jadwal Terpilih')}</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                    <div className="text-gray-600">{t('dashboard.route')}:</div>
                    <div className="font-medium text-gray-900">
                      {selectedSchedule.route?.originCity?.name || 'N/A'} → {selectedSchedule.route?.destinationCity?.name || 'N/A'}
                    </div>
                    {selectedSchedule.poolOrigin && (
                      <>
                        <div className="text-gray-600">{t('schedule.poolOrigin')}:</div>
                        <div className="font-medium text-gray-900">{selectedSchedule.poolOrigin}</div>
                      </>
                    )}
                    {selectedSchedule.poolDestination && (
                      <>
                        <div className="text-gray-600">{t('schedule.poolDestination')}:</div>
                        <div className="font-medium text-gray-900">{selectedSchedule.poolDestination}</div>
                      </>
                    )}
                    <div className="text-gray-600">{t('schedule.departureTime')}:</div>
                    <div className="font-medium text-gray-900">
                      {formatDate(selectedSchedule.departureDate, t('common.locale'))} - {selectedSchedule.departureTime} WIB
                    </div>
                    <div className="text-gray-600">{t('schedule.vehicle')}:</div>
                    <div className="font-medium text-gray-900">
                      {selectedSchedule.vehicle?.vehicleType || 'Shuttle'} ({selectedSchedule.vehicle?.plateNumber || ''})
                    </div>
                    <div className="text-gray-600">{t('booking.pricePerSeat', 'Harga per Kursi')}:</div>
                    <div className="font-bold text-blue-700">{formatCurrency(selectedSchedule.ticketPrice)}</div>
                  </div>
                </div>
              )}

              {/* Seat Selector Button */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('booking.selectSeatNumber', { count: currentBooking.seatNumbers.length, defaultValue: `Pilih Nomor Kursi * (${currentBooking.seatNumbers.length} Kursi Terpilih)` })}
                </label>
                <button
                  type="button"
                  onClick={() => setShowSeatModal(true)}
                  disabled={!currentBooking.scheduleId}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition text-sm font-bold text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Bus className="w-4 h-4 text-blue-600" />
                  <span>
                    {currentBooking.seatNumbers.length > 0
                      ? t('booking.seatsSelected', { seats: currentBooking.seatNumbers.join(', '), defaultValue: `Kursi Terpilih: ${currentBooking.seatNumbers.join(', ')}` })
                      : t('booking.openSeatMap', 'Buka Peta Pilih Nomor Kursi')}
                  </span>
                </button>
              </div>

              {/* Total Price Card */}
              {currentBooking.seatNumbers.length > 0 && selectedSchedule && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-xs text-gray-600 font-medium">{t('booking.totalBookingSeats', { count: currentBooking.seatNumbers.length, defaultValue: `Total Pemesanan (${currentBooking.seatNumbers.length} Kursi):` })}</div>
                      <div className="text-2xl font-extrabold text-green-700 mt-0.5">
                        {formatCurrency(selectedSchedule.ticketPrice * currentBooking.seatNumbers.length)}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-green-800 bg-green-200/80 px-3 py-1 rounded-full">
                      {t('booking.seatsReadyToBook', '✓ Kursi Siap Di-booking')}
                    </span>
                  </div>
                </div>
              )}

              {/* Input Data Penumpang / Customer */}
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <h4 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                  {t('booking.passengerDataHeader', '👤 Data Penumpang / Customer')}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {t('booking.passengerName', 'Nama Penumpang')} *
                    </label>
                    <input
                      type="text"
                      required
                      value={currentBooking.passengerName}
                      onChange={(e) => setCurrentBooking({ ...currentBooking, passengerName: e.target.value })}
                      placeholder={t('booking.passengerNamePlaceholder', 'Contoh: Budi Santoso')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {t('booking.passengerPhone', 'No. WhatsApp / HP')} *
                    </label>
                    <input
                      type="tel"
                      required
                      value={currentBooking.passengerPhone}
                      onChange={(e) => setCurrentBooking({ ...currentBooking, passengerPhone: e.target.value })}
                      placeholder="0812xxxxxxxx"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {t('booking.passengerEmail', 'Email Customer')}
                    </label>
                    <input
                      type="email"
                      value={currentBooking.passengerEmail}
                      onChange={(e) => setCurrentBooking({ ...currentBooking, passengerEmail: e.target.value })}
                      placeholder="budi@example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {t('booking.passengerNik', 'No. KTP / NIK (Opsional)')}
                    </label>
                    <input
                      type="text"
                      value={currentBooking.passengerNik}
                      onChange={(e) => setCurrentBooking({ ...currentBooking, passengerNik: e.target.value })}
                      placeholder="3273xxxxxxxxxxxx"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 mt-6 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition cursor-pointer text-sm"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={currentBooking.seatNumbers.length === 0 || loading}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-md"
                >
                  {loading ? t('common.processing', 'Memproses...') : t('booking.confirmBooking', 'Konfirmasi Booking Tiket')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Seat Selection Sub-Modal */}
      {showSeatModal && availableSeats && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-2 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[95vh] overflow-y-auto text-left">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <div>
                <h3 className="text-base font-bold text-gray-800">{t('booking.seatSelectionTitle', 'Pilih Nomor Kursi Armada')}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t('booking.seatsAvailabilitySubtitle', { available: availableSeats.availableCount, total: availableSeats.totalSeats, defaultValue: `Tersedia ${availableSeats.availableCount} dari total ${availableSeats.totalSeats} Kursi` })}
                </p>
              </div>
              <button
                onClick={() => setShowSeatModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Seat Layout */}
              <div className="space-y-3">
                {selectedSchedule?.vehicle?.seatTemplate?.rowsConfig ? (
                  (() => {
                    const rowsConfig = typeof selectedSchedule.vehicle.seatTemplate.rowsConfig === 'string'
                      ? JSON.parse(selectedSchedule.vehicle.seatTemplate.rowsConfig)
                      : selectedSchedule.vehicle.seatTemplate.rowsConfig;

                    return rowsConfig.map((seatsInRow, rowIndex) => {
                      const rowSeats = getRowSeats(rowIndex, rowsConfig);

                      return (
                        <div key={rowIndex} className="flex justify-center gap-3">
                          {rowSeats.map((seatNumber) => {
                            const isConfirmed = (availableSeats.confirmedSeats || []).includes(seatNumber);
                            const isPending = (availableSeats.pendingSeats || []).includes(seatNumber);
                            const isBooked = isConfirmed || isPending || (availableSeats.bookedSeats || []).includes(seatNumber);
                            const isSelected = currentBooking.seatNumbers.includes(seatNumber);

                            let buttonStyle = 'bg-white border-2 border-gray-300 text-gray-700 hover:border-blue-500';
                            if (isSelected) {
                              buttonStyle = 'bg-blue-600 text-white font-bold ring-2 ring-blue-300 shadow';
                            } else if (isConfirmed) {
                              buttonStyle = 'bg-blue-900 text-white font-bold cursor-not-allowed shadow-inner';
                            } else if (isPending) {
                              buttonStyle = 'bg-gray-300 text-gray-500 font-bold cursor-not-allowed';
                            }

                            return (
                              <button
                                key={seatNumber}
                                type="button"
                                onClick={() => !isBooked && handleSeatToggle(seatNumber)}
                                disabled={isBooked}
                                title={isConfirmed ? `Kursi ${seatNumber} (${t('booking.confirmedPaidLabel', 'Terkonfirmasi')})` : isPending ? `Kursi ${seatNumber} (Pending)` : `Kursi ${seatNumber}`}
                                className={`p-3 w-12 h-12 rounded-lg font-bold text-sm transition flex items-center justify-center ${buttonStyle}`}
                              >
                                {seatNumber}
                              </button>
                            );
                          })}
                        </div>
                      );
                    });
                  })()
                ) : (
                  <div className="grid grid-cols-5 gap-3">
                    {Array.from({ length: availableSeats.totalSeats }, (_, i) => {
                      const seatNumber = (i + 1).toString();
                      const isConfirmed = (availableSeats.confirmedSeats || []).includes(seatNumber);
                      const isPending = (availableSeats.pendingSeats || []).includes(seatNumber);
                      const isBooked = isConfirmed || isPending || (availableSeats.bookedSeats || []).includes(seatNumber);
                      const isSelected = currentBooking.seatNumbers.includes(seatNumber);

                      let buttonStyle = 'bg-white border-2 border-gray-300 text-gray-700 hover:border-blue-500';
                      if (isSelected) {
                        buttonStyle = 'bg-blue-600 text-white font-bold ring-2 ring-blue-300 shadow';
                      } else if (isConfirmed) {
                        buttonStyle = 'bg-blue-900 text-white font-bold cursor-not-allowed shadow-inner';
                      } else if (isPending) {
                        buttonStyle = 'bg-gray-300 text-gray-500 font-bold cursor-not-allowed';
                      }

                      return (
                        <button
                          key={seatNumber}
                          type="button"
                          onClick={() => !isBooked && handleSeatToggle(seatNumber)}
                          disabled={isBooked}
                          title={isConfirmed ? `Kursi ${seatNumber} (${t('booking.confirmedPaidLabel', 'Terkonfirmasi')})` : isPending ? `Kursi ${seatNumber} (Pending)` : `Kursi ${seatNumber}`}
                          className={`p-3 h-12 rounded-lg font-bold text-sm transition flex items-center justify-center ${buttonStyle}`}
                        >
                          {seatNumber}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Legend */}
              <div className="mt-6 flex flex-wrap items-center justify-between text-[11px] gap-2 pt-3 border-t border-gray-100 font-semibold">
                <div className="flex flex-wrap items-center space-x-3">
                  <div className="flex items-center">
                    <div className="w-3.5 h-3.5 bg-blue-600 rounded mr-1.5 ring-1 ring-blue-400"></div>
                    <span>{t('booking.selectedLabel', 'Terpilih')}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3.5 h-3.5 bg-blue-900 rounded mr-1.5"></div>
                    <span>{t('booking.confirmedPaidLabel', 'Terkonfirmasi')}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3.5 h-3.5 bg-gray-300 rounded mr-1.5"></div>
                    <span>{t('booking.pendingLabel', 'Pending')}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3.5 h-3.5 bg-white border-2 border-gray-300 rounded mr-1.5"></div>
                    <span>{t('booking.availableLabel', 'Tersedia')}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center bg-gray-50 rounded-b-2xl">
              <div className="text-xs font-bold text-gray-700">
                {t('booking.seatsSelectedCount', { count: currentBooking.seatNumbers.length, defaultValue: `${currentBooking.seatNumbers.length} Kursi Terpilih` })}
              </div>
              <button
                type="button"
                onClick={() => setShowSeatModal(false)}
                className="px-5 py-2 bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-700 transition"
              >
                {t('booking.saveSeatSelection', 'Simpan Pilihan Kursi')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Information Modal */}
      {showPaymentInfo && createdBookingInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2 sm:p-4 text-left">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[95vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 bg-green-50 rounded-t-2xl flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-green-600 shrink-0" />
              <div>
                <h2 className="text-lg font-extrabold text-gray-800">{t('booking.bookingSuccessTitle', 'Pemesanan Tiket Berhasil')}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-600">{t('dashboard.bookingCode')}:</span>
                  <span className="font-mono font-extrabold text-green-900 text-sm bg-white px-2.5 py-0.5 rounded-md border border-green-300">
                    {createdBookingInfo.bookingCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(createdBookingInfo.bookingCode);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="px-2 py-0.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold transition flex items-center gap-1 shrink-0"
                    title="Salin Kode Booking"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
                    <span>{copiedCode ? 'Tersalin!' : 'Salin Kode'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Payment Deadline Alert */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-900 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>⏰ Paling Telat Bayar:</span>
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-amber-700 bg-white px-2.5 py-0.5 rounded-lg border border-amber-300">
                  {createdBookingInfo.paymentDeadline 
                    ? `${new Date(createdBookingInfo.paymentDeadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}, ${new Date(createdBookingInfo.paymentDeadline).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`
                    : `${new Date(Date.now() + 60*60*1000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`}
                </span>
              </div>
              {/* Order Details */}
              <div className="bg-blue-50/70 rounded-xl p-4 border border-blue-100 text-xs sm:text-sm space-y-2">
                <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider mb-2">{t('booking.bookingDetail', 'Detail Pemesanan')}</h4>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('dashboard.route')}:</span>
                  <span className="font-bold text-gray-900">
                    {createdBookingInfo.schedule?.route?.originCity?.name} → {createdBookingInfo.schedule?.route?.destinationCity?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('schedule.departureTime')}:</span>
                  <span className="font-bold text-gray-900">
                    {formatDate(createdBookingInfo.schedule?.departureDate, t('common.locale'))} {createdBookingInfo.schedule?.departureTime} WIB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('booking.seatNumbers', 'Nomor Kursi')}:</span>
                  <span className="font-bold text-blue-700">
                    {createdBookingInfo.seatNumbers.join(', ')}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-blue-200">
                  <span className="font-bold text-gray-800">{t('booking.totalPayment', 'Total Pembayaran')}:</span>
                  <span className="font-extrabold text-green-700 text-base">
                    {formatCurrency(createdBookingInfo.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Payment Instructions */}
              <div className="border border-gray-200 rounded-xl p-4 space-y-3 text-xs">
                <h4 className="font-bold text-gray-800 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span>{t('booking.paymentInstructions', 'Instruksi Pembayaran Transfer / QRIS')}</span>
                </h4>
                <p className="text-gray-600">
                  {t('booking.paymentInstructionsDetail', { amount: formatCurrency(createdBookingInfo.totalAmount), defaultValue: `Silakan lakukan pembayaran sebesar ${formatCurrency(createdBookingInfo.totalAmount)} ke salah satu rekening berikut:` })}
                </p>

                <div className="bg-gray-50 p-3 rounded-lg space-y-2 font-mono text-xs text-gray-800 border border-gray-200">
                  <div>
                    <span className="text-gray-500 font-sans">BCA:</span> <strong>{qrisData?.bankBca || '123-456-7890 (a.n. PT Travel Shuttle Indonesia)'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 font-sans">Mandiri:</span> <strong>{qrisData?.bankMandiri || '987-000-112233 (a.n. PT Travel Shuttle Indonesia)'}</strong>
                  </div>
                  {qrisData?.bankOther && (
                    <div>
                      <span className="text-gray-500 font-sans">Lainnya:</span> <strong>{qrisData.bankOther}</strong>
                    </div>
                  )}
                </div>

                {/* QRIS Display */}
                <div className="bg-gradient-to-br from-blue-50 to-slate-50 border border-blue-200 rounded-xl p-3.5 space-y-2.5 text-center">
                  <div className="flex items-center justify-center gap-1.5 font-bold text-slate-800 text-xs">
                    <QrCode className="w-4 h-4 text-blue-600" />
                    <span>Pembayaran via QRIS All Payment</span>
                  </div>
                  
                  {qrisData && qrisData.imageUrl ? (
                    <div className="flex flex-col items-center space-y-2">
                      <div className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-sm inline-block">
                        <img 
                          src={getImageUrl(qrisData.imageUrl)} 
                          alt="QRIS Code" 
                          className="w-44 h-44 object-contain mx-auto rounded"
                        />
                      </div>
                      <span className="text-[11px] font-bold text-gray-800 font-mono">
                        {qrisData.accountName || 'PT Travel Shuttle Indonesia'}
                      </span>
                      <p className="text-[11px] text-gray-600 max-w-xs leading-relaxed font-sans">
                        {qrisData.instruction || 'Scan QR Code QRIS di atas menggunakan GoPay, OVO, Dana, ShopeePay, BCA Mobile, atau aplikasi e-wallet / mobile banking lainnya.'}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-500 font-sans">
                      {t('booking.qrisInstruction', 'Pindai QR Code di loket atau tunjukkan saat konfirmasi boarding.')}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentInfo(false);
                    onClose();
                  }}
                  className="px-6 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition shadow-md"
                >
                  {t('common.done', 'Selesai')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TicketBookingModal;
