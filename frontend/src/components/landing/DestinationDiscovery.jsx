import React, { useState, useEffect, useMemo } from 'react';
import { Bus, MapPin, Clock, ArrowRight, Filter, Ticket, ChevronLeft, ChevronRight, Calendar, RefreshCw, Search, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

const fallbackImages = [
  'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
];

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number || 0);
};

const DestinationDiscovery = ({ searchQuery = '', onOpenBookingModal, onOpenPackageModal }) => {
  const { t } = useTranslation();
  const [schedules, setSchedules] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3; // 3 or 4 cards per page with horizontal pagination

  useEffect(() => {
    fetchActiveSchedules();
  }, [selectedDate]);

  const fetchActiveSchedules = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedDate) {
        params.date = selectedDate;
      }

      const response = await api.get('/bookings/schedules/available', { params });
      if (response.data.success) {
        setSchedules(response.data.data || []);
      }
    } catch (err) {
      console.error('Gagal mengambil jadwal perjalanan aktif:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter schedules by cityFilter and searchQuery if provided
  const filteredSchedules = useMemo(() => {
    return schedules.filter((sch) => {
      const origin = (sch.route?.originCity?.name || '').toLowerCase();
      const destination = (sch.route?.destinationCity?.name || '').toLowerCase();
      const vehicle = (sch.vehicle?.vehicleType || '').toLowerCase();
      const plate = (sch.vehicle?.plateNumber || '').toLowerCase();

      // Check cityFilter if provided (matches origin OR destination city)
      if (cityFilter.trim()) {
        const c = cityFilter.toLowerCase().trim();
        const matchesCity = origin.includes(c) || destination.includes(c);
        if (!matchesCity) return false;
      }

      // Check global searchQuery if provided
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          origin.includes(q) ||
          destination.includes(q) ||
          vehicle.includes(q) ||
          plate.includes(q);
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [schedules, cityFilter, searchQuery]);

  // Reset pagination on date, city filter, or search query change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDate, cityFilter, searchQuery]);

  const totalPages = Math.ceil(filteredSchedules.length / itemsPerPage);

  const paginatedSchedules = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSchedules.slice(start, start + itemsPerPage);
  }, [filteredSchedules, currentPage, itemsPerPage]);

  return (
    <section id="routes" className="py-20 bg-soft-sky relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 text-left">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tropical-teal/10 text-tropical-teal text-xs font-extrabold uppercase tracking-wider mb-2">
              <Bus className="w-3.5 h-3.5" />
              <span>{t('landing.routes.badge', 'Pilih Jadwal Perjalanan Terfavorit')}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-deep-navy tracking-tight">
              {t('landing.routes.title', 'Rute Travel Antar Kota Populer')}
            </h2>
            <p className="text-slate-gray mt-2 text-sm sm:text-base max-w-xl">
              {t('landing.routes.subtitle', 'Jadwal keberangkatan travel aktif terdekat dengan armada eksekutif, jalur tol terarah, dan konfirmasi kursi instan.')}
            </p>
          </div>

          {/* Filter Bar (City & Date Filter) */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3 shrink-0">
            {/* City Filter Input */}
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                placeholder={t('landing.routes.searchCity', '🔎 Filter Kota (Cirebon, Jakarta...)')}
                className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-deep-navy focus:ring-2 focus:ring-travel-blue outline-none bg-soft-sky/50 min-w-[190px]"
              />
            </div>

            {/* Date Filter Input */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-deep-navy">
              <Calendar className="w-4 h-4 text-travel-blue" />
              <span>Tanggal:</span>
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-deep-navy focus:ring-2 focus:ring-travel-blue outline-none bg-soft-sky/50"
            />

            {(cityFilter || selectedDate) && (
              <button
                onClick={() => {
                  setCityFilter('');
                  setSelectedDate('');
                }}
                className="flex items-center gap-1 text-xs font-bold text-sunset-orange hover:underline bg-sunset-orange/10 px-2.5 py-1.5 rounded-xl transition"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset Filter</span>
              </button>
            )}
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-soft">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-travel-blue border-t-transparent mb-3"></div>
            <p className="text-sm font-semibold text-slate-gray">Memuat jadwal perjalanan aktif...</p>
          </div>
        ) : filteredSchedules.length > 0 ? (
          <>
            {/* Active Schedules Grid (3 Cards per row) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedSchedules.map((sch, idx) => {
                const imgIndex = (idx + (currentPage - 1) * itemsPerPage) % fallbackImages.length;
                const originName = sch.route?.originCity?.name || 'Kota Asal';
                const destName = sch.route?.destinationCity?.name || 'Kota Tujuan';

                return (
                  <div
                    key={sch.id}
                    onClick={() => onOpenBookingModal && onOpenBookingModal(originName, destName, sch.id)}
                    className="group bg-white rounded-3xl overflow-hidden shadow-soft hover:shadow-card border border-slate-100 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col justify-between"
                  >
                    {/* Top Image Banner */}
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={sch.imageUrl || fallbackImages[imgIndex]}
                        alt={`${originName} to ${destName}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-deep-navy/85 via-deep-navy/30 to-transparent" />

                      {/* Seat Badge */}
                      <div className="absolute top-3 left-3 z-10">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold shadow-sm uppercase tracking-wider">
                          {t('schedule.seatsRemaining', 'Sisa {{available}}/{{capacity}} Kursi', { available: sch.availableSeats, capacity: sch.vehicle?.capacity || 14 })}
                        </span>
                      </div>

                      {/* Price Tag */}
                      <div className="absolute bottom-3 right-3 bg-travel-blue text-white px-3 py-1 rounded-xl text-xs font-extrabold shadow-md">
                        {formatRupiah(sch.ticketPrice)} / {t('schedule.seatUnit', 'kursi')}
                      </div>

                      {/* Route Title on Image */}
                      <div className="absolute bottom-3 left-3 text-white text-left">
                        <h3 className="text-xl font-extrabold tracking-tight">
                          {originName} ↔ {destName}
                        </h3>
                        <p className="text-[11px] font-bold text-tropical-teal flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          ⏰ {sch.departureTime} WIB
                        </p>
                      </div>
                    </div>

                    {/* Card Body Details */}
                    <div className="p-5 text-left space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-gray font-semibold">
                          <span className="flex items-center gap-1.5">
                            <Bus className="w-4 h-4 text-travel-blue" />
                            <strong className="text-deep-navy">{sch.vehicle?.vehicleType || 'Shuttle'}</strong> ({sch.vehicle?.plateNumber || ''})
                          </span>
                        </div>

                        <div className="bg-soft-sky p-3 rounded-xl space-y-1.5 text-[11px] text-slate-gray">
                          <p className="flex items-center gap-1">
                            📅 <strong className="text-deep-navy">{t('schedule.departure', 'Keberangkatan:')}</strong> {formatDate(sch.departureDate)}
                          </p>
                          <p className="flex items-center gap-1">
                            📍 <strong className="text-deep-navy">{t('schedule.route', 'Rute:')}</strong> {originName} → {destName}
                          </p>
                          {sch.poolOrigin && (
                            <p className="flex items-center gap-1">
                              🏢 <strong className="text-deep-navy">{t('schedule.originPool', 'Pool Asal:')}</strong> {sch.poolOrigin}
                            </p>
                          )}
                          {sch.poolDestination && (
                            <p className="flex items-center gap-1">
                              🏁 <strong className="text-deep-navy">{t('schedule.destinationPool', 'Pool Tujuan:')}</strong> {sch.poolDestination}
                            </p>
                          )}
                          {sch.driver?.user?.name && (
                            <p className="flex items-center gap-1">
                              👤 <strong className="text-deep-navy">{t('schedule.driver', 'Driver:')}</strong> {sch.driver.user.name}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action CTA */}
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenBookingModal && onOpenBookingModal(originName, destName, sch.id);
                          }}
                          className="w-full py-2 bg-travel-blue hover:bg-travel-blue-hover text-white text-xs font-extrabold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                        >
                          <Ticket className="w-3.5 h-3.5 text-sunset-orange" />
                          <span>{t('schedule.bookTicket', 'Pesan Tiket Shuttle')}</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenPackageModal && onOpenPackageModal(sch);
                          }}
                          className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                        >
                          <Package className="w-3.5 h-3.5" />
                          <span>{t('package.bookPackage', '📦 Kirim Paket')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Side/Horizontal Pagination Controls (Show if more than 3 items) */}
            {filteredSchedules.length > itemsPerPage && (
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white px-6 py-4 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="text-xs text-slate-gray font-medium">
                  Menampilkan <strong className="text-deep-navy">{(currentPage - 1) * itemsPerPage + 1}</strong> - <strong className="text-deep-navy">{Math.min(currentPage * itemsPerPage, filteredSchedules.length)}</strong> dari <strong className="text-deep-navy">{filteredSchedules.length}</strong> jadwal aktif
                </div>

                <div className="flex items-center gap-3">
                  {/* Prev Button */}
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`flex items-center gap-1 px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                      currentPage === 1
                        ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50'
                        : 'border-slate-300 text-deep-navy hover:bg-slate-100 hover:border-slate-400'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Sebelumnya</span>
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-xs font-extrabold transition-all ${
                          currentPage === pageNum
                            ? 'bg-travel-blue text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>

                  {/* Next Button (Pagination ke kanan) */}
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`flex items-center gap-1 px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-sm ${
                      currentPage === totalPages
                        ? 'border border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50'
                        : 'bg-travel-blue text-white hover:bg-travel-blue-hover shadow-travel-blue/20'
                    }`}
                  >
                    <span>Selanjutnya</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
            <Filter className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-deep-navy">Tidak ada jadwal perjalanan aktif</h3>
            <p className="text-sm text-slate-gray mt-1">
              {selectedDate ? `Tidak ada jadwal keberangkatan aktif pada tanggal ${formatDate(selectedDate)}.` : 'Belum ada jadwal perjalanan aktif saat ini.'}
            </p>
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="mt-4 px-4 py-2 bg-travel-blue text-white font-bold text-xs rounded-xl hover:bg-travel-blue-hover transition inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tampilkan Semua Tanggal</span>
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default DestinationDiscovery;
