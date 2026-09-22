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
import { paymentService } from '../services/api';

export default function PembayaranScreen({ onBack }) {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, [typeFilter, startDate, endDate]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = {};
      if (typeFilter !== 'ALL') params.type = typeFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (searchTerm) params.search = searchTerm;

      const res = await paymentService.getPayments(params);
      setPayments(res.data || []);
    } catch (err) {
      console.error('Error fetching payments:', err);
      Alert.alert('Error', 'Gagal memuat data pembayaran lunas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await paymentService.getPaymentStats(params);
      if (res?.data) setStats(res.data);
    } catch (err) {
      console.error('Error fetching payment stats:', err);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPayments();
    fetchStats();
  };

  const handleSearch = () => {
    fetchPayments();
  };

  const handleDeletePayment = async (item) => {
    Alert.alert(
      'Konfirmasi Hapus',
      `Apakah Anda yakin ingin menghapus data transaksi lunas ${item.code}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await paymentService.deletePayment(item.type, item.id);
              Alert.alert('Sukses', 'Transaksi pembayaran berhasil dihapus.');
              fetchPayments();
              fetchStats();
            } catch (err) {
              console.error('Delete payment error:', err);
              Alert.alert('Error', err.response?.data?.error || 'Gagal menghapus data transaksi.');
            }
          }
        }
      ]
    );
  };

  const formatRupiah = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

  const getTypeBadgeStyle = (type) => {
    switch (type) {
      case 'TICKET':
        return { bg: '#eff6ff', text: '#2563eb', label: 'TIKET SHUTTLE' };
      case 'CHARTER':
        return { bg: '#fae8ff', text: '#a855f7', label: 'CHARTER ARMADA' };
      case 'PACKAGE':
        return { bg: '#ffedd5', text: '#ea580c', label: 'PENGIRIMAN PAKET' };
      default:
        return { bg: '#f1f5f9', text: '#475569', label: type || 'PEMBAYARAN' };
    }
  };

  const filteredPayments = payments.filter((p) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (p.code && p.code.toLowerCase().includes(term)) ||
      (p.customerName && p.customerName.toLowerCase().includes(term)) ||
      (p.customerPhone && p.customerPhone.toLowerCase().includes(term)) ||
      (p.serviceName && p.serviceName.toLowerCase().includes(term))
    );
  });

  const totalRevenue = stats?.totalRevenue || payments.reduce((sum, p) => sum + (p.totalPrice || 0), 0);
  const totalCount = stats?.totalPayments || payments.length;

  return (
    <View style={styles.container}>
      {/* SCREEN HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.btnBack} onPress={onBack}>
          <Ionicons name="arrow-back-outline" size={20} color={COLORS.secondary} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Manajemen Pembayaran</Text>
          <Text style={styles.headerSub}>Rekap Laporan Transaksi Lunas & Struk Nota EPOS</Text>
        </View>
      </View>

      {/* METRIC SUMMARY */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statVal}>{totalCount}</Text>
          <Text style={styles.statLabel}>Total Lunas</Text>
        </View>

        <View style={styles.statCardBig}>
          <Text style={styles.statValBig}>{formatRupiah(totalRevenue)}</Text>
          <Text style={styles.statLabel}>Total Omset Lunas</Text>
        </View>
      </View>

      {/* SEARCH & FILTERS */}
      <View style={styles.filterSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari kode transaksi, nama, no HP..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            onSubmitEditing={handleSearch}
          />
          {searchTerm !== '' && (
            <TouchableOpacity onPress={() => { setSearchTerm(''); fetchPayments(); }}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* TYPE CHIPS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {[
            { id: 'ALL', label: 'Semua Layanan' },
            { id: 'TICKET', label: 'Tiket Shuttle' },
            { id: 'CHARTER', label: 'Charter Mobil' },
            { id: 'PACKAGE', label: 'Pengiriman Paket' }
          ].map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.chip, typeFilter === item.id && styles.chipActive]}
              onPress={() => setTypeFilter(item.id)}
            >
              <Text style={[styles.chipText, typeFilter === item.id && styles.chipActiveText]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* PAYMENTS LIST */}
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        >
          {filteredPayments.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="receipt-outline" size={42} color={COLORS.textLight} />
              <Text style={styles.emptyText}>Tidak ada data transaksi pembayaran lunas.</Text>
            </View>
          ) : (
            filteredPayments.map((p) => {
              const typeStyle = getTypeBadgeStyle(p.type);
              return (
                <View key={`${p.type}-${p.id}`} style={styles.paymentCard}>
                  {/* CARD HEADER */}
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.transCode}>{p.code}</Text>
                    <View style={[styles.typeBadge, { backgroundColor: typeStyle.bg }]}>
                      <Text style={[styles.typeBadgeText, { color: typeStyle.text }]}>
                        {typeStyle.label}
                      </Text>
                    </View>
                  </View>

                  {/* CUSTOMER & SERVICE */}
                  <Text style={styles.custText}>
                    👤 Pelanggan: <Text style={styles.boldText}>{p.customerName || '-'}</Text> ({p.customerPhone || '-'})
                  </Text>
                  <Text style={styles.serviceText}>
                    📍 Rute/Layanan: <Text style={styles.boldText}>{p.serviceName || '-'}</Text>
                  </Text>
                  <Text style={styles.detailText}>
                    📋 Detail: {p.details || '-'}
                  </Text>

                  {/* FOOTER */}
                  <View style={styles.cardFooterRow}>
                    <View>
                      <Text style={styles.dateMeta}>
                        🗓️ {p.paidAt ? new Date(p.paidAt).toLocaleDateString('id-ID') : '-'}
                      </Text>
                      <Text style={styles.priceAmount}>{formatRupiah(p.totalPrice)}</Text>
                    </View>

                    <View style={styles.actionBtnGroup}>
                      <TouchableOpacity
                        style={styles.btnPrint}
                        onPress={() => {
                          setSelectedReceipt(p);
                          setShowReceiptModal(true);
                        }}
                      >
                        <Ionicons name="receipt-outline" size={14} color={COLORS.primary} />
                        <Text style={styles.btnPrintText}>Struk Nota</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.btnDelete}
                        onPress={() => handleDeletePayment(p)}
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

      {/* RECEIPT / EPOS NOTA MODAL */}
      <Modal visible={showReceiptModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Struk Nota Digital (EPOS)</Text>
              <TouchableOpacity onPress={() => setShowReceiptModal(false)}>
                <Ionicons name="close-outline" size={24} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>

            {selectedReceipt && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ padding: 20 }}>
                {/* RECEIPT PAPER CONTAINER */}
                <View style={styles.receiptPaper}>
                  <Text style={styles.receiptBrand}>PT TRAVEL SHUTTLE INDONESIA</Text>
                  <Text style={styles.receiptSub}>Bukti Pembayaran Resmi (LUNAS)</Text>
                  <View style={styles.dividerDashed} />

                  <View style={styles.receiptRow}>
                    <Text style={styles.rLabel}>No. Transaksi:</Text>
                    <Text style={styles.rValBold}>{selectedReceipt.code}</Text>
                  </View>

                  <View style={styles.receiptRow}>
                    <Text style={styles.rLabel}>Tanggal Lunas:</Text>
                    <Text style={styles.rVal}>{selectedReceipt.paidAt ? new Date(selectedReceipt.paidAt).toLocaleString('id-ID') : '-'}</Text>
                  </View>

                  <View style={styles.receiptRow}>
                    <Text style={styles.rLabel}>Layanan:</Text>
                    <Text style={styles.rVal}>{selectedReceipt.typeLabel || selectedReceipt.type}</Text>
                  </View>

                  <View style={styles.dividerDashed} />

                  <View style={styles.receiptRow}>
                    <Text style={styles.rLabel}>Pelanggan:</Text>
                    <Text style={styles.rValBold}>{selectedReceipt.customerName}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.rLabel}>No. HP/WA:</Text>
                    <Text style={styles.rVal}>{selectedReceipt.customerPhone || '-'}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.rLabel}>Rute/Item:</Text>
                    <Text style={styles.rVal}>{selectedReceipt.serviceName}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.rLabel}>Detail Unit:</Text>
                    <Text style={styles.rVal}>{selectedReceipt.details}</Text>
                  </View>

                  <View style={styles.dividerDashed} />

                  <View style={styles.receiptRowBig}>
                    <Text style={styles.rTotalLabel}>TOTAL BAYAR:</Text>
                    <Text style={styles.rTotalVal}>{formatRupiah(selectedReceipt.totalPrice)}</Text>
                  </View>

                  <View style={styles.statusLunasBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#15803d" />
                    <Text style={styles.statusLunasText}>STATUS: LUNAS / VERIFIED</Text>
                  </View>

                  <View style={styles.dividerDashed} />
                  <Text style={styles.receiptFooterText}>Terima kasih telah menggunakan jasa Travel Shuttle Indonesia!</Text>
                </View>
              </ScrollView>
            )}
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
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginTop: 12
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center'
  },
  statCardBig: {
    flex: 2,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center'
  },
  statVal: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.secondary
  },
  statValBig: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.accentDark
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
  paymentCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
    ...SHADOWS.small
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  transCode: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800'
  },
  custText: {
    fontSize: 12,
    color: COLORS.secondary
  },
  serviceText: {
    fontSize: 12,
    color: COLORS.secondary
  },
  detailText: {
    fontSize: 11,
    color: COLORS.textMuted
  },
  boldText: {
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
  dateMeta: {
    fontSize: 10,
    color: COLORS.textMuted
  },
  priceAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.accentDark
  },
  actionBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  btnPrint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10
  },
  btnPrintText: {
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
    justifyContent: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    maxHeight: '85%'
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
  receiptPaper: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    padding: 16,
    gap: 8
  },
  receiptBrand: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.secondary,
    textAlign: 'center'
  },
  receiptSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center'
  },
  dividerDashed: {
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    borderStyle: 'dashed',
    marginVertical: 6
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  receiptRowBig: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4
  },
  rLabel: {
    fontSize: 11,
    color: COLORS.textMuted
  },
  rVal: {
    fontSize: 11,
    color: COLORS.secondary
  },
  rValBold: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.secondary
  },
  rTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.secondary
  },
  rTotalVal: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary
  },
  statusLunasBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#dcfce7',
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 6
  },
  statusLunasText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d'
  },
  receiptFooterText: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 4
  }
});
