import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Alert,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../config/theme';
import { bookingService, scheduleService } from '../services/api';
import BookingModal from '../components/BookingModal';

export default function BookingTiketScreen({ onBack, user }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Selected Booking Detail Modal
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // New Booking Modal state
  const [showNewBookingModal, setShowNewBookingModal] = useState(false);
  const [availableSchedules, setAvailableSchedules] = useState([]);
  const [selectedScheduleForBooking, setSelectedScheduleForBooking] = useState(null);
  const [showScheduleSelectorModal, setShowScheduleSelectorModal] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await bookingService.getBookings();
      setBookings(res.data || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Gagal memuat daftar pemesanan tiket.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const handleOpenNewBooking = async () => {
    try {
      setLoading(true);
      const res = await scheduleService.getAvailableSchedules();
      setAvailableSchedules(res.data || []);
      setLoading(false);
      setShowScheduleSelectorModal(true);
    } catch (err) {
      console.error('Error fetching schedules for booking:', err);
      Alert.alert('Gagal', 'Gagal memuat jadwal perjalanan aktif untuk pemesanan.');
      setLoading(false);
    }
  };

  const handleSelectSchedule = (sch) => {
    setSelectedScheduleForBooking(sch);
    setShowScheduleSelectorModal(false);
    setShowNewBookingModal(true);
  };

  const handleBookingCreated = () => {
    setShowNewBookingModal(false);
    setSuccess('Pemesanan tiket baru berhasil dibuat!');
    fetchBookings();
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleUpdateStatus = async (booking, newStatus) => {
    try {
      await bookingService.updateBookingStatus(booking.id, newStatus);
      setSuccess(`Status tiket ${booking.bookingCode} berhasil diubah menjadi ${newStatus}.`);
      if (selectedBooking && selectedBooking.id === booking.id) {
        setSelectedBooking({ ...selectedBooking, status: newStatus });
      }
      fetchBookings();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating booking status:', err);
      Alert.alert('Gagal Update Status', err.response?.data?.error || 'Gagal mengubah status pemesanan.');
    }
  };

  const handleCancelBooking = (booking) => {
    Alert.alert(
      'Batalkan Tiket',
      `Apakah Anda yakin ingin membatalkan pesanan tiket ${booking.bookingCode}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Batalkan Tiket',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookingService.cancelBooking(booking.id);
              setSuccess(`Pesanan tiket ${booking.bookingCode} berhasil dibatalkan.`);
              setShowDetailModal(false);
              fetchBookings();
              setTimeout(() => setSuccess(''), 3000);
            } catch (err) {
              console.error('Error cancelling booking:', err);
              Alert.alert('Gagal Pembatalan', err.response?.data?.error || 'Gagal membatalkan tiket.');
            }
          }
        }
      ]
    );
  };

  const formatRupiah = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
    const q = search.toLowerCase();
    const code = (b.bookingCode || b.id || '').toLowerCase();
    const name = (b.passengerName || b.user?.name || '').toLowerCase();
    const phone = (b.passengerPhone || b.user?.phone || '').toLowerCase();
    return code.includes(q) || name.includes(q) || phone.includes(q);
  });

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.btnBack} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color={COLORS.secondary} />
          <Text style={styles.btnBackText}>Dashboard</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Modul Pemesanan Tiket</Text>

        <TouchableOpacity style={styles.btnAdd} onPress={handleOpenNewBooking} activeOpacity={0.8}>
          <Ionicons name="add" size={18} color="#ffffff" />
          <Text style={styles.btnAddText}>Buat Booking</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Toolbar */}
      <View style={styles.filterToolbar}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={16} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari kode booking, nama penumpang..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={COLORS.textLight}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Status Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusChipsRow}>
          {['ALL', 'PENDING', 'PAID', 'CONFIRMED', 'CANCELLED'].map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.statusChip, statusFilter === st && styles.statusChipActive]}
              onPress={() => setStatusFilter(st)}
            >
              <Text style={[styles.statusChipText, statusFilter === st && styles.statusChipTextActive]}>
                {st === 'ALL' ? 'Semua Status' : st}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Success Alert */}
      {success ? (
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.accentDark} />
          <Text style={styles.successBannerText}>{success}</Text>
        </View>
      ) : null}

      {/* Bookings Feed Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Memuat pemesanan tiket...</Text>
          </View>
        ) : filteredBookings.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="ticket-outline" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>Tiket Tidak Ditemukan</Text>
            <Text style={styles.emptySubtitle}>
              Belum ada data pemesanan tiket atau filter pencarian tidak menemukan data.
            </Text>
          </View>
        ) : (
          filteredBookings.map((b) => {
            const isPaid = b.status === 'PAID' || b.status === 'CONFIRMED';
            const isCancelled = b.status === 'CANCELLED';
            const passengerName = b.passengerName || b.user?.name || 'Customer';
            const seatList = Array.isArray(b.seatNumbers) ? b.seatNumbers.join(', ') : b.seatNumber || '-';

            return (
              <View key={b.id} style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.codeText}>{b.bookingCode || b.id}</Text>
                  <View style={[
                    styles.badge,
                    isPaid ? styles.badgePaid : isCancelled ? styles.badgeCancelled : styles.badgePending
                  ]}>
                    <Text style={[
                      styles.badgeText,
                      isPaid ? styles.textPaid : isCancelled ? styles.textCancelled : styles.textPending
                    ]}>
                      {b.status === 'PAID' ? '✓ LUNAS' : b.status === 'CONFIRMED' ? '✓ TERKONFIRMASI' : b.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.passengerBox}>
                  <Text style={styles.passengerText}>👤 <Text style={styles.boldText}>{passengerName}</Text> ({b.passengerPhone || b.user?.phone || '-'})</Text>
                </View>

                <View style={styles.routeBox}>
                  <Text style={styles.routeText}>
                    📍 {b.schedule?.route?.originCity?.name} → {b.schedule?.route?.destinationCity?.name}
                  </Text>
                  <Text style={styles.scheduleText}>
                    🗓️ {formatDate(b.schedule?.departureDate)} | ⏰ {b.schedule?.departureTime} WIB
                  </Text>
                </View>

                <View style={styles.seatsRow}>
                  <Text style={styles.seatLabel}>Kursi: <Text style={styles.seatVal}>{seatList}</Text></Text>
                  <Text style={styles.priceVal}>{formatRupiah(b.totalPrice)}</Text>
                </View>

                <View style={styles.cardFooter}>
                  <TouchableOpacity
                    style={styles.btnDetail}
                    onPress={() => {
                      setSelectedBooking(b);
                      setShowDetailModal(true);
                    }}
                  >
                    <Ionicons name="eye-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.btnDetailText}>Detail Tiket</Text>
                  </TouchableOpacity>

                  {b.status === 'PENDING' ? (
                    <TouchableOpacity
                      style={styles.btnMarkPaid}
                      onPress={() => handleUpdateStatus(b, 'PAID')}
                    >
                      <Text style={styles.btnMarkPaidText}>✓ Set Lunas</Text>
                    </TouchableOpacity>
                  ) : null}

                  {!isCancelled ? (
                    <TouchableOpacity style={styles.btnCancel} onPress={() => handleCancelBooking(b)}>
                      <Ionicons name="close-circle-outline" size={16} color={COLORS.danger} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* SCHEDULE SELECTOR MODAL (FOR CREATING NEW BOOKING) */}
      <Modal visible={showScheduleSelectorModal} animationType="slide" transparent={true} onRequestClose={() => setShowScheduleSelectorModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Jadwal Perjalanan</Text>
              <TouchableOpacity onPress={() => setShowScheduleSelectorModal(false)}>
                <Ionicons name="close" size={20} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
              {availableSchedules.length === 0 ? (
                <Text style={styles.emptyText}>Tidak ada jadwal perjalanan aktif saat ini.</Text>
              ) : (
                availableSchedules.map((sch) => (
                  <TouchableOpacity
                    key={sch.id}
                    style={styles.scheduleItemCard}
                    onPress={() => handleSelectSchedule(sch)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.scheduleItemTitle}>
                      {sch.route?.originCity?.name} → {sch.route?.destinationCity?.name}
                    </Text>
                    <Text style={styles.scheduleItemSubtitle}>
                      {formatDate(sch.departureDate)} | {sch.departureTime} WIB | Sisa {sch.availableSeats} Kursi
                    </Text>
                    <Text style={styles.scheduleItemPrice}>{formatRupiah(sch.ticketPrice)} / kursi</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* NEW BOOKING FORM SEAT SELECTION MODAL */}
      <BookingModal
        visible={showNewBookingModal}
        schedule={selectedScheduleForBooking}
        onClose={() => setShowNewBookingModal(false)}
        onSuccess={handleBookingCreated}
      />

      {/* DETAIL BOOKING MODAL */}
      <Modal visible={showDetailModal} animationType="fade" transparent={true} onRequestClose={() => setShowDetailModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedBooking ? (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Detail Tiket E-Pass</Text>
                  <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                    <Ionicons name="close" size={20} color={COLORS.secondary} />
                  </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
                  <View style={styles.codeCard}>
                    <Text style={styles.codeLabel}>KODE BOOKING TIKET</Text>
                    <Text style={styles.codeValue}>{selectedBooking.bookingCode}</Text>
                    <View style={styles.statusBadgeModal}>
                      <Text style={styles.statusBadgeModalText}>{selectedBooking.status}</Text>
                    </View>
                  </View>

                  <View style={styles.infoBoxGroup}>
                    <Text style={styles.infoBoxHeading}>Rincian Penumpang</Text>
                    <Text style={styles.infoBoxLine}>Nama: <Text style={styles.boldText}>{selectedBooking.passengerName || selectedBooking.user?.name || '-'}</Text></Text>
                    <Text style={styles.infoBoxLine}>No. WhatsApp: <Text style={styles.boldText}>{selectedBooking.passengerPhone || selectedBooking.user?.phone || '-'}</Text></Text>
                    <Text style={styles.infoBoxLine}>Email: <Text style={styles.boldText}>{selectedBooking.passengerEmail || selectedBooking.user?.email || '-'}</Text></Text>
                    <Text style={styles.infoBoxLine}>NIK Penumpang: <Text style={styles.boldText}>{selectedBooking.passengerNik || '-'}</Text></Text>
                  </View>

                  <View style={styles.infoBoxGroup}>
                    <Text style={styles.infoBoxHeading}>Rincian Perjalanan & Kursi</Text>
                    <Text style={styles.infoBoxLine}>Rute: <Text style={styles.boldText}>{selectedBooking.schedule?.route?.originCity?.name} → {selectedBooking.schedule?.route?.destinationCity?.name}</Text></Text>
                    <Text style={styles.infoBoxLine}>Jadwal: <Text style={styles.boldText}>{formatDate(selectedBooking.schedule?.departureDate)} | {selectedBooking.schedule?.departureTime} WIB</Text></Text>
                    <Text style={styles.infoBoxLine}>Nomor Kursi: <Text style={[styles.boldText, { color: COLORS.primary }]}>{Array.isArray(selectedBooking.seatNumbers) ? selectedBooking.seatNumbers.join(', ') : selectedBooking.seatNumber || '-'}</Text></Text>
                    <Text style={styles.infoBoxLine}>Total Bayar: <Text style={[styles.boldText, { color: COLORS.accentDark }]}>{formatRupiah(selectedBooking.totalPrice)}</Text></Text>
                  </View>

                  {selectedBooking.status === 'PENDING' ? (
                    <TouchableOpacity
                      style={styles.btnActionPaidModal}
                      onPress={() => handleUpdateStatus(selectedBooking, 'PAID')}
                    >
                      <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                      <Text style={styles.btnActionPaidModalText}>Tandai Sebagai LUNAS</Text>
                    </TouchableOpacity>
                  ) : null}
                </ScrollView>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  btnBack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  btnBackText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondary
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.secondary
  },
  btnAdd: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  btnAddText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700'
  },
  filterToolbar: {
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 8
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textMain,
    marginLeft: 6
  },
  statusChipsRow: {
    gap: 6
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: COLORS.border
  },
  statusChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.secondary
  },
  statusChipTextActive: {
    color: '#ffffff'
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#a7f3d0'
  },
  successBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.accentDark
  },
  scrollContent: {
    padding: 16,
    gap: 12
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textMuted
  },
  emptyBox: {
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
    textAlign: 'center'
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
    ...SHADOWS.small
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  codeText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  badgePending: {
    backgroundColor: '#fef3c7'
  },
  badgePaid: {
    backgroundColor: '#dcfce7'
  },
  badgeCancelled: {
    backgroundColor: '#fef2f2'
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800'
  },
  textPending: {
    color: '#b45309'
  },
  textPaid: {
    color: COLORS.accentDark
  },
  textCancelled: {
    color: COLORS.danger
  },
  passengerBox: {
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 8
  },
  passengerText: {
    fontSize: 12,
    color: COLORS.secondary
  },
  boldText: {
    fontWeight: '700'
  },
  routeBox: {
    gap: 2
  },
  routeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondary
  },
  scheduleText: {
    fontSize: 11,
    color: COLORS.textMuted
  },
  seatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  seatLabel: {
    fontSize: 12,
    color: COLORS.textMuted
  },
  seatVal: {
    fontWeight: '800',
    color: COLORS.primary
  },
  priceVal: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.accentDark
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4
  },
  btnDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#eff6ff'
  },
  btnDetailText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary
  },
  btnMarkPaid: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  btnMarkPaidText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.accentDark
  },
  btnCancel: {
    padding: 6
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    maxHeight: '90%',
    ...SHADOWS.medium
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.secondary
  },
  scheduleItemCard: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    padding: 12,
    gap: 4
  },
  scheduleItemTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary
  },
  scheduleItemSubtitle: {
    fontSize: 12,
    color: COLORS.secondary
  },
  scheduleItemPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.accentDark
  },
  codeCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe'
  },
  codeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted
  },
  codeValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    marginVertical: 4
  },
  statusBadgeModal: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10
  },
  statusBadgeModalText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#b45309'
  },
  infoBoxGroup: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4
  },
  infoBoxHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.secondary,
    marginBottom: 4
  },
  infoBoxLine: {
    fontSize: 12,
    color: COLORS.textMuted
  },
  btnActionPaidModal: {
    backgroundColor: COLORS.accentDark,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6
  },
  btnActionPaidModalText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700'
  }
});
