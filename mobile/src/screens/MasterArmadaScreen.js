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
import { masterService } from '../services/api';

export default function MasterArmadaScreen() {
  const [vehicles, setVehicles] = useState([]);
  const [seatTemplates, setSeatTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [capacity, setCapacity] = useState('12');
  const [seatTemplateId, setSeatTemplateId] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [description, setDescription] = useState('');
  const [facilitiesText, setFacilitiesText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [vRes, tRes] = await Promise.all([
        masterService.getVehicles(),
        masterService.getSeatTemplates()
      ]);
      setVehicles(vRes.data || []);
      setSeatTemplates(tRes.data || []);
    } catch (err) {
      console.error('Error fetching vehicles master:', err);
      setError('Gagal memuat data armada master.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setPlateNumber('');
    setVehicleType('Toyota Hiace Premio');
    setCapacity('12');
    setSeatTemplateId(seatTemplates[0]?.id || '');
    setStatus('ACTIVE');
    setDescription('');
    setFacilitiesText('Full AC, Rec-Seat, USB Charger, Free WiFi');
    setShowModal(true);
  };

  const handleOpenEdit = (vehicle) => {
    setEditId(vehicle.id);
    setPlateNumber(vehicle.plateNumber);
    setVehicleType(vehicle.vehicleType);
    setCapacity(vehicle.capacity ? vehicle.capacity.toString() : '12');
    setSeatTemplateId(vehicle.seatTemplateId || '');
    setStatus(vehicle.status || 'ACTIVE');
    setDescription(vehicle.description || '');

    if (Array.isArray(vehicle.facilities)) {
      setFacilitiesText(vehicle.facilities.join(', '));
    } else if (typeof vehicle.facilities === 'string') {
      setFacilitiesText(vehicle.facilities);
    } else {
      setFacilitiesText('');
    }

    setShowModal(true);
  };

  const handleSave = async () => {
    if (!plateNumber.trim() || !vehicleType.trim()) {
      Alert.alert('Peringatan', 'Nomor Plat dan Tipe Mobil wajib diisi.');
      return;
    }

    try {
      setSubmitting(true);
      const facilitiesArray = facilitiesText
        ? facilitiesText.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      const payload = {
        plateNumber: plateNumber.trim().toUpperCase(),
        vehicleType: vehicleType.trim(),
        capacity: capacity ? parseInt(capacity) : 12,
        seatTemplateId: seatTemplateId || null,
        status,
        description: description.trim(),
        facilities: facilitiesArray
      };

      if (editId) {
        await masterService.updateVehicle(editId, payload);
        setSuccess('Data armada berhasil diperbarui!');
      } else {
        await masterService.createVehicle(payload);
        setSuccess('Armada baru berhasil ditambahkan!');
      }

      setShowModal(false);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving vehicle:', err);
      Alert.alert('Gagal', err.response?.data?.error || 'Gagal menyimpan data armada.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (vehicle) => {
    Alert.alert(
      'Hapus Armada',
      `Apakah Anda yakin ingin menghapus armada "${vehicle.vehicleType}" (${vehicle.plateNumber})?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await masterService.deleteVehicle(vehicle.id);
              setSuccess(`Armada ${vehicle.plateNumber} berhasil dihapus.`);
              fetchData();
              setTimeout(() => setSuccess(''), 3000);
            } catch (err) {
              console.error('Error deleting vehicle:', err);
              Alert.alert('Gagal Hapus', err.response?.data?.error || 'Armada ini terikat dengan data jadwal/booking.');
            }
          }
        }
      ]
    );
  };

  const filteredVehicles = vehicles.filter((v) => {
    const q = search.toLowerCase();
    const plate = (v.plateNumber || '').toLowerCase();
    const type = (v.vehicleType || '').toLowerCase();
    return plate.includes(q) || type.includes(q);
  });

  return (
    <View style={styles.container}>
      {/* Search & Action Toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari armada atau plat nomor..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={COLORS.textLight}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity style={styles.btnAdd} onPress={handleOpenAdd} activeOpacity={0.8}>
          <Ionicons name="add" size={20} color="#ffffff" />
          <Text style={styles.btnAddText}>Tambah Mobil</Text>
        </TouchableOpacity>
      </View>

      {/* Success Alert */}
      {success ? (
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.accentDark} />
          <Text style={styles.successBannerText}>{success}</Text>
        </View>
      ) : null}

      {/* List Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Memuat master armada...</Text>
          </View>
        ) : filteredVehicles.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="bus-outline" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>Armada Tidak Ditemukan</Text>
            <Text style={styles.emptySubtitle}>Belum ada data armada mobil master atau sesuai pencarian Anda.</Text>
          </View>
        ) : (
          filteredVehicles.map((v, idx) => {
            const isMaint = v.status === 'MAINTENANCE';

            return (
              <View key={v.id || idx} style={styles.vehicleCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.plateBadge}>
                    <Text style={styles.plateText}>{v.plateNumber}</Text>
                  </View>
                  <View style={[styles.statusBadge, isMaint ? styles.statusMaint : styles.statusActive]}>
                    <Text style={[styles.statusText, isMaint ? styles.statusTextMaint : styles.statusTextActive]}>
                      {isMaint ? '🛠️ Maintenance' : '✓ Siap Beroperasi'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.vehicleTitle}>{v.vehicleType}</Text>

                <View style={styles.infoRow}>
                  <View style={styles.infoTag}>
                    <Ionicons name="people-outline" size={14} color={COLORS.primary} />
                    <Text style={styles.infoTagText}>{v.capacity} Kursi</Text>
                  </View>

                  <View style={styles.infoTag}>
                    <Ionicons name="grid-outline" size={14} color={COLORS.primary} />
                    <Text style={styles.infoTagText}>
                      {v.seatTemplate?.name || 'Layout Standar'}
                    </Text>
                  </View>
                </View>

                {v.description ? (
                  <Text style={styles.descriptionText} numberOfLines={2}>
                    {v.description}
                  </Text>
                ) : null}

                <View style={styles.cardFooter}>
                  <TouchableOpacity style={styles.btnEdit} onPress={() => handleOpenEdit(v)}>
                    <Ionicons name="create-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.btnEditText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.btnDelete} onPress={() => handleDelete(v)}>
                    <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                    <Text style={styles.btnDeleteText}>Hapus</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* MODAL FORM ADD / EDIT */}
      <Modal visible={showModal} animationType="fade" transparent={true} onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <View style={styles.modalForm}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editId ? 'Edit Armada Mobil' : 'Tambah Mobil Armada'}</Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Ionicons name="close" size={20} color={COLORS.secondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Nomor Plat Kendaraan *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Contoh: B-1234-XYZ"
                  value={plateNumber}
                  onChangeText={setPlateNumber}
                  autoCapitalize="characters"
                  placeholderTextColor={COLORS.textLight}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Tipe / Nama Armada *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Contoh: Toyota Hiace Premio Executive"
                  value={vehicleType}
                  onChangeText={setVehicleType}
                  placeholderTextColor={COLORS.textLight}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Kapasitas Kursi Penumpang *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Contoh: 12"
                  keyboardType="numeric"
                  value={capacity}
                  onChangeText={setCapacity}
                  placeholderTextColor={COLORS.textLight}
                />
              </View>

              {/* Status Radio Choice */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Status Armada</Text>
                <View style={styles.radioRow}>
                  <TouchableOpacity
                    style={[styles.radioChip, status === 'ACTIVE' && styles.radioActive]}
                    onPress={() => setStatus('ACTIVE')}
                  >
                    <Text style={[styles.radioText, status === 'ACTIVE' && styles.radioTextActive]}>ACTIVE</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.radioChip, status === 'MAINTENANCE' && styles.radioMaint]}
                    onPress={() => setStatus('MAINTENANCE')}
                  >
                    <Text style={[styles.radioText, status === 'MAINTENANCE' && styles.radioTextActive]}>MAINTENANCE</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Fasilitas (Dipisahkan Koma)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="AC Premium, Reclining Seat, Free WiFi, USB"
                  value={facilitiesText}
                  onChangeText={setFacilitiesText}
                  placeholderTextColor={COLORS.textLight}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Deskripsi Singkat</Text>
                <TextInput
                  style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
                  placeholder="Deskripsi spesifikasi armada..."
                  multiline={true}
                  value={description}
                  onChangeText={setDescription}
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
                    <Text style={styles.btnSaveText}>{editId ? 'Simpan Perubahan' : 'Tambah Armada'}</Text>
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
  toolbar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  searchIcon: {
    marginRight: 6
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textMain
  },
  btnAdd: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    borderRadius: 12
  },
  btnAddText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700'
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
  vehicleCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
    ...SHADOWS.small
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  plateBadge: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  plateText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusActive: {
    backgroundColor: '#dcfce7'
  },
  statusMaint: {
    backgroundColor: '#fef3c7'
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700'
  },
  statusTextActive: {
    color: COLORS.accentDark
  },
  statusTextMaint: {
    color: '#b45309'
  },
  vehicleTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.secondary
  },
  infoRow: {
    flexDirection: 'row',
    gap: 10
  },
  infoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8
  },
  infoTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary
  },
  descriptionText: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  btnEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#eff6ff'
  },
  btnEditText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary
  },
  btnDelete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#fef2f2'
  },
  btnDeleteText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.danger
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
  input: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: COLORS.textMain
  },
  radioRow: {
    flexDirection: 'row',
    gap: 8
  },
  radioChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border
  },
  radioActive: {
    backgroundColor: COLORS.accentDark,
    borderColor: COLORS.accentDark
  },
  radioMaint: {
    backgroundColor: COLORS.warning,
    borderColor: COLORS.warning
  },
  radioText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary
  },
  radioTextActive: {
    color: '#ffffff'
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
