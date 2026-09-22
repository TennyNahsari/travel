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
import { masterService, cityService } from '../services/api';

export default function MasterRuteScreen() {
  const [routes, setRoutes] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [originCityId, setOriginCityId] = useState('');
  const [destinationCityId, setDestinationCityId] = useState('');
  const [distance, setDistance] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [rRes, cRes] = await Promise.all([
        masterService.getRoutes(),
        cityService.getCities()
      ]);
      setRoutes(rRes.data || []);
      setCities(cRes.data || []);
    } catch (err) {
      console.error('Error fetching routes master:', err);
      setError('Gagal memuat data rute master.');
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
    setOriginCityId(cities[0]?.id || '');
    setDestinationCityId(cities[1]?.id || cities[0]?.id || '');
    setDistance('150');
    setEstimatedTime('180');
    setBasePrice('100000');
    setShowModal(true);
  };

  const handleOpenEdit = (route) => {
    setEditId(route.id);
    setOriginCityId(route.originCityId);
    setDestinationCityId(route.destinationCityId);
    setDistance(route.distance ? route.distance.toString() : '');
    setEstimatedTime(route.estimatedTime ? route.estimatedTime.toString() : '');
    setBasePrice(route.basePrice ? route.basePrice.toString() : '');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!originCityId || !destinationCityId) {
      Alert.alert('Peringatan', 'Kota Asal dan Kota Tujuan wajib dipilih.');
      return;
    }
    if (originCityId === destinationCityId) {
      Alert.alert('Peringatan', 'Kota Asal dan Kota Tujuan tidak boleh sama.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        originCityId,
        destinationCityId,
        distance: distance ? parseInt(distance) : 0,
        estimatedTime: estimatedTime ? parseInt(estimatedTime) : 0,
        basePrice: basePrice ? parseInt(basePrice) : 0
      };

      if (editId) {
        await masterService.updateRoute(editId, payload);
        setSuccess('Rute berhasil diperbarui!');
      } else {
        await masterService.createRoute(payload);
        setSuccess('Rute baru berhasil ditambahkan!');
      }

      setShowModal(false);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving route:', err);
      Alert.alert('Gagal', err.response?.data?.error || 'Gagal menyimpan data rute.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (route) => {
    const originName = route.originCity?.name || 'Asal';
    const destName = route.destinationCity?.name || 'Tujuan';

    Alert.alert(
      'Hapus Rute',
      `Apakah Anda yakin ingin menghapus rute ${originName} → ${destName}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await masterService.deleteRoute(route.id);
              setSuccess(`Rute ${originName} → ${destName} berhasil dihapus.`);
              fetchData();
              setTimeout(() => setSuccess(''), 3000);
            } catch (err) {
              console.error('Error deleting route:', err);
              Alert.alert('Gagal Hapus', err.response?.data?.error || 'Rute ini terikat dengan data jadwal.');
            }
          }
        }
      ]
    );
  };

  const formatRupiah = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

  const filteredRoutes = routes.filter((r) => {
    const q = search.toLowerCase();
    const origin = (r.originCity?.name || '').toLowerCase();
    const dest = (r.destinationCity?.name || '').toLowerCase();
    return origin.includes(q) || dest.includes(q);
  });

  return (
    <View style={styles.container}>
      {/* Search & Action Toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari rute kota..."
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
          <Text style={styles.btnAddText}>Tambah Rute</Text>
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
            <Text style={styles.loadingText}>Memuat master rute...</Text>
          </View>
        ) : filteredRoutes.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="map-outline" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>Rute Tidak Ditemukan</Text>
            <Text style={styles.emptySubtitle}>Belum ada data rute perjalanan master atau sesuai pencarian Anda.</Text>
          </View>
        ) : (
          filteredRoutes.map((route, idx) => {
            const originName = route.originCity?.name || 'Unknown';
            const destName = route.destinationCity?.name || 'Unknown';

            return (
              <View key={route.id || idx} style={styles.routeCard}>
                <View style={styles.routeCardHeader}>
                  <Text style={styles.routeTitle}>
                    {originName} → {destName}
                  </Text>
                  <Text style={styles.priceBadge}>{formatRupiah(route.basePrice)}</Text>
                </View>

                <View style={styles.metricsRow}>
                  <View style={styles.metricItem}>
                    <Ionicons name="speedometer-outline" size={14} color={COLORS.primary} />
                    <Text style={styles.metricText}>Jarak: {route.distance || 0} km</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Ionicons name="time-outline" size={14} color={COLORS.primary} />
                    <Text style={styles.metricText}>Waktu: {route.estimatedTime || 0} menit</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <TouchableOpacity style={styles.btnEdit} onPress={() => handleOpenEdit(route)}>
                    <Ionicons name="create-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.btnEditText}>Edit Rute</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.btnDelete} onPress={() => handleDelete(route)}>
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
              <Text style={styles.modalTitle}>{editId ? 'Edit Rute Perjalanan' : 'Tambah Rute Baru'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={20} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>

            {/* Select Origin City */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Kota Asal Keberangkatan *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cityChipsRow}>
                {cities.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.cityChip, originCityId === c.id && styles.cityChipActive]}
                    onPress={() => setOriginCityId(c.id)}
                  >
                    <Text style={[styles.cityChipText, originCityId === c.id && styles.cityChipTextActive]}>
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Select Destination City */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Kota Tujuan Kedatangan *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cityChipsRow}>
                {cities.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.cityChip, destinationCityId === c.id && styles.cityChipActive]}
                    onPress={() => setDestinationCityId(c.id)}
                  >
                    <Text style={[styles.cityChipText, destinationCityId === c.id && styles.cityChipTextActive]}>
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Jarak Tempuh (km) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Contoh: 150"
                keyboardType="numeric"
                value={distance}
                onChangeText={setDistance}
                placeholderTextColor={COLORS.textLight}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Estimasi Waktu Tempuh (menit) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Contoh: 180"
                keyboardType="numeric"
                value={estimatedTime}
                onChangeText={setEstimatedTime}
                placeholderTextColor={COLORS.textLight}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Harga Tiket Dasar (Rp) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Contoh: 120000"
                keyboardType="numeric"
                value={basePrice}
                onChangeText={setBasePrice}
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
                  <Text style={styles.btnSaveText}>{editId ? 'Simpan Perubahan' : 'Tambah Rute'}</Text>
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
  routeCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
    ...SHADOWS.small
  },
  routeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.secondary
  },
  priceBadge: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  metricText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondary
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
    gap: 12,
    maxHeight: '90%',
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
  cityChipsRow: {
    gap: 6,
    paddingVertical: 4
  },
  cityChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: COLORS.border
  },
  cityChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  cityChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondary
  },
  cityChipTextActive: {
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
