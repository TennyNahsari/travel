import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS } from '../config/theme';
import { scheduleService } from '../services/api';
import BookingModal from '../components/BookingModal';
import BookingSuccessModal from '../components/BookingSuccessModal';
import PaymentCheckModal from '../components/PaymentCheckModal';
import PublicCharterModal from '../components/PublicCharterModal';
import PublicPackageModal from '../components/PublicPackageModal';

export default function LandingScreen({ onNavigate, showPaymentCheckTrigger, onClosePaymentCheckTrigger }) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [error, setError] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Booking Flow States
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingResultData, setBookingResultData] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Public Charter & Package Modal States
  const [showPublicCharterModal, setShowPublicCharterModal] = useState(false);
  const [showPublicPackageModal, setShowPublicPackageModal] = useState(false);

  // Payment Check Modal State
  const [showPaymentCheckModal, setShowPaymentCheckModal] = useState(false);
  const [paymentCheckCode, setPaymentCheckCode] = useState('');

  useEffect(() => {
    if (showPaymentCheckTrigger) {
      setShowPaymentCheckModal(true);
    }
  }, [showPaymentCheckTrigger]);

  useEffect(() => {
    fetchAvailableSchedules();
  }, [selectedDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDate, cityFilter]);

  const fetchAvailableSchedules = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (selectedDate) {
        params.date = selectedDate;
      }
      const res = await scheduleService.getAvailableSchedules(params);
      setSchedules(res.data || []);
    } catch (err) {
      console.error('Failed to fetch available schedules:', err);
      setError('Gagal memuat daftar jadwal. Pastikan server backend aktif.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAvailableSchedules();
  };

  // Filter schedules client-side by city search
  const filteredSchedules = schedules.filter((s) => {
    if (!cityFilter.trim()) return true;
    const query = cityFilter.toLowerCase();
    const origin = (s.route?.originCity?.name || '').toLowerCase();
    const dest = (s.route?.destinationCity?.name || '').toLowerCase();
    return origin.includes(query) || dest.includes(query);
  });

  // Client-side Pagination
  const totalPages = Math.ceil(filteredSchedules.length / itemsPerPage);
  const paginatedSchedules = filteredSchedules.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenBooking = (schedule) => {
    setSelectedSchedule(schedule);
    setShowBookingModal(true);
  };

  const handleBookingSuccess = (bookingData) => {
    setShowBookingModal(false);
    setBookingResultData(bookingData);
    setShowSuccessModal(true);
    fetchAvailableSchedules();
  };

  const handleCharterSuccess = (charterData) => {
    setShowPublicCharterModal(false);
    setBookingResultData({
      bookingCode: charterData.charterCode,
      passengerName: charterData.customerName,
      passengerPhone: charterData.customerPhone,
      seatNumbers: [`${charterData.totalVehicles || 1} Unit (${charterData.vehicle?.vehicleType || 'Shuttle'})`],
      totalPrice: charterData.totalPrice
    });
    setShowSuccessModal(true);
  };

  const handlePackageSuccess = (packageData) => {
    setShowPublicPackageModal(false);
    setBookingResultData({
      bookingCode: packageData.packageCode,
      passengerName: packageData.senderName,
      passengerPhone: packageData.senderPhone,
      seatNumbers: [`Ekspedisi Paket (${packageData.weightKg || 1} Kg)`],
      totalPrice: packageData.totalPrice
    });
    setShowSuccessModal(true);
  };

  const formatRupiah = (val) => {
    return 'Rp ' + Number(val || 0).toLocaleString('id-ID');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {/* HERO BANNER SECTION */}
        <LinearGradient colors={['#0f172a', '#1e293b', '#2563eb']} style={styles.heroSection}>
          <View style={styles.heroBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#60a5fa" />
            <Text style={styles.heroBadgeText}>Transportasi Darat Antar Kota Terpercaya</Text>
          </View>

          <Text style={styles.heroTitle}>
            Pesan Tiket Travel <Text style={styles.heroTitleHighlight}>Antar Kota</Text> Lebih Cepat.
          </Text>

          <Text style={styles.heroSubtitle}>
            Nikmati perjalanan aman & nyaman dengan armada Eksekutif Shuttle, jaminan tepat waktu, serta kemudahan pilih kursi online.
          </Text>

          <View style={styles.trustRow}>
            <View style={styles.trustItem}>
              <Ionicons name="checkmark-circle" size={14} color="#34d399" />
              <Text style={styles.trustText}>Armada Eksekutif Terbaru</Text>
            </View>
            <View style={styles.trustItem}>
              <Ionicons name="checkmark-circle" size={14} color="#34d399" />
              <Text style={styles.trustText}>Jaminan Tepat Waktu</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.btnCheckPaymentHero}
            onPress={() => setShowPaymentCheckModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="search-circle" size={20} color="#ffffff" />
            <Text style={styles.btnCheckPaymentHeroText}>Cek Status & Konfirmasi Pembayaran Tiket</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* SEARCH & FILTER BAR */}
        <View style={styles.searchSection}>
          <Text style={styles.sectionHeaderTitle}>🚌 Rute Travel Antar Kota Populer</Text>

          <View style={styles.filterCard}>
            {/* Filter Input: City */}
            <View style={styles.inputWrapper}>
              <Ionicons name="search-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.filterInput}
                placeholder="Cari Kota (Jakarta, Bandung, Cirebon...)"
                value={cityFilter}
                onChangeText={setCityFilter}
                placeholderTextColor={COLORS.textLight}
              />
              {cityFilter ? (
                <TouchableOpacity onPress={() => setCityFilter('')}>
                  <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Filter Input: Date */}
            <View style={styles.inputWrapper}>
              <Ionicons name="calendar-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.filterInput}
                placeholder="Filter Tanggal (YYYY-MM-DD)"
                value={selectedDate}
                onChangeText={setSelectedDate}
                placeholderTextColor={COLORS.textLight}
              />
              {selectedDate ? (
                <TouchableOpacity onPress={() => setSelectedDate('')}>
                  <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>

        {/* SCHEDULE CARDS FEED */}
        <View style={styles.schedulesFeed}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Memuat jadwal perjalanan...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="cloud-offline-outline" size={36} color={COLORS.danger} />
              <Text style={styles.errorTitle}>Koneksi Gagal</Text>
              <Text style={styles.errorSubtitle}>{error}</Text>
              <TouchableOpacity style={styles.btnRetry} onPress={fetchAvailableSchedules}>
                <Text style={styles.btnRetryText}>Coba Lagi</Text>
              </TouchableOpacity>
            </View>
          ) : filteredSchedules.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="bus-outline" size={42} color={COLORS.textLight} />
              <Text style={styles.emptyTitle}>Jadwal Tidak Ditemukan</Text>
              <Text style={styles.emptySubtitle}>
                {selectedDate || cityFilter
                  ? 'Tidak ada jadwal yang sesuai dengan filter tanggal/kota pencarian Anda.'
                  : 'Belum ada jadwal perjalanan aktif saat ini.'}
              </Text>
            </View>
          ) : (
            <>
              {paginatedSchedules.map((sch) => {
                const capacity = sch.vehicle?.capacity || 10;
                const avail = sch.availableSeats;
                const isSeatsLow = avail <= 3;

                return (
                  <View key={sch.id} style={styles.scheduleCard}>
                    {/* Card Header: Route & Status Badge */}
                    <View style={styles.cardHeader}>
                      <View style={styles.routeHeaderInfo}>
                        <Text style={styles.routeTitle}>
                          {sch.route?.originCity?.name} → {sch.route?.destinationCity?.name}
                        </Text>
                        <Text style={styles.provinceText}>
                          {sch.route?.originCity?.province} - {sch.route?.destinationCity?.province}
                        </Text>
                      </View>
                      <View style={[styles.seatLeftBadge, isSeatsLow && styles.seatLeftBadgeLow]}>
                        <Text style={[styles.seatLeftBadgeText, isSeatsLow && styles.seatLeftBadgeTextLow]}>
                          Sisa {avail} Kursi
                        </Text>
                      </View>
                    </View>

                    {/* Date & Time Row */}
                    <View style={styles.dateTimeRow}>
                      <View style={styles.infoBadge}>
                        <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
                        <Text style={styles.infoBadgeText}>{formatDate(sch.departureDate)}</Text>
                      </View>
                      <View style={styles.infoBadge}>
                        <Ionicons name="time-outline" size={14} color={COLORS.primary} />
                        <Text style={styles.infoBadgeText}>{sch.departureTime} WIB</Text>
                      </View>
                    </View>

                    {/* Pools Box */}
                    <View style={styles.poolCard}>
                      <Text style={styles.poolLine} numberOfLines={1}>
                        🏢 <Text style={styles.poolBold}>Pool Asal:</Text>{' '}
                        {sch.poolOrigin || (sch.route?.originCity?.name ? `Pool ${sch.route.originCity.name}` : '-')}
                      </Text>
                      <Text style={styles.poolLine} numberOfLines={1}>
                        🏁 <Text style={styles.poolBold}>Pool Tujuan:</Text>{' '}
                        {sch.poolDestination || (sch.route?.destinationCity?.name ? `Pool ${sch.route.destinationCity.name}` : '-')}
                      </Text>
                    </View>

                    {/* Vehicle & Price Footer */}
                    <View style={styles.cardFooter}>
                      <View>
                        <Text style={styles.vehicleType}>{sch.vehicle?.vehicleType}</Text>
                        <Text style={styles.vehiclePlate}>{sch.vehicle?.plateNumber}</Text>
                      </View>
                      <View style={styles.priceContainer}>
                        <Text style={styles.priceAmount}>{formatRupiah(sch.ticketPrice)}</Text>
                        <Text style={styles.pricePerSeat}>/ kursi</Text>
                      </View>
                    </View>

                    {/* Book Button */}
                    <TouchableOpacity
                      style={styles.btnBookTicket}
                      activeOpacity={0.8}
                      onPress={() => handleOpenBooking(sch)}
                    >
                      <Ionicons name="ticket-outline" size={18} color="#ffffff" />
                      <Text style={styles.btnBookTicketText}>Pesan Tiket Schedule Ini</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}

              {/* PAGINATION CONTROLS */}
              {filteredSchedules.length > itemsPerPage && (
                <View style={styles.paginationRow}>
                  <TouchableOpacity
                    style={[styles.btnPage, currentPage === 1 && styles.btnPageDisabled]}
                    disabled={currentPage === 1}
                    onPress={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  >
                    <Ionicons name="chevron-back" size={16} color={currentPage === 1 ? COLORS.textLight : COLORS.primary} />
                    <Text style={[styles.btnPageText, currentPage === 1 && styles.btnPageTextDisabled]}>Sebelumnya</Text>
                  </TouchableOpacity>

                  <Text style={styles.pageIndicator}>
                    Halaman {currentPage} dari {totalPages}
                  </Text>

                  <TouchableOpacity
                    style={[styles.btnPage, currentPage === totalPages && styles.btnPageDisabled]}
                    disabled={currentPage === totalPages}
                    onPress={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  >
                    <Text style={[styles.btnPageText, currentPage === totalPages && styles.btnPageTextDisabled]}>Selanjutnya</Text>
                    <Ionicons name="chevron-forward" size={16} color={currentPage === totalPages ? COLORS.textLight : COLORS.primary} />
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>

        {/* CAR CHARTER SECTION */}
        <View style={styles.landingServiceSection}>
          <View style={styles.serviceBannerCard}>
            <View style={[styles.serviceIconCircle, { backgroundColor: '#fae8ff' }]}>
              <Ionicons name="car-sport" size={26} color="#a855f7" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.serviceTitle}>Charter & Sewa Mobil (Armada Utuh)</Text>
              <Text style={styles.serviceSub}>
                Sewa 1 unit microbus/bus eksekutif khusus rombongan keluarga atau kantor dengan lokasi jemput & rute fleksibel.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.btnCharterAction}
            activeOpacity={0.8}
            onPress={() => setShowPublicCharterModal(true)}
          >
            <Ionicons name="create-outline" size={18} color="#ffffff" />
            <Text style={styles.btnActionText}>Form Pemesanan Charter Armada</Text>
          </TouchableOpacity>
        </View>

        {/* PACKAGE DELIVERY SECTION */}
        <View style={styles.landingServiceSection}>
          <View style={styles.serviceBannerCard}>
            <View style={[styles.serviceIconCircle, { backgroundColor: '#ffedd5' }]}>
              <Ionicons name="cube" size={26} color="#f97316" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.serviceTitle}>Pengiriman Paket & Kargo Ekspres</Text>
              <Text style={styles.serviceSub}>
                Kirim barang, dokumen penting, dan kargo antar kota cepat sampai pada hari yang sama via armada shuttle.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.btnPackageAction}
            activeOpacity={0.8}
            onPress={() => setShowPublicPackageModal(true)}
          >
            <Ionicons name="cube-outline" size={18} color="#ffffff" />
            <Text style={styles.btnActionText}>Form Kirim Paket & Kargo Ekspres</Text>
          </TouchableOpacity>
        </View>

        {/* SERVICE FEATURES SHOWCASE */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresBadge}>KEUNGGULAN UTAMA</Text>
          <Text style={styles.featuresTitle}>Mengapa Memilih TravelExpress?</Text>

          <View style={styles.featureGrid}>
            <View style={styles.featureCard}>
              <View style={[styles.featureIconBadge, { backgroundColor: '#eff6ff' }]}>
                <Ionicons name="star" size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.featureCardTitle}>Armada Eksekutif Terbaru</Text>
              <Text style={styles.featureCardDesc}>
                Toyota Hiace Premio & Isuzu Elf VIP selalu dirawat rutin demi kenyamanan maksimal.
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View style={[styles.featureIconBadge, { backgroundColor: '#ecfdf5' }]}>
                <Ionicons name="grid" size={22} color={COLORS.accent} />
              </View>
              <Text style={styles.featureCardTitle}>Pilihan Kursi Real-Time</Text>
              <Text style={styles.featureCardDesc}>
                Sistem interaktif memilih nomor kursi favorit secara langsung transparan tanpa diacak.
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View style={[styles.featureIconBadge, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="time" size={22} color={COLORS.warning} />
              </View>
              <Text style={styles.featureCardTitle}>Keberangkatan Tepat Waktu</Text>
              <Text style={styles.featureCardDesc}>
                Jadwal pemberangkatan tepat waktu via rute tol bebas macet dengan pengemudi profesional.
              </Text>
            </View>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footerSection}>
          <Text style={styles.footerBrand}>TravelExpress Mobile</Text>
          <Text style={styles.footerCopy}>© 2026 PT TravelExpress Indonesia. All Rights Reserved.</Text>
        </View>
      </ScrollView>

      {/* BOOKING MODAL */}
      <BookingModal
        visible={showBookingModal}
        schedule={selectedSchedule}
        onClose={() => setShowBookingModal(false)}
        onSuccess={handleBookingSuccess}
      />

      {/* PUBLIC CHARTER MODAL */}
      <PublicCharterModal
        visible={showPublicCharterModal}
        onClose={() => setShowPublicCharterModal(false)}
        onSuccess={handleCharterSuccess}
      />

      {/* PUBLIC PACKAGE MODAL */}
      <PublicPackageModal
        visible={showPublicPackageModal}
        onClose={() => setShowPublicPackageModal(false)}
        onSuccess={handlePackageSuccess}
      />

      {/* BOOKING SUCCESS MODAL */}
      <BookingSuccessModal
        visible={showSuccessModal}
        bookingData={bookingResultData}
        onClose={() => setShowSuccessModal(false)}
        onOpenPaymentCheck={(code) => {
          setShowSuccessModal(false);
          setPaymentCheckCode(code);
          setShowPaymentCheckModal(true);
        }}
      />

      {/* PAYMENT CHECK MODAL */}
      <PaymentCheckModal
        visible={showPaymentCheckModal}
        initialBookingCode={paymentCheckCode}
        onClose={() => {
          setShowPaymentCheckModal(false);
          setPaymentCheckCode('');
          if (onClosePaymentCheckTrigger) onClosePaymentCheckTrigger();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#93c5fd'
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 32,
    marginBottom: 10
  },
  heroTitleHighlight: {
    color: '#60a5fa'
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 20,
    marginBottom: 18
  },
  trustRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  trustText: {
    fontSize: 12,
    color: '#f1f5f9',
    fontWeight: '500'
  },
  btnCheckPaymentHero: {
    marginTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  btnCheckPaymentHeroText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700'
  },
  searchSection: {
    paddingHorizontal: 20,
    marginTop: 20
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.secondary,
    marginBottom: 12
  },
  filterCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    ...SHADOWS.small
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  inputIcon: {
    marginRight: 8
  },
  filterInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textMain
  },
  schedulesFeed: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textMuted
  },
  errorContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 8
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.secondary
  },
  errorSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingHorizontal: 20
  },
  btnRetry: {
    marginTop: 10,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20
  },
  btnRetryText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600'
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    paddingHorizontal: 20,
    ...SHADOWS.small
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.secondary
  },
  emptySubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18
  },
  scheduleCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  routeHeaderInfo: {
    flex: 1,
    paddingRight: 8
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.secondary
  },
  provinceText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2
  },
  seatLeftBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20
  },
  seatLeftBadgeLow: {
    backgroundColor: '#fef2f2'
  },
  seatLeftBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accentDark
  },
  seatLeftBadgeTextLow: {
    color: COLORS.danger
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8
  },
  infoBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary
  },
  poolCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    gap: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  poolLine: {
    fontSize: 11,
    color: COLORS.secondary
  },
  poolBold: {
    fontWeight: '700'
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  vehicleType: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondary
  },
  vehiclePlate: {
    fontSize: 11,
    color: COLORS.textMuted
  },
  priceContainer: {
    alignItems: 'flex-end'
  },
  priceAmount: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.primary
  },
  pricePerSeat: {
    fontSize: 10,
    color: COLORS.textMuted
  },
  btnBookTicket: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12
  },
  btnBookTicketText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700'
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginTop: 4
  },
  btnPage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#eff6ff'
  },
  btnPageDisabled: {
    backgroundColor: '#f1f5f9'
  },
  btnPageText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary
  },
  btnPageTextDisabled: {
    color: COLORS.textLight
  },
  pageIndicator: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary
  },
  landingServiceSection: {
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 10
  },
  serviceBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small
  },
  serviceIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.secondary
  },
  serviceSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    lineHeight: 16
  },
  btnCharterAction: {
    backgroundColor: '#a855f7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12
  },
  btnPackageAction: {
    backgroundColor: '#f97316',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12
  },
  btnActionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800'
  },
  featuresSection: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 20
  },
  featuresBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1,
    marginBottom: 4
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.secondary,
    marginBottom: 16
  },
  featureGrid: {
    gap: 12
  },
  featureCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small
  },
  featureIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
  },
  featureCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: 4
  },
  featureCardDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18
  },
  footerSection: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 20
  },
  footerBrand: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4
  },
  footerCopy: {
    fontSize: 11,
    color: '#94a3b8'
  }
});
