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
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../config/theme';
import { userService } from '../services/api';

export default function ManajemenUserScreen({ onBack }) {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'CUSTOMER'
  });

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (roleFilter) params.role = roleFilter;
      if (searchTerm) params.search = searchTerm;

      const res = await userService.getUsers(params);
      setUsers(res.data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      Alert.alert('Error', 'Gagal memuat data pengguna.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await userService.getUserStats();
      if (res?.data) setStats(res.data);
    } catch (err) {
      console.error('Error fetching user stats:', err);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
    fetchStats();
  };

  const handleSearch = () => {
    fetchUsers();
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditMode(true);
      setForm({
        id: user.id,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        password: '',
        role: user.role || 'CUSTOMER'
      });
    } else {
      setEditMode(false);
      setForm({
        id: '',
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'CUSTOMER'
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return Alert.alert('Peringatan', 'Nama lengkap wajib diisi.');
    if (!form.email.trim()) return Alert.alert('Peringatan', 'Alamat email wajib diisi.');
    if (!editMode && !form.password.trim()) return Alert.alert('Peringatan', 'Password wajib diisi untuk pengguna baru.');

    try {
      setSubmitting(true);
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        role: form.role
      };
      if (form.password) payload.password = form.password;

      if (editMode) {
        await userService.updateUser(form.id, payload);
        Alert.alert('Sukses', 'Data pengguna berhasil diperbarui.');
      } else {
        await userService.createUser(payload);
        Alert.alert('Sukses', 'Pengguna baru berhasil ditambahkan.');
      }

      setShowModal(false);
      fetchUsers();
      fetchStats();
    } catch (err) {
      console.error('Save user error:', err);
      Alert.alert('Gagal', err.response?.data?.error || 'Gagal menyimpan data pengguna.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (user) => {
    Alert.alert(
      'Konfirmasi Hapus',
      `Apakah Anda yakin ingin menghapus akun pengguna "${user.name}" (${user.email})?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await userService.deleteUser(user.id);
              Alert.alert('Sukses', 'Pengguna berhasil dihapus.');
              fetchUsers();
              fetchStats();
            } catch (err) {
              console.error('Delete user error:', err);
              Alert.alert('Error', err.response?.data?.error || 'Gagal menghapus pengguna.');
            }
          }
        }
      ]
    );
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'ADMIN':
        return { bg: '#fee2e2', text: '#dc2626', label: 'ADMIN' };
      case 'OPERATOR':
        return { bg: '#e0e7ff', text: '#4338ca', label: 'OPERATOR' };
      case 'DRIVER':
        return { bg: '#fef3c7', text: '#d97706', label: 'DRIVER' };
      default:
        return { bg: '#dcfce7', text: '#15803d', label: 'CUSTOMER' };
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      (u.phone && u.phone.toLowerCase().includes(term))
    );
  });

  return (
    <View style={styles.container}>
      {/* SCREEN HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.btnBack} onPress={onBack}>
          <Ionicons name="arrow-back-outline" size={20} color={COLORS.secondary} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Manajemen User</Text>
          <Text style={styles.headerSub}>Kelola Akun Sistem & Peran Hak Akses (Role)</Text>
        </View>

        <TouchableOpacity style={styles.btnAdd} onPress={() => handleOpenModal(null)}>
          <Ionicons name="add-outline" size={18} color="#ffffff" />
          <Text style={styles.btnAddText}>Tambah</Text>
        </TouchableOpacity>
      </View>

      {/* METRIC STATS */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statVal}>{stats?.totalUsers ?? users.length}</Text>
          <Text style={styles.statLabel}>Total User</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statVal, { color: COLORS.accent }]}>{stats?.roleCount?.CUSTOMER ?? 0}</Text>
          <Text style={styles.statLabel}>Customer</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statVal, { color: COLORS.primary }]}>{stats?.roleCount?.OPERATOR ?? 0}</Text>
          <Text style={styles.statLabel}>Operator</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statVal, { color: COLORS.warning }]}>{stats?.roleCount?.DRIVER ?? 0}</Text>
          <Text style={styles.statLabel}>Driver</Text>
        </View>
      </View>

      {/* SEARCH & ROLE FILTERS */}
      <View style={styles.filterSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama, email, no HP..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            onSubmitEditing={handleSearch}
          />
          {searchTerm !== '' && (
            <TouchableOpacity onPress={() => { setSearchTerm(''); fetchUsers(); }}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {[
            { id: '', label: 'Semua Peran' },
            { id: 'CUSTOMER', label: 'Customer' },
            { id: 'OPERATOR', label: 'Operator' },
            { id: 'DRIVER', label: 'Driver' },
            { id: 'ADMIN', label: 'Admin' }
          ].map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.chip, roleFilter === item.id && styles.chipActive]}
              onPress={() => setRoleFilter(item.id)}
            >
              <Text style={[styles.chipText, roleFilter === item.id && styles.chipActiveText]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* USER LIST */}
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        >
          {filteredUsers.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="people-outline" size={42} color={COLORS.textLight} />
              <Text style={styles.emptyText}>Tidak ada data pengguna ditemukan.</Text>
            </View>
          ) : (
            filteredUsers.map((u) => {
              const roleStyle = getRoleBadgeStyle(u.role);
              const initial = (u.name || 'U').charAt(0).toUpperCase();

              return (
                <View key={u.id} style={styles.userCard}>
                  <View style={styles.userRow}>
                    <View style={styles.avatarBox}>
                      <Text style={styles.avatarText}>{initial}</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={styles.nameRoleRow}>
                        <Text style={styles.userNameText}>{u.name}</Text>
                        <View style={[styles.roleBadge, { backgroundColor: roleStyle.bg }]}>
                          <Text style={[styles.roleBadgeText, { color: roleStyle.text }]}>{roleStyle.label}</Text>
                        </View>
                      </View>

                      <Text style={styles.userEmailText}>📧 {u.email}</Text>
                      <Text style={styles.userPhoneText}>📱 {u.phone || '-'}</Text>
                    </View>
                  </View>

                  <View style={styles.cardFooterRow}>
                    <Text style={styles.dateMeta}>
                      Terdaftar: {u.createdAt ? new Date(u.createdAt).toLocaleDateString('id-ID') : '-'}
                    </Text>

                    <View style={styles.actionBtnGroup}>
                      <TouchableOpacity style={styles.btnEdit} onPress={() => handleOpenModal(u)}>
                        <Ionicons name="create-outline" size={14} color={COLORS.primary} />
                        <Text style={styles.btnEditText}>Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.btnDelete} onPress={() => handleDeleteUser(u)}>
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

      {/* MODAL USER ADD / EDIT */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editMode ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close-outline" size={24} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ padding: 16 }}>
              <Text style={styles.fieldLabel}>Nama Lengkap *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="cth. Budi Santoso"
                value={form.name}
                onChangeText={(val) => setForm({ ...form, name: val })}
              />

              <Text style={styles.fieldLabel}>Alamat Email *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="cth. budi@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.email}
                onChangeText={(val) => setForm({ ...form, email: val })}
              />

              <Text style={styles.fieldLabel}>Nomor WhatsApp / HP</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="cth. 08123456789"
                keyboardType="phone-pad"
                value={form.phone}
                onChangeText={(val) => setForm({ ...form, phone: val })}
              />

              <Text style={styles.fieldLabel}>
                {editMode ? 'Password Baru (Kosongkan jika tidak diubah)' : 'Password *'}
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder="••••••••"
                secureTextEntry
                value={form.password}
                onChangeText={(val) => setForm({ ...form, password: val })}
              />

              <Text style={styles.fieldLabel}>Peran (Role) Hak Akses *</Text>
              <View style={styles.roleGridBtn}>
                {['CUSTOMER', 'OPERATOR', 'DRIVER', 'ADMIN'].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.btnRoleSelect, form.role === r && styles.btnRoleSelectActive]}
                    onPress={() => setForm({ ...form, role: r })}
                  >
                    <Text style={[styles.btnRoleSelectText, form.role === r && styles.btnRoleSelectActiveText]}>
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.btnSubmit, submitting && styles.btnDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.btnSubmitText}>
                    {editMode ? 'Update Data Pengguna' : 'Simpan Pengguna Baru'}
                  </Text>
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
  userCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
    ...SHADOWS.small
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff'
  },
  nameRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  userNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.secondary
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '800'
  },
  userEmailText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2
  },
  userPhoneText: {
    fontSize: 11,
    color: COLORS.secondary,
    marginTop: 1
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.inputBg
  },
  dateMeta: {
    fontSize: 10,
    color: COLORS.textMuted
  },
  actionBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  btnEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10
  },
  btnEditText: {
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
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
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
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: 4,
    marginTop: 10
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
  roleGridBtn: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4
  },
  btnRoleSelect: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  btnRoleSelectActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  btnRoleSelectText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.secondary
  },
  btnRoleSelectActiveText: {
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
