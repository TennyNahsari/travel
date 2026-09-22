import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Alert,
  Linking,
  RefreshControl,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../config/theme';
import { charterService, masterService, getImageUrl } from '../services/api';

export default function CharterArmadaScreen({ onBack }) {
  const [charters, setCharters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal States
  const [selectedCharter, setSelectedCharter] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State for Add Charter
  const [vehicles, setVehicles] = useState([]);
  const [cities, setCities] = useState([]);
  const [form, setForm] = useState({
    vehicleId: '',
    originCityId: '',
    destinationCityId: '',
    originAddress: '',
    destinationAddress: '',
    charterDate: new Date().toISOString().split('T')[0],
    durationDays: '1',
    totalVehicles: '1',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    notes: '',
    paymentMethod: 'TRANSFER'
  });

  useEffect(() => {
    fetchCharters();
    fetchDropdowns();
  }, [statusFilter]);

  const fetchCharters = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;

      const res = await charterService.getCharters(params);
      setCharters(res.data || []);
    } catch (err) {
      console.error('Error fetching charters:', err);
      Alert.alert('Error', 'Gagal mengambil data charter armada.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [vRes, cRes] = await Promise.all([
        masterService.getVehicles().catch(() => null),
        masterService.getCities().catch(() => null)
      ]);
      if (vRes?.data) setVehicles(vRes.data.filter(v => v.status === 'ACTIVE'));
      if (cRes?.data) setCities(cRes.data);
    } catch (err) {
      console.error('Error fetching dropdowns:', err);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCharters();
  };

  const handleSearch = () => {
    fetchCharters();
  };

  const handleUpdateStatus = async (charterId, newStatus) => {
    try {
      setSubmitting(true);
      await charterService.updateCharterStatus(charterId, newStatus);
      Alert.alert('Sukses', `Status charter berhasil diubah ke ${newStatus}`);
      if (selectedCharter && selectedCharter.id === charterId) {
        setSelectedCharter(prev => prev ? { ...prev, status: newStatus } : null);
      }
      fetchCharters();
    } catch (err) {
      console.error('Update status error:', err);
      Alert.alert('Error', err.response?.data?.error || 'Gagal mengubah status charter.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCharter = async (charterId, charterCode) => {
    Alert.alert(
      'Konfirmasi Hapus',
      `Apakah Anda yakin ingin menghapus booking charter ${charterCode}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await charterService.deleteCharter(charterId);
              Alert.alert('Sukses', 'Booking charter berhasil dihapus.');
              if (showDetailModal && selectedCharter?.id === charterId) {
                setShowDetailModal(false);
              }
              fetchCharters();
            } catch (err) {
              console.error('Delete charter error:', err);
              Alert.alert('Error', 'Gagal menghapus charter.');
            }
          }
        }
      ]
    );
  };

  const handleCreateCharter = async () => {
    if (!form.vehicleId) return Alert.alert('Peringatan', 'Pilih armada terlebih dahulu.');
    if (!form.originAddress.trim()) return Alert.alert('Peringatan', 'Alamat penjemputan wajib diisi.');
    if (!form.destinationAddress.trim()) return Alert.alert('Peringatan', 'Alamat tujuan wajib diisi.');
    if (!form.customerName.trim()) return Alert.alert('Peringatan', 'Nama pemesan wajib diisi.');
    if (!form.customerPhone.trim()) return Alert.alert('Peringatan', 'Nomor WhatsApp wajib diisi.');

    try {
      setSubmitting(true);
      await charterService.createCharter({
        ...form,
        durationDays: parseInt(form.durationDays, 10) || 1,
        totalVehicles: parseInt(form.totalVehicles, 10) || 1
      });
      Alert.alert('Sukses', 'Pemesanan charter armada berhasil dibuat!');
      setShowAddModal(false);
      resetForm();
      fetchCharters();
    } catch (err) {
      console.error('Create charter error:', err);
      Alert.alert('Gagal', err.response?.data?.error || 'Gagal membuat booking charter.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({
      vehicleId: '',
      originCityId: '',
      destinationCityId: '',
      originAddress: '',
      destinationAddress: '',
      charterDate: new Date().toISOString().split('T')[0],
      durationDays: '1',
      totalVehicles: '1',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      notes: '',
      paymentMethod: 'TRANSFER'
    });
  };

  const openWhatsApp = (phone, code, name) => {
    if (!phone) return;
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    const msg = `Halo ${name || 'Pelanggan'}, kami dari Admin Travel Shuttle mengenai booking charter armada (${code}).`;
    Linking.openURL(`https://wa.me/${clean}?text=${encodeURIComponent(msg)}`).catch(() => {
      Alert.alert('Error', 'Aplikasi WhatsApp tidak dapat dibuka.');
    });
  };

  const formatRupiah = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

  const getStatusBadgeStyle = (st) => {
    switch (st) {
      case 'PAID':
      case 'CONFIRMED':
        return { bg: '#dcfce7', text: '#15803d', label: st === 'PAID' ? 'SUDAH BAYAR' : 'TERKONFIRMASI' };
      case 'PENDING':
        return { bg: '#fef3c7', text: '#b45309', label: 'MENUNGGU BAYAR' };
      case 'PROCESSED':
        return { bg: '#e0e7ff', text: '#4338ca', label: 'DIPROSES' };
      case 'COMPLETED':
        return { bg: '#f3e8ff', text: '#7e22ce', label: 'SELESAI' };
      case 'CANCELLED':
        return { bg: '#fee2e2', text: '#b91c1c', label: 'DIBATALKAN' };
      default:
        return { bg: '#f1f5f9', text: '#475569', label: st || 'DRAFT' };
    }
  };

  const filteredCharters = charters.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (c.charterCode && c.charterCode.toLowerCase().includes(term)) ||
      (c.customerName && c.customerName.toLowerCase().includes(term)) ||
      (c.customerPhone && c.customerPhone.toLowerCase().includes(term)) ||
      (c.originAddress && c.originAddress.toLowerCase().includes(term)) ||
      (c.destinationAddress && c.destinationAddress.toLowerCase().includes(term))
    );
  });

  const totalCount = charters.length;
  const pendingCount = charters.filter(c => c.status === 'PENDING').length;
  const activeCount = charters.filter(c => c.status === 'PAID' || c.status === 'CONFIRMED' || c.status === 'PROCESSED').length;
  const totalRevenue = charters.filter(c => c.status !== 'CANCELLED').reduce((sum, c) => sum + (c.totalPrice || 0), 0);

  return (
    <View style={styles.container}>
      {/* SCREEN HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.btnBack} onPress={onBack}>
          <Ionicons name="arrow-back-outline" size={20} color={COLORS.secondary} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Charter & Sewa Mobil</Text>
          <Text style={styles.headerSub}>Kelola Pemesanan Charter Mobil Utuh</Text>
        </View>

        <TouchableOpacity style={styles.btnAdd} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add-outline" size={18} color="#ffffff" />
          <Text style={styles.btnAddText}>Buat</Text>
        </TouchableOpacity>
      </View>

      {/* METRIC SUMMARY */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statVal}>{totalCount}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={[styles.statVal, { color: COLORS.warning }]}>{pendingCount}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={[styles.statVal, { color: COLORS.accent }]}>{activeCount}</Text>
          <Text style={styles.statLabel}>Aktif</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={[styles.statValSmall, { color: COLORS.primary }]}>{formatRupiah(totalRevenue)}</Text>
          <Text style={styles.statLabel}>Omset</Text>
        </View>
      </View>

      {/* SEARCH & STATUS CHIP FILTER */}
      <View style={styles.filterSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari kode, nama, alamat..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            onSubmitEditing={handleSearch}
          />
          {searchTerm !== '' && (
            <TouchableOpacity onPress={() => { setSearchTerm(''); fetchCharters(); }}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {['ALL', 'PENDING', 'PAID', 'PROCESSED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.chip, statusFilter === st && styles.chipActive]}
              onPress={() => setStatusFilter(st)}
            >
              <Text style={[styles.chipText, statusFilter === st && styles.chipActiveText]}>
                {st === 'ALL' ? 'Semua' : st}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* CHARTER CARDS LIST */}
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        >
          {filteredCharters.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="bus-outline" size={42} color={COLORS.textLight} />
              <Text style={styles.emptyText}>Tidak ada data charter armada ditemukan.</Text>
            </View>
          ) : (
            filteredCharters.map((c) => {
              const statusStyle = getStatusBadgeStyle(c.status);
              return (
                <View key={c.id} style={styles.charterCard}>
                  {/* CARD HEADER */}
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.charterCode}>{c.charterCode}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
                        {statusStyle.label}
                      </Text>
                    </View>
                  </View>

                  {/* VEHICLE & CUSTOMER INFO */}
                  <View style={styles.infoRow}>
                    <Ionicons name="car-sport-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.infoText}>
                      Armada: <Text style={styles.boldText}>{c.vehicle?.vehicleType || 'Unit Shuttle'}</Text> ({c.vehicle?.plateNumber || '-'})
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Ionicons name="person-outline" size={16} color={COLORS.secondary} />
                    <Text style={styles.infoText}>
                      Pemesan: <Text style={styles.boldText}>{c.customerName}</Text>
                    </Text>
                    <TouchableOpacity
                      style={styles.btnWaInline}
                      onPress={() => openWhatsApp(c.customerPhone, c.charterCode, c.customerName)}
                    >
                      <Ionicons name="logo-whatsapp" size={14} color="#16a34a" />
                      <Text style={styles.btnWaText}>{c.customerPhone}</Text>
                    </TouchableOpacity>
                  </View>

                  {/* ROUTE / ADDRESSES */}
                  <View style={styles.addressBox}>
                    <View style={styles.addressLine}>
                      <Ionicons name="location-outline" size={14} color="#2563eb" />
                      <Text style={styles.addressText} numberOfLines={1}>
                        Asal: {c.originAddress}
                      </Text>
                    </View>
                    <View style={styles.addressLine}>
                      <Ionicons name="flag-outline" size={14} color="#ef4444" />
                      <Text style={styles.addressText} numberOfLines={1}>
                        Tujuan: {c.destinationAddress}
                      </Text>
                    </View>
                  </View>

                  {/* FOOTER & ACTIONS */}
                  <View style={styles.cardFooterRow}>
                    <View>
                      <Text style={styles.detailMeta}>
                        📅 {c.charterDate ? new Date(c.charterDate).toLocaleDateString('id-ID') : '-'} ({c.durationDays || 1} Hari, {c.totalVehicles || 1} Unit)
                      </Text>
                      <Text style={styles.priceText}>{formatRupiah(c.totalPrice)}</Text>
                    </View>

                    <View style={styles.actionBtnGroup}>
                      <TouchableOpacity
                        style={styles.btnDetail}
                        onPress={() => {
                          setSelectedCharter(c);
                          setShowDetailModal(true);
                        }}
                      >
                        <Ionicons name="eye-outline" size={14} color={COLORS.primary} />
                        <Text style={styles.btnDetailText}>Detail</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.btnDelete}
                        onPress={() => handleDeleteCharter(c.id, c.charterCode)}
                      >
                        <Ionicons name="trash-outline" size={14} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* MODAL DETAIL & STATUS UPDATE */}
      <Modal visible={showDetailModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detail Charter Armada</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close-outline" size={24} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>

            {selectedCharter && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ padding: 16 }}>
                <Text style={styles.charterCodeTitle}>{selectedCharter.charterCode}</Text>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionHeading}>Informasi Pemesan</Text>
                  <Text style={styles.detailRowText}>Nama: {selectedCharter.customerName}</Text>
                  <Text style={styles.detailRowText}>No. HP / WA: {selectedCharter.customerPhone}</Text>
                  <Text style={styles.detailRowText}>Email: {selectedCharter.customerEmail || '-'}</Text>
                  <TouchableOpacity
                    style={styles.btnWaFull}
                    onPress={() => openWhatsApp(selectedCharter.customerPhone, selectedCharter.charterCode, selectedCharter.customerName)}
                  >
                    <Ionicons name="logo-whatsapp" size={16} color="#ffffff" />
                    <Text style={styles.btnWaFullText}>Chat WhatsApp Pemesan</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionHeading}>Detail Perjalanan & Armada</Text>
                  <Text style={styles.detailRowText}>Armada: {selectedCharter.vehicle?.vehicleType || 'Unit Shuttle'} ({selectedCharter.vehicle?.plateNumber || '-'})</Text>
                  <Text style={styles.detailRowText}>Tanggal Charter: {selectedCharter.charterDate ? new Date(selectedCharter.charterDate).toLocaleDateString('id-ID') : '-'}</Text>
                  <Text style={styles.detailRowText}>Durasi: {selectedCharter.durationDays} Hari | Jumlah: {selectedCharter.totalVehicles} Unit</Text>
                  <Text style={styles.detailRowText}>Alamat Penjemputan: {selectedCharter.originAddress}</Text>
                  <Text style={styles.detailRowText}>Alamat Tujuan: {selectedCharter.destinationAddress}</Text>
                  <Text style={styles.detailRowText}>Catatan: {selectedCharter.notes || '-'}</Text>
                  <Text style={styles.detailPriceText}>Total Biaya: {formatRupiah(selectedCharter.totalPrice)}</Text>
                </View>

                {selectedCharter.paymentProofUrl && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionHeading}>Bukti Pembayaran</Text>
                    <Image
                      source={{ uri: getImageUrl(selectedCharter.paymentProofUrl) }}
                      style={styles.paymentProofImg}
                      resizeMode="cover"
                    />
                  </View>
                )}

                <View style={styles.detailSection}>
                  <Text style={styles.sectionHeading}>Ubah Status Charter</Text>
                  <View style={styles.statusGridBtn}>
                    {['PENDING', 'PAID', 'PROCESSED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((st) => (
                      <TouchableOpacity
                        key={st}
                        style={[
                          styles.btnStatusSelect,
                          selectedCharter.status === st && styles.btnStatusSelectActive
                        ]}
                        onPress={() => handleUpdateStatus(selectedCharter.id, st)}
                        disabled={submitting}
                      >
                        <Text style={[
                          styles.btnStatusSelectText,
                          selectedCharter.status === st && styles.btnStatusSelectActiveText
                        ]}>
                          {st}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL BUAT CHARTER BARU */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Buat Pemesanan Charter</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close-outline" size={24} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ padding: 16 }}>
              <Text style={styles.fieldLabel}>Pilih Armada / Kendaraan *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {vehicles.map((v) => (
                  <TouchableOpacity
                    key={v.id}
                    style={[styles.vChip, form.vehicleId === v.id && styles.vChipActive]}
                    onPress={() => setForm({ ...form, vehicleId: v.id })}
                  >
                    <Text style={[styles.vChipText, form.vehicleId === v.id && styles.vChipActiveText]}>
                      {v.vehicleType} ({v.plateNumber})
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.fieldLabel}>Nama Pemesan *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="cth. Budi Santoso"
                value={form.customerName}
                onChangeText={(val) => setForm({ ...form, customerName: val })}
              />

              <Text style={styles.fieldLabel}>No. WhatsApp / HP *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="cth. 08123456789"
                keyboardType="phone-pad"
                value={form.customerPhone}
                onChangeText={(val) => setForm({ ...form, customerPhone: val })}
              />

              <Text style={styles.fieldLabel}>Alamat Penjemputan *</Text>
              <TextInput
                style={[styles.modalInput, { height: 60 }]}
                placeholder="Alamat asal/penjemputan lengkap..."
                multiline
                value={form.originAddress}
                onChangeText={(val) => setForm({ ...form, originAddress: val })}
              />

              <Text style={styles.fieldLabel}>Alamat Tujuan *</Text>
              <TextInput
                style={[styles.modalInput, { height: 60 }]}
                placeholder="Alamat tujuan charter lengkap..."
                multiline
                value={form.destinationAddress}
                onChangeText={(val) => setForm({ ...form, destinationAddress: val })}
              />

              <View style={styles.rowForm}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Tanggal (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={form.charterDate}
                    onChangeText={(val) => setForm({ ...form, charterDate: val })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Durasi (Hari)</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="number-pad"
                    value={form.durationDays}
                    onChangeText={(val) => setForm({ ...form, durationDays: val })}
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Jumlah Unit Kendaraan</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="number-pad"
                value={form.totalVehicles}
                onChangeText={(val) => setForm({ ...form, totalVehicles: val })}
              />

              <Text style={styles.fieldLabel}>Catatan Tambahan</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Catatan khusus..."
                value={form.notes}
                onChangeText={(val) => setForm({ ...form, notes: val })}
              />

              <TouchableOpacity
                style={[styles.btnSubmit, submitting && styles.btnDisabled]}
                onPress={handleCreateCharter}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.btnSubmitText}>Simpan Pemesanan Charter</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12
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
  btnAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12
  },
  btnAddText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700'
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 12
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
  statValSmall: {
    fontSize: 11,
    fontWeight: '800'
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textMuted
  },
  filterSection: {
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 10
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
  chipScroll: {
    flexDirection: 'row'
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 6
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
  charterCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
    ...SHADOWS.small
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  charterCode: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800'
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  infoText: {
    fontSize: 12,
    color: COLORS.secondary
  },
  boldText: {
    fontWeight: '700'
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
  addressBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 8,
    gap: 4
  },
  addressLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  addressText: {
    fontSize: 11,
    color: COLORS.secondary,
    flex: 1
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.inputBg
  },
  detailMeta: {
    fontSize: 11,
    color: COLORS.textMuted
  },
  priceText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.accentDark
  },
  actionBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  btnDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10
  },
  btnDetailText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary
  },
  btnDelete: {
    backgroundColor: '#fee2e2',
    padding: 6,
    borderRadius: 10
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.secondary
  },
  charterCodeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 12
  },
  detailSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 6
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.secondary,
    textTransform: 'uppercase',
    marginBottom: 4
  },
  detailRowText: {
    fontSize: 12,
    color: COLORS.secondary
  },
  detailPriceText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.accentDark,
    marginTop: 4
  },
  btnWaFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#16a34a',
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 6
  },
  btnWaFullText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12
  },
  paymentProofImg: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    marginTop: 6
  },
  statusGridBtn: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6
  },
  btnStatusSelect: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#cbd5e1'
  },
  btnStatusSelectActive: {
    backgroundColor: COLORS.primary
  },
  btnStatusSelectText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.secondary
  },
  btnStatusSelectActiveText: {
    color: '#ffffff'
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: 4,
    marginTop: 8
  },
  modalInput: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.secondary,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  rowForm: {
    flexDirection: 'row',
    gap: 10
  },
  vChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.inputBg,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  vChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  vChipText: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: '600'
  },
  vChipActiveText: {
    color: '#ffffff'
  },
  btnSubmit: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30
  },
  btnDisabled: {
    opacity: 0.6
  },
  btnSubmitText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800'
  }
});
