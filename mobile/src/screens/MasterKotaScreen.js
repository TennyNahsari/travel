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

export default function MasterKotaScreen({ onBack }) {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [province, setProvince] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await masterService.getCities();
      setCities(res.data || []);
    } catch (err) {
      console.error('Error fetching cities:', err);
      setError('Gagal memuat data kota master.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCities();
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setName('');
    setProvince('');
    setShowModal(true);
  };

  const handleOpenEdit = (city) => {
    setEditId(city.id);
    setName(city.name);
    setProvince(city.province || '');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Peringatan', 'Nama Kota wajib diisi.');
      return;
    }

    try {
      setSubmitting(true);
      if (editId) {
        await masterService.updateCity(editId, { name: name.trim(), province: province.trim() });
        setSuccess('Kota berhasil diperbarui!');
      } else {
        await masterService.createCity({ name: name.trim(), province: province.trim() });
        setSuccess('Kota baru berhasil ditambahkan!');
      }
      setShowModal(false);
      fetchCities();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving city:', err);
      Alert.alert('Gagal', err.response?.data?.error || 'Gagal menyimpan data kota.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (city) => {
    Alert.alert(
      'Hapus Kota',
      `Apakah Anda yakin ingin menghapus kota "${city.name}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await masterService.deleteCity(city.id);
              setSuccess(`Kota ${city.name} berhasil dihapus.`);
              fetchCities();
              setTimeout(() => setSuccess(''), 3000);
            } catch (err) {
              console.error('Error deleting city:', err);
              Alert.alert('Gagal Hapus', err.response?.data?.error || 'Kota ini terikat dengan data rute perjalanan.');
            }
          }
        }
      ]
    );
  };

  const filteredCities = cities.filter((c) => {
    const q = search.toLowerCase();
    return (c.name || '').toLowerCase().includes(q) || (c.province || '').toLowerCase().includes(q);
  });

  return (
    <View style={styles.container}>
      {/* Search & Action Toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari kota atau provinsi..."
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
          <Text style={styles.btnAddText}>Tambah</Text>
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
            <Text style={styles.loadingText}>Memuat master kota...</Text>
          </View>
        ) : filteredCities.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="location-outline" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>Kota Tidak Ditemukan</Text>
            <Text style={styles.emptySubtitle}>Belum ada data kota master atau sesuai pencarian Anda.</Text>
          </View>
        ) : (
          filteredCities.map((city, idx) => (
            <View key={city.id || idx} style={styles.cityCard}>
              <View style={styles.cityInfo}>
                <View style={styles.iconCircle}>
                  <Ionicons name="location-sharp" size={20} color={COLORS.primary} />
                </View>
                <View style={styles.textCol}>
                  <Text style={styles.cityName}>{city.name}</Text>
                  <Text style={styles.cityProvince}>{city.province || 'Provinsi Belum Diatur'}</Text>
                </View>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.btnEdit} onPress={() => handleOpenEdit(city)}>
                  <Ionicons name="create-outline" size={16} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnDelete} onPress={() => handleDelete(city)}>
                  <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* MODAL FORM ADD / EDIT */}
      <Modal visible={showModal} animationType="fade" transparent={true} onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalForm}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editId ? 'Edit Kota Master' : 'Tambah Kota Baru'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={20} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Nama Kota *</Text>
              <TextInput
                style={styles.input}
                placeholder="Contoh: Jakarta, Bandung, Cirebon"
                value={name}
                onChangeText={setName}
                placeholderTextColor={COLORS.textLight}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Provinsi (Opsional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Contoh: DKI Jakarta, Jawa Barat"
                value={province}
                onChangeText={setProvince}
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
                  <Text style={styles.btnSaveText}>{editId ? 'Simpan Perubahan' : 'Tambah Kota'}</Text>
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
  cityCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small
  },
  cityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  textCol: {
    flex: 1
  },
  cityName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.secondary
  },
  cityProvince: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  btnEdit: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnDelete: {
    width: 34,
    height: 34,
    borderRadius: 10,
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
    gap: 14,
    ...SHADOWS.medium
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 12
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
    height: 44,
    fontSize: 13,
    color: COLORS.textMain
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6
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
