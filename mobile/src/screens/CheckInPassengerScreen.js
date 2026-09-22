import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../config/theme';
import { checkInService } from '../services/api';

export default function CheckInPassengerScreen({ onBack }) {
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [filterDate, setFilterDate] = useState('');
  const [filterCheckedIn, setFilterCheckedIn] = useState('all'); // 'all', 'true', 'false'
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSchedules();
  }, [filterDate]);

  useEffect(() => {
    if (selectedSchedule) {
      fetchBookings(selectedSchedule.id);
    }
  }, [selectedSchedule, filterCheckedIn]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterDate) params.date = filterDate;

      const res = await checkInService.getSchedules(params);
      const scheduleList = res.data || [];
      setSchedules(scheduleList);

      if (scheduleList.length > 0 && !selectedSchedule) {
        setSelectedSchedule(scheduleList[0]);
      }
    } catch (err) {
      console.error('Error fetching checkin schedules:', err);
      Alert.alert('Error', 'Gagal memuat jadwal perjalanan untuk check-in.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchBookings = async (scheduleId) => {
    try {
      setLoading(true);
      const params = {};
      if (filterCheckedIn !== 'all') params.checkedIn = filterCheckedIn;

      const res = await checkInService.getScheduleBookings(scheduleId, params);
      setBookings(res.data || []);
      if (res.stats) setStats(res.stats);
    } catch (err) {
      console.error('Error fetching schedule bookings:', err);
      Alert.alert('Error', 'Gagal memuat daftar penumpang.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSchedules();
    if (selectedSchedule) fetchBookings(selectedSchedule.id);
  };

  const handleCheckIn = async (bookingId, passengerName) => {
    try {
      setSubmitting(true);
      await checkInService.checkInBooking(bookingId);
      Alert.alert('Sukses', `Penumpang ${passengerName} berhasil di Check-In.`);
      if (selectedSchedule) {
        fetchBookings(selectedSchedule.id);
        fetchSchedules();
      }
    } catch (err) {
      console.error('Checkin error:', err);
      Alert.alert('Error', err.response?.data?.message || 'Gagal melakukan check-in.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUndoCheckIn = async (bookingId, passengerName) => {
    Alert.alert(
      'Batalkan Check-In',
      `Apakah Anda yakin ingin membatalkan status Check-In penumpang ${passengerName}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Batalkan Check-In',
          style: 'destructive',
          onPress: async () => {
            try {
              setSubmitting(true);
              await checkInService.undoCheckIn(bookingId);
              Alert.alert('Sukses', 'Status check-in berhasil dibatalkan.');
              if (selectedSchedule) {
                fetchBookings(selectedSchedule.id);
                fetchSchedules();
              }
            } catch (err) {
              console.error('Undo checkin error:', err);
              Alert.alert('Error', err.response?.data?.message || 'Gagal membatalkan check-in.');
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const handleBulkCheckIn = async () => {
    if (!selectedSchedule) return;

    Alert.alert(
      'Check-In Massal',
      `Apakah Anda yakin ingin Check-In SEMUA penumpang pada jadwal keberangkatan ini?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Check-In Semua',
          onPress: async () => {
            try {
              setSubmitting(true);
              const res = await checkInService.bulkCheckIn(selectedSchedule.id);
              Alert.alert('Sukses', res.message || 'Semua penumpang berhasil di check-in.');
              fetchBookings(selectedSchedule.id);
              fetchSchedules();
            } catch (err) {
              console.error('Bulk checkin error:', err);
              Alert.alert('Error', err.response?.data?.message || 'Gagal bulk check-in.');
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const openWhatsApp = (phone, code, name) => {
    if (!phone) return;
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    const msg = `Halo ${name || 'Penumpang'}, kami dari Petugas Check-In Travel Shuttle mengenai keberangkatan (${code}).`;
    Linking.openURL(`https://wa.me/${clean}?text=${encodeURIComponent(msg)}`).catch(() => {
      Alert.alert('Error', 'Aplikasi WhatsApp tidak dapat dibuka.');
    });
  };

  const filteredBookings = bookings.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = (b.passengerName || b.user?.name || '').toLowerCase();
    const phone = (b.passengerPhone || b.user?.phone || '').toLowerCase();
    const code = (b.bookingCode || '').toLowerCase();
    const seats = Array.isArray(b.seatNumbers) ? b.seatNumbers.join(' ').toLowerCase() : (b.seatNumber || '').toLowerCase();
    return name.includes(q) || phone.includes(q) || code.includes(q) || seats.includes(q);
  });

  return (
    <View style={styles.container}>
      {/* SCREEN HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.btnBack} onPress={onBack}>
          <Ionicons name="arrow-back-outline" size={20} color={COLORS.secondary} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Check-In Penumpang</Text>
          <Text style={styles.headerSub}>Verifikasi Manifest Boarding & Tiket Penumpang</Text>
        </View>

        {selectedSchedule && (
          <TouchableOpacity
            style={styles.btnBulk}
            onPress={handleBulkCheckIn}
            disabled={submitting}
          >
            <Ionicons name="checkmark-done-outline" size={16} color="#ffffff" />
            <Text style={styles.btnBulkText}>Bulk Check-In</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* SCHEDULE SELECTOR CAROUSEL */}
      <View style={styles.scheduleSelectorBox}>
        <Text style={styles.selectorTitle}>Pilih Jadwal Keberangkatan:</Text>
        {schedules.length === 0 ? (
          <Text style={styles.noScheduleText}>Belum ada jadwal perjalanan untuk tanggal ini.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sScroll}>
            {schedules.map((s) => {
              const isSelected = selectedSchedule?.id === s.id;
              const routeText = `${s.route?.originCity?.name || ''} → ${s.route?.destinationCity?.name || ''}`;
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.schChip, isSelected && styles.schChipActive]}
                  onPress={() => setSelectedSchedule(s)}
                >
                  <Text style={[styles.schRoute, isSelected && styles.schRouteActive]}>{routeText}</Text>
                  <Text style={[styles.schMeta, isSelected && styles.schMetaActive]}>
                    🕒 {s.departureTime} | 🚗 {s.vehicle?.vehicleType || 'Shuttle'}
                  </Text>
                  <Text style={[styles.schBadgeText, isSelected && styles.schMetaActive]}>
                    ✅ {s.checkedInCount || 0}/{s.totalBookedSeats || 0} Check-In
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* METRIC SUMMARY FOR SELECTED SCHEDULE */}
      {selectedSchedule && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{stats?.totalBookedSeats ?? selectedSchedule.totalBookedSeats ?? 0}</Text>
            <Text style={styles.statLabel}>Total Kursi</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statVal, { color: COLORS.accent }]}>{stats?.checkedInSeats ?? selectedSchedule.checkedInCount ?? 0}</Text>
            <Text style={styles.statLabel}>Checked-In</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statVal, { color: COLORS.warning }]}>
              {(stats?.totalBookedSeats ?? selectedSchedule.totalBookedSeats ?? 0) - (stats?.checkedInSeats ?? selectedSchedule.checkedInCount ?? 0)}
            </Text>
            <Text style={styles.statLabel}>Belum Checkin</Text>
          </View>
        </View>
      )}

      {/* SEARCH & CHECKIN FILTER CHIPS */}
      <View style={styles.filterSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama penumpang, kursi, resi..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.chipRow}>
          {[
            { id: 'all', label: 'Semua Status' },
            { id: 'true', label: 'Sudah Check-In' },
            { id: 'false', label: 'Belum Check-In' }
          ].map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.chip, filterCheckedIn === item.id && styles.chipActive]}
              onPress={() => setFilterCheckedIn(item.id)}
            >
              <Text style={[styles.chipText, filterCheckedIn === item.id && styles.chipActiveText]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* MANIFEST PASSENGERS LIST */}
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        >
          {filteredBookings.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="people-outline" size={42} color={COLORS.textLight} />
              <Text style={styles.emptyText}>Tidak ada data penumpang pada jadwal ini.</Text>
            </View>
          ) : (
            filteredBookings.map((b) => {
              const isCheckedIn = b.isCheckedIn;
              const name = b.passengerName || b.user?.name || 'Penumpang';
              const phone = b.passengerPhone || b.user?.phone || '-';
              const seats = Array.isArray(b.seatNumbers) ? b.seatNumbers.join(', ') : (b.seatNumber || '-');

              return (
                <View key={b.id} style={[styles.passengerCard, isCheckedIn && styles.passengerCardCheckedIn]}>
                  {/* HEADER */}
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.bookingCode}>{b.bookingCode}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: isCheckedIn ? '#dcfce7' : '#fef3c7' }]}>
                      <Ionicons
                        name={isCheckedIn ? 'checkmark-circle' : 'time-outline'}
                        size={12}
                        color={isCheckedIn ? '#15803d' : '#b45309'}
                      />
                      <Text style={[styles.statusBadgeText, { color: isCheckedIn ? '#15803d' : '#b45309' }]}>
                        {isCheckedIn ? 'SUDAH CHECK-IN' : 'BELUM CHECK-IN'}
                      </Text>
                    </View>
                  </View>

                  {/* SEAT & PASSENGER INFO */}
                  <View style={styles.seatRow}>
                    <View style={styles.seatBadgeBox}>
                      <Ionicons name="grid-outline" size={16} color="#ffffff" />
                      <Text style={styles.seatBadgeText}>Kursi: {seats}</Text>
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <Ionicons name="person-outline" size={16} color={COLORS.secondary} />
                    <Text style={styles.infoText}>
                      Nama: <Text style={styles.boldText}>{name}</Text>
                    </Text>
                    <TouchableOpacity
                      style={styles.btnWaInline}
                      onPress={() => openWhatsApp(phone, b.bookingCode, name)}
                    >
                      <Ionicons name="logo-whatsapp" size={12} color="#16a34a" />
                      <Text style={styles.btnWaText}>{phone}</Text>
                    </TouchableOpacity>
                  </View>

                  {b.passengerNik ? (
                    <Text style={styles.nikText}>NIK / ID: {b.passengerNik}</Text>
                  ) : null}

                  {isCheckedIn && b.checkedInAt && (
                    <Text style={styles.checkInTimeText}>
                      ⏱️ Check-In: {new Date(b.checkedInAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                    </Text>
                  )}

                  {/* ACTION BUTTON */}
                  <View style={styles.cardFooterRow}>
                    {isCheckedIn ? (
                      <TouchableOpacity
                        style={styles.btnUndo}
                        onPress={() => handleUndoCheckIn(b.id, name)}
                        disabled={submitting}
                      >
                        <Ionicons name="close-circle-outline" size={16} color="#dc2626" />
                        <Text style={styles.btnUndoText}>Batalkan Check-In</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.btnCheckInAction}
                        onPress={() => handleCheckIn(b.id, name)}
                        disabled={submitting}
                      >
                        <Ionicons name="checkmark-circle-outline" size={16} color="#ffffff" />
                        <Text style={styles.btnCheckInActionText}>Check-In Penumpang</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 10
  },
  btnBack: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: COLORS.inputBg
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.secondary
  },
  headerSub: {
    fontSize: 11,
    color: COLORS.textMuted
  },
  btnBulk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12
  },
  btnBulkText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700'
  },
  scheduleSelectorBox: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 6
  },
  selectorTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.secondary
  },
  noScheduleText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: 'italic'
  },
  sScroll: {
    flexDirection: 'row'
  },
  schChip: {
    padding: 10,
    borderRadius: 14,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
    width: 200,
    gap: 3,
    ...SHADOWS.small
  },
  schChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  schRoute: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.secondary
  },
  schRouteActive: {
    color: '#ffffff'
  },
  schMeta: {
    fontSize: 10,
    color: COLORS.textMuted
  },
  schMetaActive: {
    color: '#bfdbfe'
  },
  schBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accentDark,
    marginTop: 2
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 10
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center'
  },
  statVal: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.secondary
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textMuted
  },
  filterSection: {
    paddingHorizontal: 16,
    marginTop: 10,
    gap: 8
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.secondary
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted
  },
  chipActiveText: {
    color: '#ffffff'
  },
  listContainer: {
    padding: 16,
    gap: 12
  },
  emptyCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    gap: 10,
    marginTop: 20
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textMuted
  },
  passengerCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
    ...SHADOWS.small
  },
  passengerCardCheckedIn: {
    borderColor: '#86efac',
    backgroundColor: '#f0fdf4'
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  bookingCode: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800'
  },
  seatRow: {
    flexDirection: 'row'
  },
  seatBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10
  },
  seatBadgeText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800'
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  infoText: {
    fontSize: 13,
    color: COLORS.secondary
  },
  boldText: {
    fontWeight: '700'
  },
  nikText: {
    fontSize: 11,
    color: COLORS.textMuted
  },
  checkInTimeText: {
    fontSize: 11,
    color: COLORS.accentDark,
    fontWeight: '600'
  },
  btnWaInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6
  },
  btnWaText: {
    fontSize: 10,
    color: '#15803d',
    fontWeight: '700'
  },
  cardFooterRow: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.inputBg
  },
  btnCheckInAction: {
    backgroundColor: COLORS.accent,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  btnCheckInActionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800'
  },
  btnUndo: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  btnUndoText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '700'
  }
});
