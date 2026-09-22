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

export default function MasterDriverScreen() {
  const [drivers, setDrivers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [userId, setUserId] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [dRes, uRes] = await Promise.all([
        masterService.getDrivers(),
        masterService.getAvailableDriverUsers()
      ]);
      setDrivers(dRes.data || []);
      setAvailableUsers(uRes.data || []);
    } catch (err) {
      console.error('Error fetching drivers master:', err);
      setError('Gagal memuat data driver master.');
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
    setUserId(availableUsers[0]?.id || '');
    setLicenseNumber('SIM-' + Math.floor(100000 + Math.random() * 900000));
    setStatus('ACTIVE');
    setShowModal(true);
  };

  const handleOpenEdit = (driver) => {
    setEditId(driver.id);
    setUserId(driver.userId);
    setLicenseNumber(driver.licenseNumber || '');
    setStatus(driver.status || 'ACTIVE');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!licenseNumber.trim()) {
      Alert.alert('Peringatan', 'Nomor SIM Pengemudi wajib diisi.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        userId: userId || undefined,
        licenseNumber: licenseNumber.trim().toUpperCase(),
        status
      };

      if (editId) {
        await masterService.updateDriver(editId, payload);
        setSuccess('Data driver berhasil diperbarui!');
      } else {
        if (!userId) {
          Alert.alert('Peringatan', 'Pilih akun pengguna user untuk ditugaskan sebagai driver.');
          setSubmitting(false);
          return;
        }
        await masterService.createDriver(payload);
        setSuccess('Driver baru berhasil ditambahkan!');
      }

      setShowModal(false);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving driver:', err);
      Alert.alert('Gagal', err.response?.data?.error || 'Gagal menyimpan data pengemudi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (driver) => {
    const driverName = driver.user?.name || 'Driver';

    Alert.alert(
      'Hapus Driver',
      `Apakah Anda yakin ingin menghapus data driver "${driverName}" (${driver.licenseNumber})?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await masterService.deleteDriver(driver.id);
              setSuccess(`Driver ${driverName} berhasil dihapus.`);
              fetchData();
              setTimeout(() => setSuccess(''), 3000);
            } catch (err) {
              console.error('Error deleting driver:', err);
              Alert.alert('Gagal Hapus', err.response?.data?.error || 'Driver ini terikat dengan jadwal perjalanan.');
            }
          }
        }
      ]
    );
  };

  const filteredDrivers = drivers.filter((d) => {
    const q = search.toLowerCase();
    const name = (d.user?.name || '').toLowerCase();
    const sim = (d.licenseNumber || '').toLowerCase();
    const phone = (d.user?.phone || '').toLowerCase();
    return name.includes(q) || sim.includes(q) || phone.includes(q);
  });

  return (
    <View style={styles.container}>
      {/* Search & Action Toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari driver atau no. SIM..."
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
          <Text style={styles.btnAddText}>Tambah Driver</Text>
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
            <Text style={styles.loadingText}>Memuat master driver...</Text>
          </View>
        ) : filteredDrivers.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="person-outline" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>Driver Tidak Ditemukan</Text>
            <Text style={styles.emptySubtitle}>Belum ada data pengemudi master atau sesuai pencarian Anda.</Text>
          </View>
        ) : (
          filteredDrivers.map((driver, idx) => {
            const isInactive = driver.status === 'INACTIVE';
            const name = driver.user?.name || 'Driver Pengemudi';
            const phone = driver.user?.phone || 'No. Telp Belum Diatur';

            return (
              <View key={driver.id || idx} style={styles.driverCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.driverAvatar}>
                    <Ionicons name="person" size={20} color={COLORS.primary} />
                  </View>

                  <View style={styles.driverNameCol}>
                    <Text style={styles.driverName}>{name}</Text>
                    <Text style={styles.driverPhone}>📞 {phone}</Text>
                  </View>

                  <View style={[styles.statusBadge, isInactive ? styles.statusInactive : styles.statusActive]}>
                    <Text style={[styles.statusText, isInactive ? styles.statusTextInactive : styles.statusTextActive]}>
                      {isInactive ? 'Non-Aktif' : '✓ Aktif'}
                    </Text>
                  </View>
                </View>

                <View style={styles.simBox}>
                  <Text style={styles.simLabel}>Nomor SIM Pengemudi:</Text>
                  <Text style={styles.simValue}>{driver.licenseNumber || '-'}</Text>
                </View>

                <View style={styles.cardFooter}>
                  <TouchableOpacity style={styles.btnEdit} onPress={() => handleOpenEdit(driver)}>
                    <Ionicons name="create-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.btnEditText}>Edit SIM</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.btnDelete} onPress={() => handleDelete(driver)}>
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
          <View style={styles.modalForm}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editId ? 'Edit SIM Pengemudi' : 'Tambah Driver Baru'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={20} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>

            {/* Select Available User Account (only when creating) */}
            {!editId ? (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Pilih Akun User Pengemudi *</Text>
                {availableUsers.length === 0 ? (
                  <Text style={styles.noUserHint}>⚠️ Tidak ada akun user dengan role DRIVER yang belum ditugaskan.</Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.userChipsRow}>
                    {availableUsers.map((u) => (
                      <TouchableOpacity
                        key={u.id}
                        style={[styles.userChip, userId === u.id && styles.userChipActive]}
                        onPress={() => setUserId(u.id)}
                      >
                        <Text style={[styles.userChipText, userId === u.id && styles.userChipTextActive]}>
                          {u.name} ({u.email})
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            ) : null}

            <View style={styles.formGroup}>
              <Text style={styles.label}>Nomor SIM Pengemudi (Lisensi) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Contoh: SIM-123456789"
                value={licenseNumber}
                onChangeText={setLicenseNumber}
                autoCapitalize="characters"
                placeholderTextColor={COLORS.textLight}
              />
            </View>

            {/* Status Choice */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Status Pengemudi</Text>
              <View style={styles.radioRow}>
                <TouchableOpacity
                  style={[styles.radioChip, status === 'ACTIVE' && styles.radioActive]}
                  onPress={() => setStatus('ACTIVE')}
                >
                  <Text style={[styles.radioText, status === 'ACTIVE' && styles.radioTextActive]}>ACTIVE</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.radioChip, status === 'INACTIVE' && styles.radioInactive]}
                  onPress={() => setStatus('INACTIVE')}
                >
                  <Text style={[styles.radioText, status === 'INACTIVE' && styles.radioTextActive]}>INACTIVE</Text>
                </TouchableOpacity>
              </View>
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
                  <Text style={styles.btnSaveText}>{editId ? 'Simpan Perubahan' : 'Tambah Driver'}</Text>
                )}
              </TouchableOpacity>
            </View>
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
  driverCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
    ...SHADOWS.small
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  driverNameCol: {
    flex: 1
  },
  driverName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.secondary
  },
  driverPhone: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusActive: {
    backgroundColor: '#dcfce7'
  },
  statusInactive: {
    backgroundColor: '#fef2f2'
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700'
  },
  statusTextActive: {
    color: COLORS.accentDark
  },
  statusTextInactive: {
    color: COLORS.danger
  },
  simBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  simLabel: {
    fontSize: 12,
    color: COLORS.textMuted
  },
  simValue: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    paddingTop: 4
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
    gap: 14,
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
  noUserHint: {
    fontSize: 11,
    color: COLORS.danger
  },
  userChipsRow: {
    gap: 6,
    paddingVertical: 4
  },
  userChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: COLORS.border
  },
  userChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  userChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondary
  },
  userChipTextActive: {
    color: '#ffffff'
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
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
  radioInactive: {
    backgroundColor: COLORS.danger,
    borderColor: COLORS.danger
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
