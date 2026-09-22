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
  RefreshControl,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../config/theme';
import { scheduleService, masterService } from '../services/api';

export default function JadwalPerjalananScreen({ onBack, user }) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchDate, setSearchDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'SCHEDULED', 'COMPLETED', 'CANCELLED'
  const [showPastCompleted, setShowPastCompleted] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dropdowns state
  const [dropdownRoutes, setDropdownRoutes] = useState([]);
  const [dropdownVehicles, setDropdownVehicles] = useState([]);
  const [dropdownDrivers, setDropdownDrivers] = useState([]);

  // Form Modal state
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [routeId, setRouteId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('08:00');
  const [ticketPrice, setTicketPrice] = useState('120000');
  const [availableSeats, setAvailableSeats] = useState('12');
  const [poolOrigin, setPoolOrigin] = useState('');
  const [poolDestination, setPoolDestination] = useState('');
  const [status, setStatus] = useState('SCHEDULED');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSchedules();
    fetchDropdowns();
  }, [showPastCompleted]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (showPastCompleted) {
        params.includeCompletedPast = 'true';
      }
      const res = await scheduleService.getSchedules(params);
      setSchedules(res.data || []);
    } catch (err) {
      console.error('Error fetching schedules:', err);
      setError('Gagal memuat daftar jadwal perjalanan.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [rRes, vRes, dRes] = await Promise.all([
        scheduleService.getAvailableRoutes().catch(() => ({ data: [] })),
        scheduleService.getAvailableVehicles().catch(() => ({ data: [] })),
        scheduleService.getAvailableDrivers().catch(() => ({ data: [] }))
      ]);
      setDropdownRoutes(rRes.data || []);
      setDropdownVehicles(vRes.data || []);
      setDropdownDrivers(dRes.data || []);
    } catch (err) {
      console.error('Error fetching dropdowns:', err);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSchedules();
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setRouteId(dropdownRoutes[0]?.id || '');
    setVehicleId(dropdownVehicles[0]?.id || '');
    setDriverId(dropdownDrivers[0]?.id || '');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDepartureDate(tomorrow.toISOString().split('T')[0]);
    setDepartureTime('08:00');
    setTicketPrice('120000');
    setAvailableSeats('12');
    setPoolOrigin('Pool Utama');
    setPoolDestination('Pool Tujuan');
    setStatus('SCHEDULED');
    setShowModal(true);
  };

  const handleOpenEdit = (sch) => {
    setEditId(sch.id);
    setRouteId(sch.routeId);
    setVehicleId(sch.vehicleId);
    setDriverId(sch.driverId || '');
    const dStr = sch.departureDate ? sch.departureDate.split('T')[0] : '';
    setDepartureDate(dStr);
    setDepartureTime(sch.departureTime || '08:00');
    setTicketPrice(sch.ticketPrice ? sch.ticketPrice.toString() : '120000');
    setAvailableSeats(sch.availableSeats ? sch.availableSeats.toString() : '12');
    setPoolOrigin(sch.poolOrigin || '');
    setPoolDestination(sch.poolDestination || '');
    setStatus(sch.status || 'SCHEDULED');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!routeId || !vehicleId) {
      Alert.alert('Peringatan', 'Rute dan Armada Kendaraan wajib dipilih.');
      return;
    }
    if (!departureDate.trim()) {
      Alert.alert('Peringatan', 'Tanggal Keberangkatan (YYYY-MM-DD) wajib diisi.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        routeId,
        vehicleId,
        driverId: driverId || null,
        departureDate: departureDate.trim(),
        departureTime: departureTime.trim(),
        ticketPrice: ticketPrice ? parseInt(ticketPrice) : 120000,
        availableSeats: availableSeats ? parseInt(availableSeats) : 12,
        poolOrigin: poolOrigin.trim(),
        poolDestination: poolDestination.trim(),
        status
      };

      if (editId) {
        await scheduleService.updateSchedule(editId, payload);
        setSuccess('Jadwal perjalanan berhasil diperbarui!');
      } else {
        await scheduleService.createSchedule(payload);
        setSuccess('Jadwal perjalanan baru berhasil dibuat!');
      }

      setShowModal(false);
      fetchSchedules();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving schedule:', err);
      Alert.alert('Gagal', err.response?.data?.error || 'Gagal menyimpan jadwal perjalanan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (sch, newStatus) => {
    try {
      await scheduleService.updateScheduleStatus(sch.id, newStatus);
      setSuccess(`Status jadwal berhasil diubah menjadi ${newStatus}.`);
      fetchSchedules();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating status:', err);
      Alert.alert('Gagal Update', err.response?.data?.error || 'Gagal mengubah status jadwal.');
    }
  };

  const handleDelete = (sch) => {
    const originName = sch.route?.originCity?.name || 'Asal';
    const destName = sch.route?.destinationCity?.name || 'Tujuan';

    Alert.alert(
      'Hapus Jadwal',
      `Apakah Anda yakin ingin menghapus jadwal rute ${originName} → ${destName} (${sch.departureTime})?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await scheduleService.deleteSchedule(sch.id);
              setSuccess('Jadwal perjalanan berhasil dihapus.');
              fetchSchedules();
              setTimeout(() => setSuccess(''), 3000);
            } catch (err) {
              console.error('Error deleting schedule:', err);
              Alert.alert('Gagal Hapus', err.response?.data?.error || 'Jadwal terikat dengan tiket pemesanan.');
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

  const filteredSchedules = schedules.filter((sch) => {
    if (statusFilter !== 'ALL' && sch.status !== statusFilter) return false;
    if (searchDate) {
      const schD = sch.departureDate ? sch.departureDate.split('T')[0] : '';
      if (!schD.includes(searchDate)) return false;
    }
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.btnBack} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color={COLORS.secondary} />
          <Text style={styles.btnBackText}>Dashboard</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Modul Jadwal Perjalanan</Text>

        <TouchableOpacity style={styles.btnAdd} onPress={handleOpenAdd} activeOpacity={0.8}>
          <Ionicons name="add" size={18} color="#ffffff" />
          <Text style={styles.btnAddText}>Buat Jadwal</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Toolbar & Show Past Toggle */}
      <View style={styles.filterToolbar}>
        <View style={styles.dateFilterContainer}>
          <Ionicons name="calendar-outline" size={16} color={COLORS.textMuted} />
          <TextInput
            style={styles.dateInput}
            placeholder="Filter Tanggal (YYYY-MM-DD)"
            value={searchDate}
            onChangeText={setSearchDate}
            placeholderTextColor={COLORS.textLight}
          />
          {searchDate ? (
            <TouchableOpacity onPress={() => setSearchDate('')}>
              <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Toggle Show Completed & Past Schedules */}
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Tampilkan Jadwal Selesai/Lewat</Text>
          <Switch
            value={showPastCompleted}
            onValueChange={setShowPastCompleted}
            trackColor={{ false: '#cbd5e1', true: COLORS.primary }}
            thumbColor="#ffffff"
          />
        </View>

        {/* Status Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusChipsRow}>
          {['ALL', 'SCHEDULED', 'COMPLETED', 'CANCELLED'].map((st) => (
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

      {/* Schedule Feed Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Memuat jadwal perjalanan...</Text>
          </View>
        ) : filteredSchedules.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="bus-outline" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>Jadwal Tidak Ditemukan</Text>
            <Text style={styles.emptySubtitle}>
              Belum ada jadwal perjalanan atau filter pencarian tidak menemukan data.
            </Text>
          </View>
        ) : (
          filteredSchedules.map((sch) => {
            const isCompleted = sch.status === 'COMPLETED';
            const isCancelled = sch.status === 'CANCELLED';

            return (
              <View key={sch.id} style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.routeText}>
                    {sch.route?.originCity?.name} → {sch.route?.destinationCity?.name}
                  </Text>
                  <View style={[
                    styles.badge,
                    isCompleted ? styles.badgeCompleted : isCancelled ? styles.badgeCancelled : styles.badgeScheduled
                  ]}>
                    <Text style={[
                      styles.badgeText,
                      isCompleted ? styles.textCompleted : isCancelled ? styles.textCancelled : styles.textScheduled
                    ]}>
                      {sch.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoGrid}>
                  <View style={styles.infoBadge}>
                    <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
                    <Text style={styles.infoBadgeText}>{formatDate(sch.departureDate)}</Text>
                  </View>

                  <View style={styles.infoBadge}>
                    <Ionicons name="time-outline" size={14} color={COLORS.primary} />
                    <Text style={styles.infoBadgeText}>{sch.departureTime} WIB</Text>
                  </View>

                  <View style={styles.infoBadge}>
                    <Ionicons name="people-outline" size={14} color={COLORS.accentDark} />
                    <Text style={styles.infoBadgeText}>Sisa {sch.availableSeats} Kursi</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailText}>
                    🚌 <Text style={styles.boldText}>{sch.vehicle?.vehicleType}</Text> ({sch.vehicle?.plateNumber})
                  </Text>
                  <Text style={styles.detailText}>
                    👤 Driver: <Text style={styles.boldText}>{sch.driver?.user?.name || '-'}</Text>
                  </Text>
                </View>

                <View style={styles.poolBox}>
                  <Text style={styles.poolText} numberOfLines={1}>
                    🏢 <Text style={styles.boldText}>Pool Asal:</Text> {sch.poolOrigin || '-'}
                  </Text>
                  <Text style={styles.poolText} numberOfLines={1}>
                    🏁 <Text style={styles.boldText}>Pool Tujuan:</Text> {sch.poolDestination || '-'}
                  </Text>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.priceText}>{formatRupiah(sch.ticketPrice)}</Text>

                  <View style={styles.actionBtnGroup}>
                    {/* Status change shortcuts */}
                    {sch.status === 'SCHEDULED' ? (
                      <TouchableOpacity
                        style={styles.btnStatusComplete}
                        onPress={() => handleUpdateStatus(sch, 'COMPLETED')}
                      >
                        <Text style={styles.btnStatusCompleteText}>✓ Complete</Text>
                      </TouchableOpacity>
                    ) : null}

                    <TouchableOpacity style={styles.btnEdit} onPress={() => handleOpenEdit(sch)}>
                      <Ionicons name="create-outline" size={16} color={COLORS.primary} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.btnDelete} onPress={() => handleDelete(sch)}>
                      <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* MODAL FORM ADD / EDIT */}
      <Modal visible={showModal} animationType="slide" transparent={true} onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <View style={styles.modalForm}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editId ? 'Edit Jadwal Perjalanan' : 'Buat Jadwal Baru'}</Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Ionicons name="close" size={20} color={COLORS.secondary} />
                </TouchableOpacity>
              </View>

              {/* Select Route */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Pilih Rute Perjalanan *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                  {dropdownRoutes.map((r) => (
                    <TouchableOpacity
                      key={r.id}
                      style={[styles.chip, routeId === r.id && styles.chipActive]}
                      onPress={() => setRouteId(r.id)}
                    >
                      <Text style={[styles.chipText, routeId === r.id && styles.chipTextActive]}>
                        {r.originCity?.name} → {r.destinationCity?.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Select Vehicle */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Pilih Armada Mobil *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                  {dropdownVehicles.map((v) => (
                    <TouchableOpacity
                      key={v.id}
                      style={[styles.chip, vehicleId === v.id && styles.chipActive]}
                      onPress={() => {
                        setVehicleId(v.id);
                        if (v.capacity) setAvailableSeats(v.capacity.toString());
                      }}
                    >
                      <Text style={[styles.chipText, vehicleId === v.id && styles.chipTextActive]}>
                        {v.vehicleType} ({v.plateNumber})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Select Driver */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Pilih Pengemudi / Driver</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                  {dropdownDrivers.map((d) => (
                    <TouchableOpacity
                      key={d.id}
                      style={[styles.chip, driverId === d.id && styles.chipActive]}
                      onPress={() => setDriverId(d.id)}
                    >
                      <Text style={[styles.chipText, driverId === d.id && styles.chipTextActive]}>
                        {d.user?.name || 'Driver'} ({d.licenseNumber})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Tanggal Keberangkatan (YYYY-MM-DD) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2026-10-25"
                  value={departureDate}
                  onChangeText={setDepartureDate}
                  placeholderTextColor={COLORS.textLight}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Jam Berangkat (HH:mm) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="08:00"
                  value={departureTime}
                  onChangeText={setDepartureTime}
                  placeholderTextColor={COLORS.textLight}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Harga Tiket Per Kursi (Rp) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="120000"
                  keyboardType="numeric"
                  value={ticketPrice}
                  onChangeText={setTicketPrice}
                  placeholderTextColor={COLORS.textLight}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Pool Asal Keberangkatan</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Contoh: Pool Semanggi / Lebak Bulus"
                  value={poolOrigin}
                  onChangeText={setPoolOrigin}
                  placeholderTextColor={COLORS.textLight}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Pool Tujuan Kedatangan</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Contoh: Pool Dipatiukur Bandung"
                  value={poolDestination}
                  onChangeText={setPoolDestination}
                  placeholderTextColor={COLORS.textLight}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.btnCancel} onPress={() => setShowModal(false)}>
                  <Text style={styles.btnCancelText}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnSave, submitting && styles.btnDisabled]}
                  onPress={handleSave}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.btnSaveText}>{editId ? 'Simpan' : 'Buat Jadwal'}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
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
  dateFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  dateInput: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textMain,
    marginLeft: 6
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  toggleLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.secondary
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
  routeText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.secondary
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  badgeScheduled: {
    backgroundColor: '#eff6ff'
  },
  badgeCompleted: {
    backgroundColor: '#dcfce7'
  },
  badgeCancelled: {
    backgroundColor: '#fef2f2'
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800'
  },
  textScheduled: {
    color: COLORS.primary
  },
  textCompleted: {
    color: COLORS.accentDark
  },
  textCancelled: {
    color: COLORS.danger
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 6
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  infoBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.secondary
  },
  detailRow: {
    gap: 2
  },
  detailText: {
    fontSize: 12,
    color: COLORS.secondary
  },
  boldText: {
    fontWeight: '700'
  },
  poolBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 8,
    gap: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  poolText: {
    fontSize: 11,
    color: COLORS.secondary
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary
  },
  actionBtnGroup: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center'
  },
  btnStatusComplete: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8
  },
  btnStatusCompleteText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.accentDark
  },
  btnEdit: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnDelete: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: 20
  },
  modalForm: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    gap: 12,
    ...SHADOWS.medium
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 10
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.secondary
  },
  formGroup: {
    gap: 6
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary
  },
  chipsRow: {
    gap: 6,
    paddingVertical: 4
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: COLORS.border
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondary
  },
  chipTextActive: {
    color: '#ffffff'
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: COLORS.textMain
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center'
  },
  btnCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondary
  },
  btnSave: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center'
  },
  btnSaveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff'
  },
  btnDisabled: {
    opacity: 0.6
  }
});
