import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../config/theme';
import { reportService } from '../services/api';

export default function LaporanScreen({ onBack }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'sales', 'route', 'vehicle', 'driver', 'customers'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Default dates (last 30 days)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Data states
  const [overview, setOverview] = useState(null);
  const [salesReport, setSalesReport] = useState([]);
  const [routeRevenue, setRouteRevenue] = useState([]);
  const [vehicleUtilization, setVehicleUtilization] = useState([]);
  const [driverPerformance, setDriverPerformance] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);

  useEffect(() => {
    fetchReportData();
  }, [activeTab, startDate, endDate]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const params = { startDate, endDate };

      switch (activeTab) {
        case 'overview': {
          const res = await reportService.getOverview(params);
          setOverview(res.data || res);
          break;
        }
        case 'sales': {
          const res = await reportService.getSales(params);
          setSalesReport(res.data || []);
          break;
        }
        case 'route': {
          const res = await reportService.getRouteRevenue(params);
          setRouteRevenue(res.data || []);
          break;
        }
        case 'vehicle': {
          const res = await reportService.getVehicleUtilization(params);
          setVehicleUtilization(res.data || []);
          break;
        }
        case 'driver': {
          const res = await reportService.getDriverPerformance(params);
          setDriverPerformance(res.data || []);
          break;
        }
        case 'customers': {
          const res = await reportService.getTopCustomers(params);
          setTopCustomers(res.data || []);
          break;
        }
      }
    } catch (err) {
      console.error('Error fetching report data:', err);
      Alert.alert('Error', 'Gagal memuat data laporan operasional.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchReportData();
  };

  const formatRupiah = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

  const tabs = [
    { id: 'overview', label: 'Ringkasan', icon: 'bar-chart-outline' },
    { id: 'sales', label: 'Penjualan', icon: 'trending-up-outline' },
    { id: 'route', label: 'Rute', icon: 'map-outline' },
    { id: 'vehicle', label: 'Armada', icon: 'bus-outline' },
    { id: 'driver', label: 'Driver', icon: 'person-outline' },
    { id: 'customers', label: 'Pelanggan', icon: 'people-outline' }
  ];

  return (
    <View style={styles.container}>
      {/* SCREEN HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.btnBack} onPress={onBack}>
          <Ionicons name="arrow-back-outline" size={20} color={COLORS.secondary} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Laporan & Analitik</Text>
          <Text style={styles.headerSub}>Laporan Omset, Rute, Armada & Kinerja Driver</Text>
        </View>
      </View>

      {/* DATE RANGE FILTER */}
      <View style={styles.dateFilterBox}>
        <View style={styles.dateInputWrapper}>
          <Text style={styles.dateLabel}>Dari Tanggal:</Text>
          <TextInput
            style={styles.dateInput}
            value={startDate}
            onChangeText={setStartDate}
            placeholder="YYYY-MM-DD"
          />
        </View>

        <View style={styles.dateInputWrapper}>
          <Text style={styles.dateLabel}>Sampai Tanggal:</Text>
          <TextInput
            style={styles.dateInput}
            value={endDate}
            onChangeText={setEndDate}
            placeholder="YYYY-MM-DD"
          />
        </View>
      </View>

      {/* TAB SCROLL */}
      <View style={styles.tabBarContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabBtn, activeTab === tab.id && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons
                name={tab.icon}
                size={16}
                color={activeTab === tab.id ? '#ffffff' : COLORS.textMuted}
              />
              <Text style={[styles.tabBtnText, activeTab === tab.id && styles.tabBtnTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* CONTENT BODY */}
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        >
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <View style={styles.tabContentSection}>
              <Text style={styles.sectionTitle}>Ringkasan Eksekutif Operasional</Text>

              <View style={styles.gridStats}>
                <View style={styles.overviewCard}>
                  <Text style={styles.overviewLabel}>Total Omset Keseluruhan</Text>
                  <Text style={styles.overviewValBig}>{formatRupiah(overview?.totalRevenue || overview?.revenue || 0)}</Text>
                </View>

                <View style={styles.overviewRow}>
                  <View style={styles.miniStatCard}>
                    <Text style={styles.miniLabel}>Omset Tiket</Text>
                    <Text style={styles.miniVal}>{formatRupiah(overview?.breakdown?.ticketRevenue || 0)}</Text>
                  </View>
                  <View style={styles.miniStatCard}>
                    <Text style={styles.miniLabel}>Omset Charter</Text>
                    <Text style={styles.miniVal}>{formatRupiah(overview?.breakdown?.charterRevenue || 0)}</Text>
                  </View>
                  <View style={styles.miniStatCard}>
                    <Text style={styles.miniLabel}>Omset Paket</Text>
                    <Text style={styles.miniVal}>{formatRupiah(overview?.breakdown?.packageRevenue || 0)}</Text>
                  </View>
                </View>

                <View style={styles.overviewRow}>
                  <View style={styles.miniStatCard}>
                    <Text style={styles.miniLabel}>Total Transaksi</Text>
                    <Text style={styles.miniValNum}>{overview?.totalBookings ?? overview?.totalPayments ?? 0}</Text>
                  </View>
                  <View style={styles.miniStatCard}>
                    <Text style={styles.miniLabel}>Jadwal Aktif</Text>
                    <Text style={styles.miniValNum}>{overview?.totalSchedules ?? 0}</Text>
                  </View>
                  <View style={styles.miniStatCard}>
                    <Text style={styles.miniLabel}>Armada Beroperasi</Text>
                    <Text style={styles.miniValNum}>{overview?.totalVehicles ?? 0}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* TAB 2: SALES TREND */}
          {activeTab === 'sales' && (
            <View style={styles.tabContentSection}>
              <Text style={styles.sectionTitle}>Tren Penjualan Harian</Text>

              {salesReport.length === 0 ? (
                <Text style={styles.emptyText}>Tidak ada data penjualan pada rentang tanggal ini.</Text>
              ) : (
                salesReport.map((item, idx) => (
                  <View key={idx} style={styles.reportCard}>
                    <View style={styles.reportHeaderRow}>
                      <Text style={styles.dateTitle}>🗓️ {item.date || item.period || '-'}</Text>
                      <Text style={styles.revenueText}>{formatRupiah(item.revenue || item.totalPrice)}</Text>
                    </View>
                    <Text style={styles.subText}>
                      Jumlah Transaksi: <Text style={styles.boldText}>{item.totalBookings || item.count || 0}</Text>
                    </Text>
                  </View>
                ))
              )}
            </View>
          )}

          {/* TAB 3: ROUTE REVENUE */}
          {activeTab === 'route' && (
            <View style={styles.tabContentSection}>
              <Text style={styles.sectionTitle}>Pendapatan Berdasarkan Rute</Text>

              {routeRevenue.length === 0 ? (
                <Text style={styles.emptyText}>Tidak ada data pendapatan rute ditemukan.</Text>
              ) : (
                routeRevenue.map((r, idx) => (
                  <View key={idx} style={styles.reportCard}>
                    <View style={styles.reportHeaderRow}>
                      <Text style={styles.routeTitle}>📍 {r.routeName || r.name || 'Rute Shuttle'}</Text>
                      <Text style={styles.revenueText}>{formatRupiah(r.revenue || r.totalRevenue)}</Text>
                    </View>
                    <Text style={styles.subText}>
                      Jumlah Perjalanan: <Text style={styles.boldText}>{r.totalTrips || r.tripCount || 0}</Text> | Penumpang: <Text style={styles.boldText}>{r.totalPassengers || 0}</Text>
                    </Text>
                  </View>
                ))
              )}
            </View>
          )}

          {/* TAB 4: VEHICLE UTILIZATION */}
          {activeTab === 'vehicle' && (
            <View style={styles.tabContentSection}>
              <Text style={styles.sectionTitle}>Utilitas & Kinerja Armada</Text>

              {vehicleUtilization.length === 0 ? (
                <Text style={styles.emptyText}>Tidak ada data utilitas armada ditemukan.</Text>
              ) : (
                vehicleUtilization.map((v, idx) => (
                  <View key={idx} style={styles.reportCard}>
                    <View style={styles.reportHeaderRow}>
                      <Text style={styles.vTitle}>🚗 {v.vehicleType || 'Shuttle'} ({v.plateNumber || '-'})</Text>
                      <Text style={styles.revenueText}>{formatRupiah(v.revenue || v.totalRevenue)}</Text>
                    </View>
                    <Text style={styles.subText}>
                      Total Trip: <Text style={styles.boldText}>{v.totalTrips || v.tripCount || 0}</Text> | Kapasitas: <Text style={styles.boldText}>{v.capacity || '-'} Kursi</Text>
                    </Text>
                  </View>
                ))
              )}
            </View>
          )}

          {/* TAB 5: DRIVER PERFORMANCE */}
          {activeTab === 'driver' && (
            <View style={styles.tabContentSection}>
              <Text style={styles.sectionTitle}>Kinerja & Aktivitas Driver</Text>

              {driverPerformance.length === 0 ? (
                <Text style={styles.emptyText}>Tidak ada data kinerja driver ditemukan.</Text>
              ) : (
                driverPerformance.map((d, idx) => (
                  <View key={idx} style={styles.reportCard}>
                    <View style={styles.reportHeaderRow}>
                      <Text style={styles.driverName}>👨‍✈️ {d.driverName || d.name || 'Driver'}</Text>
                      <Text style={styles.tripBadge}>{d.totalTrips || d.completedTrips || 0} Trip Selesai</Text>
                    </View>
                    <Text style={styles.subText}>
                      No. HP: <Text style={styles.boldText}>{d.phone || d.driverPhone || '-'}</Text>
                    </Text>
                  </View>
                ))
              )}
            </View>
          )}

          {/* TAB 6: TOP CUSTOMERS */}
          {activeTab === 'customers' && (
            <View style={styles.tabContentSection}>
              <Text style={styles.sectionTitle}>Top 10 Pelanggan VIP</Text>

              {topCustomers.length === 0 ? (
                <Text style={styles.emptyText}>Tidak ada data pelanggan ditemukan.</Text>
              ) : (
                topCustomers.map((c, idx) => (
                  <View key={idx} style={styles.reportCard}>
                    <View style={styles.reportHeaderRow}>
                      <Text style={styles.custName}>⭐ #{idx + 1} {c.name || c.customerName || 'Pelanggan'}</Text>
                      <Text style={styles.revenueText}>{formatRupiah(c.totalSpend || c.totalRevenue)}</Text>
                    </View>
                    <Text style={styles.subText}>
                      No. HP: <Text style={styles.boldText}>{c.phone || c.customerPhone || '-'}</Text> | Total Order: <Text style={styles.boldText}>{c.totalOrders || c.bookingCount || 0}</Text>
                    </Text>
                  </View>
                ))
              )}
            </View>
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
  dateFilterBox: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12
  },
  dateInputWrapper: {
    flex: 1
  },
  dateLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginBottom: 2
  },
  dateInput: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12,
    color: COLORS.secondary,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  tabBarContainer: {
    backgroundColor: COLORS.cardBg,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.inputBg,
    marginRight: 6
  },
  tabBtnActive: {
    backgroundColor: COLORS.primary
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted
  },
  tabBtnTextActive: {
    color: '#ffffff'
  },
  contentContainer: {
    padding: 16
  },
  tabContentSection: {
    gap: 12
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.secondary,
    marginBottom: 4
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 20
  },
  gridStats: {
    gap: 10
  },
  overviewCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    ...SHADOWS.small
  },
  overviewLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase'
  },
  overviewValBig: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 4
  },
  overviewRow: {
    flexDirection: 'row',
    gap: 8
  },
  miniStatCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center'
  },
  miniLabel: {
    fontSize: 9,
    color: COLORS.textMuted
  },
  miniVal: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.accentDark,
    marginTop: 2
  },
  miniValNum: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.secondary,
    marginTop: 2
  },
  reportCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
    ...SHADOWS.small
  },
  reportHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  dateTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.secondary
  },
  revenueText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary
  },
  subText: {
    fontSize: 11,
    color: COLORS.textMuted
  },
  boldText: {
    fontWeight: '700',
    color: COLORS.secondary
  },
  routeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.secondary
  },
  vTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.secondary
  },
  driverName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.secondary
  },
  tripBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.accentDark,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10
  },
  custName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.secondary
  }
});
