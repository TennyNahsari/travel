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
import { packageService, scheduleService, getImageUrl } from '../services/api';

export default function PengirimanPaketScreen({ onBack }) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal States
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State for New Package
  const [schedules, setSchedules] = useState([]);
  const [form, setForm] = useState({
    scheduleId: '',
    senderName: '',
    senderPhone: '',
    senderAddress: '',
    recipientName: '',
    recipientPhone: '',
    recipientAddress: '',
    packageDescription: '',
    itemCount: '1',
    weightKg: '1',
    notes: '',
    paymentMethod: 'TRANSFER'
  });

  useEffect(() => {
    fetchPackages();
    fetchSchedules();
  }, [statusFilter]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;

      const res = await packageService.getPackages(params);
      setPackages(res.data || []);
    } catch (err) {
      console.error('Error fetching packages:', err);
      Alert.alert('Error', 'Gagal mengambil data pengiriman paket.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      const res = await scheduleService.getSchedules({ limit: 30 });
      if (res.data) setSchedules(res.data);
    } catch (err) {
      console.error('Error fetching schedules:', err);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPackages();
  };

  const handleSearch = () => {
    fetchPackages();
  };

  const handleUpdateStatus = async (pkgId, newStatus) => {
    try {
      setSubmitting(true);
      await packageService.updatePackageStatus(pkgId, newStatus);
      Alert.alert('Sukses', `Status paket berhasil diubah ke ${newStatus}`);
      if (selectedPackage && selectedPackage.id === pkgId) {
        setSelectedPackage(prev => prev ? { ...prev, status: newStatus } : null);
      }
      fetchPackages();
    } catch (err) {
      console.error('Update package status error:', err);
      Alert.alert('Error', err.response?.data?.error || 'Gagal mengubah status paket.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePackage = async (pkgId, packageCode) => {
    Alert.alert(
      'Konfirmasi Hapus',
      `Apakah Anda yakin ingin menghapus data pengiriman paket ${packageCode}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await packageService.deletePackage(pkgId);
              Alert.alert('Sukses', 'Data pengiriman paket berhasil dihapus.');
              if (showDetailModal && selectedPackage?.id === pkgId) {
                setShowDetailModal(false);
              }
              fetchPackages();
            } catch (err) {
              console.error('Delete package error:', err);
              Alert.alert('Error', 'Gagal menghapus data paket.');
            }
          }
        }
      ]
    );
  };

  const handleCreatePackage = async () => {
    if (!form.scheduleId) return Alert.alert('Peringatan', 'Pilih jadwal keberangkatan terlebih dahulu.');
    if (!form.senderName.trim()) return Alert.alert('Peringatan', 'Nama pengirim wajib diisi.');
    if (!form.senderPhone.trim()) return Alert.alert('Peringatan', 'No. WhatsApp pengirim wajib diisi.');
    if (!form.recipientName.trim()) return Alert.alert('Peringatan', 'Nama penerima wajib diisi.');
    if (!form.recipientPhone.trim()) return Alert.alert('Peringatan', 'No. WhatsApp penerima wajib diisi.');
    if (!form.recipientAddress.trim()) return Alert.alert('Peringatan', 'Alamat tujuan penerima wajib diisi.');
    if (!form.packageDescription.trim()) return Alert.alert('Peringatan', 'Deskripsi barang/paket wajib diisi.');

    try {
      setSubmitting(true);
      await packageService.createPackage({
        ...form,
        itemCount: parseInt(form.itemCount, 10) || 1,
        weightKg: parseInt(form.weightKg, 10) || 1
      });
      Alert.alert('Sukses', 'Pemesanan pengiriman paket berhasil dibuat!');
      setShowAddModal(false);
      resetForm();
      fetchPackages();
    } catch (err) {
      console.error('Create package error:', err);
      Alert.alert('Gagal', err.response?.data?.error || 'Gagal membuat pengiriman paket.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({
      scheduleId: '',
      senderName: '',
      senderPhone: '',
      senderAddress: '',
      recipientName: '',
      recipientPhone: '',
      recipientAddress: '',
      packageDescription: '',
      itemCount: '1',
      weightKg: '1',
      notes: '',
      paymentMethod: 'TRANSFER'
    });
  };

  const openWhatsApp = (phone, code, name, role) => {
    if (!phone) return;
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    const msg = `Halo ${name || 'Pelanggan'} (${role}), kami dari Admin Travel Shuttle mengenai pengiriman paket (${code}).`;
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
        return { bg: '#e0e7ff', text: '#4338ca', label: 'DIPROSES / DIKIRIM' };
      case 'COMPLETED':
        return { bg: '#f3e8ff', text: '#7e22ce', label: 'SELESAI' };
      case 'CANCELLED':
        return { bg: '#fee2e2', text: '#b91c1c', label: 'DIBATALKAN' };
      default:
        return { bg: '#f1f5f9', text: '#475569', label: st || 'DRAFT' };
    }
  };

  const filteredPackages = packages.filter((p) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (p.packageCode && p.packageCode.toLowerCase().includes(term)) ||
      (p.senderName && p.senderName.toLowerCase().includes(term)) ||
      (p.recipientName && p.recipientName.toLowerCase().includes(term)) ||
      (p.packageDescription && p.packageDescription.toLowerCase().includes(term))
    );
  });

  const totalCount = packages.length;
  const pendingCount = packages.filter(p => p.status === 'PENDING').length;
  const processedCount = packages.filter(p => p.status === 'PROCESSED' || p.status === 'PAID' || p.status === 'CONFIRMED').length;
  const totalRevenue = packages.filter(p => p.status !== 'CANCELLED').reduce((sum, p) => sum + (p.totalPrice || 0), 0);

  return (
    <View style={styles.container}>
      {/* SCREEN HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.btnBack} onPress={onBack}>
          <Ionicons name="arrow-back-outline" size={20} color={COLORS.secondary} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Pengiriman Paket & Kargo</Text>
          <Text style={styles.headerSub}>Kelola Ekspedisi Paket Kiriman Shuttle</Text>
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
          <Text style={[styles.statVal, { color: COLORS.primary }]}>{processedCount}</Text>
          <Text style={styles.statLabel}>Proses</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={[styles.statValSmall, { color: COLORS.accent }]}>{formatRupiah(totalRevenue)}</Text>
          <Text style={styles.statLabel}>Omset</Text>
        </View>
      </View>

      {/* SEARCH & STATUS CHIP FILTER */}
      <View style={styles.filterSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari kode tracking, pengirim, barang..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            onSubmitEditing={handleSearch}
          />
          {searchTerm !== '' && (
            <TouchableOpacity onPress={() => { setSearchTerm(''); fetchPackages(); }}>
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

      {/* PACKAGE CARDS LIST */}
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        >
          {filteredPackages.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="cube-outline" size={42} color={COLORS.textLight} />
              <Text style={styles.emptyText}>Tidak ada data pengiriman paket ditemukan.</Text>
            </View>
          ) : (
            filteredPackages.map((pkg) => {
              const statusStyle = getStatusBadgeStyle(pkg.status);
              const routeStr = pkg.schedule?.route
                ? `${pkg.schedule.route.originCity?.name || ''} → ${pkg.schedule.route.destinationCity?.name || ''}`
                : 'Jadwal Perjalanan';

              return (
                <View key={pkg.id} style={styles.pkgCard}>
                  {/* CARD HEADER */}
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.pkgCode}>{pkg.packageCode}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
                        {statusStyle.label}
                      </Text>
                    </View>
                  </View>

                  {/* PACKAGE DESCRIPTION */}
                  <View style={styles.descBox}>
                    <Ionicons name="cube-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.descText} numberOfLines={1}>
                      📦 {pkg.packageDescription}
                    </Text>
                  </View>

                  {/* SENDER & RECIPIENT */}
                  <View style={styles.contactRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.contactLabel}>Pengirim:</Text>
                      <Text style={styles.contactName}>{pkg.senderName}</Text>
                      <TouchableOpacity
                        style={styles.btnWaInline}
                        onPress={() => openWhatsApp(pkg.senderPhone, pkg.packageCode, pkg.senderName, 'Pengirim')}
                      >
                        <Ionicons name="logo-whatsapp" size={12} color="#16a34a" />
                        <Text style={styles.btnWaText}>{pkg.senderPhone}</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.contactLabel}>Penerima:</Text>
                      <Text style={styles.contactName}>{pkg.recipientName}</Text>
                      <TouchableOpacity
                        style={styles.btnWaInline}
                        onPress={() => openWhatsApp(pkg.recipientPhone, pkg.packageCode, pkg.recipientName, 'Penerima')}
                      >
                        <Ionicons name="logo-whatsapp" size={12} color="#16a34a" />
                        <Text style={styles.btnWaText}>{pkg.recipientPhone}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* ROUTE & WEIGHT META */}
                  <View style={styles.metaBox}>
                    <Text style={styles.metaRouteText}>📍 {routeStr}</Text>
                    <Text style={styles.metaWeightText}>
                      ⚖️ {pkg.weightKg || 1} Kg | 📦 {pkg.itemCount || 1} Unit
                    </Text>
                  </View>

                  {/* FOOTER & ACTIONS */}
                  <View style={styles.cardFooterRow}>
                    <Text style={styles.priceText}>{formatRupiah(pkg.totalPrice)}</Text>

                    <View style={styles.actionBtnGroup}>
                      <TouchableOpacity
                        style={styles.btnDetail}
                        onPress={() => {
                          setSelectedPackage(pkg);
                          setShowDetailModal(true);
                        }}
                      >
                        <Ionicons name="eye-outline" size={14} color={COLORS.primary} />
                        <Text style={styles.btnDetailText}>Detail</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.btnDelete}
                        onPress={() => handleDeletePackage(pkg.id, pkg.packageCode)}
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
              <Text style={styles.modalTitle}>Detail Pengiriman Paket</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close-outline" size={24} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>

            {selectedPackage && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ padding: 16 }}>
                <Text style={styles.pkgCodeTitle}>{selectedPackage.packageCode}</Text>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionHeading}>Deskripsi Barang</Text>
                  <Text style={styles.detailRowText}>📦 {selectedPackage.packageDescription}</Text>
                  <Text style={styles.detailRowText}>Berat: {selectedPackage.weightKg} Kg | Jumlah: {selectedPackage.itemCount} Paket</Text>
                  <Text style={styles.detailPriceText}>Total Ongkir: {formatRupiah(selectedPackage.totalPrice)}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionHeading}>Informasi Pengirim</Text>
                  <Text style={styles.detailRowText}>Nama: {selectedPackage.senderName}</Text>
                  <Text style={styles.detailRowText}>No. HP: {selectedPackage.senderPhone}</Text>
                  <Text style={styles.detailRowText}>Alamat: {selectedPackage.senderAddress || '-'}</Text>
                  <TouchableOpacity
                    style={styles.btnWaFull}
                    onPress={() => openWhatsApp(selectedPackage.senderPhone, selectedPackage.packageCode, selectedPackage.senderName, 'Pengirim')}
                  >
                    <Ionicons name="logo-whatsapp" size={16} color="#ffffff" />
                    <Text style={styles.btnWaFullText}>Chat WhatsApp Pengirim</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionHeading}>Informasi Penerima</Text>
                  <Text style={styles.detailRowText}>Nama: {selectedPackage.recipientName}</Text>
                  <Text style={styles.detailRowText}>No. HP: {selectedPackage.recipientPhone}</Text>
                  <Text style={styles.detailRowText}>Alamat Tujuan: {selectedPackage.recipientAddress}</Text>
                  <TouchableOpacity
                    style={styles.btnWaFull}
                    onPress={() => openWhatsApp(selectedPackage.recipientPhone, selectedPackage.packageCode, selectedPackage.recipientName, 'Penerima')}
                  >
                    <Ionicons name="logo-whatsapp" size={16} color="#ffffff" />
                    <Text style={styles.btnWaFullText}>Chat WhatsApp Penerima</Text>
                  </TouchableOpacity>
                </View>

                {selectedPackage.paymentProofUrl && (
                  <View style={styles.detailSection}>
                    <Text style={styles.sectionHeading}>Bukti Pembayaran</Text>
                    <Image
                      source={{ uri: getImageUrl(selectedPackage.paymentProofUrl) }}
                      style={styles.paymentProofImg}
                      resizeMode="cover"
                    />
                  </View>
                )}

                <View style={styles.detailSection}>
                  <Text style={styles.sectionHeading}>Ubah Status Pengiriman</Text>
                  <View style={styles.statusGridBtn}>
                    {['PENDING', 'PAID', 'PROCESSED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((st) => (
                      <TouchableOpacity
                        key={st}
                        style={[
                          styles.btnStatusSelect,
                          selectedPackage.status === st && styles.btnStatusSelectActive
                        ]}
                        onPress={() => handleUpdateStatus(selectedPackage.id, st)}
                        disabled={submitting}
                      >
                        <Text style={[
                          styles.btnStatusSelectText,
                          selectedPackage.status === st && styles.btnStatusSelectActiveText
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

      {/* MODAL BUAT PENGIRIMAN PAKET BARU */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Buat Pengiriman Paket Baru</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close-outline" size={24} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ padding: 16 }}>
              <Text style={styles.fieldLabel}>Pilih Jadwal Keberangkatan Shuttle *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {schedules.map((s) => {
                  const label = `${s.route?.originCity?.name || ''} → ${s.route?.destinationCity?.name || ''} (${new Date(s.departureDate).toLocaleDateString('id-ID')} ${s.departureTime})`;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.sChip, form.scheduleId === s.id && styles.sChipActive]}
                      onPress={() => setForm({ ...form, scheduleId: s.id })}
                    >
                      <Text style={[styles.sChipText, form.scheduleId === s.id && styles.sChipActiveText]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={styles.fieldLabel}>Deskripsi Barang / Paket *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="cth. Dokumen Penting & Dus Pakaian"
                value={form.packageDescription}
                onChangeText={(val) => setForm({ ...form, packageDescription: val })}
              />

              <View style={styles.rowForm}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Berat (Kg) *</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="number-pad"
                    value={form.weightKg}
                    onChangeText={(val) => setForm({ ...form, weightKg: val })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Jumlah Koli / Unit</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="number-pad"
                    value={form.itemCount}
                    onChangeText={(val) => setForm({ ...form, itemCount: val })}
                  />
                </View>
              </View>

              <Text style={styles.sectionHeadingMargin}>Data Pengirim</Text>
              <Text style={styles.fieldLabel}>Nama Pengirim *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="cth. Andi Pratama"
                value={form.senderName}
                onChangeText={(val) => setForm({ ...form, senderName: val })}
              />

              <Text style={styles.fieldLabel}>No. WhatsApp Pengirim *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="cth. 08123456789"
                keyboardType="phone-pad"
                value={form.senderPhone}
                onChangeText={(val) => setForm({ ...form, senderPhone: val })}
              />

              <Text style={styles.fieldLabel}>Alamat Pengirim</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Alamat asal pengirim..."
                value={form.senderAddress}
                onChangeText={(val) => setForm({ ...form, senderAddress: val })}
              />

              <Text style={styles.sectionHeadingMargin}>Data Penerima</Text>
              <Text style={styles.fieldLabel}>Nama Penerima *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="cth. Rina Wati"
                value={form.recipientName}
                onChangeText={(val) => setForm({ ...form, recipientName: val })}
              />

              <Text style={styles.fieldLabel}>No. WhatsApp Penerima *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="cth. 08987654321"
                keyboardType="phone-pad"
                value={form.recipientPhone}
                onChangeText={(val) => setForm({ ...form, recipientPhone: val })}
              />

              <Text style={styles.fieldLabel}>Alamat Tujuan Penerima *</Text>
              <TextInput
                style={[styles.modalInput, { height: 60 }]}
                placeholder="Alamat lengkap penerima paket..."
                multiline
                value={form.recipientAddress}
                onChangeText={(val) => setForm({ ...form, recipientAddress: val })}
              />

              <TouchableOpacity
                style={[styles.btnSubmit, submitting && styles.btnDisabled]}
                onPress={handleCreatePackage}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.btnSubmitText}>Simpan Pengiriman Paket</Text>
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
  pkgCard: {
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
  pkgCode: {
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
  descBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 10
  },
  descText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary,
    flex: 1
  },
  contactRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 4
  },
  contactLabel: {
    fontSize: 10,
    color: COLORS.textMuted
  },
  contactName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary
  },
  btnWaInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 2
  },
  btnWaText: {
    fontSize: 9,
    color: '#15803d',
    fontWeight: '700'
  },
  metaBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10
  },
  metaRouteText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600'
  },
  metaWeightText: {
    fontSize: 11,
    color: COLORS.secondary,
    fontWeight: '700'
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.inputBg
  },
  priceText: {
    fontSize: 15,
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
  pkgCodeTitle: {
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
  sectionHeadingMargin: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 14,
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
  sChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.inputBg,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  sChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  sChipText: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: '600'
  },
  sChipActiveText: {
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
