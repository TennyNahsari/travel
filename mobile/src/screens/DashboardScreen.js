import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS } from '../config/theme';
import { authService, dashboardService, bookingService } from '../services/api';

export default function DashboardScreen({
  user,
  onLogout,
  onNavigateMasterData,
  onNavigateJadwal,
  onNavigateBooking,
  onNavigateCharter,
  onNavigatePackage,
  onNavigatePembayaran,
  onNavigateCheckIn,
  onNavigateLaporan,
  onNavigateUser
}) {
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, bookingsRes] = await Promise.all([
        dashboardService.getStats().catch(() => null),
        bookingService.getBookings({ limit: 5 }).catch(() => null)
      ]);

      if (statsRes?.data) setStats(statsRes.data);
      if (bookingsRes?.data) setRecentBookings(bookingsRes.data.slice(0, 5));
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'ADMIN':
        return { bg: '#fee2e2', text: '#dc2626', label: 'ADMINISTRATOR' };
      case 'OPERATOR':
        return { bg: '#e0e7ff', text: '#4338ca', label: 'OPERATOR PORTAL' };
      case 'DRIVER':
        return { bg: '#fef3c7', text: '#d97706', label: 'OFFICIAL DRIVER' };
      default:
        return { bg: '#dcfce7', text: '#15803d', label: 'CUSTOMER' };
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'PAID':
      case 'CONFIRMED':
        return { bg: '#dcfce7', text: '#15803d', label: 'LUNAS / CONFIRMED' };
      case 'PENDING':
        return { bg: '#fef3c7', text: '#b45309', label: 'PENDING' };
      case 'CANCELLED':
        return { bg: '#fee2e2', text: '#b91c1c', label: 'DIBATALKAN' };
      default:
        return { bg: '#f1f5f9', text: '#475569', label: status || 'AKTIF' };
    }
  };

  const formatRupiah = (val) => {
    return 'Rp ' + Number(val || 0).toLocaleString('id-ID');
  };

  const roleStyle = getRoleBadgeStyle(user?.role);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {/* DASHBOARD USER HEADER */}
        <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.headerBanner}>
          <View style={styles.userInfoRow}>
            <View style={styles.userAvatarBox}>
              <Text style={styles.userAvatarText}>{(user?.name || 'U').charAt(0).toUpperCase()}</Text>
            </View>

            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user?.name || 'Pengguna Travel'}</Text>
              <Text style={styles.userEmail}>{user?.email || '-'}</Text>
              <View style={[styles.roleBadge, { backgroundColor: roleStyle.bg }]}>
                <Text style={[styles.roleBadgeText, { color: roleStyle.text }]}>{roleStyle.label}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.btnLogout} onPress={onLogout}>
              <Ionicons name="log-out-outline" size={20} color="#f87171" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* METRICS STATS CARDS */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIconBadge, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="bus-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.statVal}>{stats?.overview?.totalSchedules ?? stats?.overview?.activeSchedules ?? 12}</Text>
            <Text style={styles.statLabel}>Total Perjalanan</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconBadge, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="ticket-outline" size={20} color={COLORS.warning} />
            </View>
            <Text style={styles.statVal}>{stats?.overview?.totalBookings ?? 8}</Text>
            <Text style={styles.statLabel}>Booking Tiket</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconBadge, { backgroundColor: '#ecfdf5' }]}>
              <Ionicons name="wallet-outline" size={20} color={COLORS.accent} />
            </View>
            <Text style={styles.statValSmall}>{formatRupiah(stats?.overview?.totalRevenue ?? 1250000)}</Text>
            <Text style={styles.statLabel}>Total Omset</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconBadge, { backgroundColor: '#f3e8ff' }]}>
              <Ionicons name="car-sport-outline" size={20} color="#8b5cf6" />
            </View>
            <Text style={styles.statVal}>{stats?.overview?.totalVehicles ?? 6}</Text>
            <Text style={styles.statLabel}>Armada Aktif</Text>
          </View>
        </View>

        {/* QUICK ACTION NAVIGATION GRID */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Menu Pintas Operasional</Text>

          <View style={styles.menuGrid}>
            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => onNavigateJadwal && onNavigateJadwal()}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#eff6ff' }]}>
                <Ionicons name="calendar-outline" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.menuTitle}>Jadwal Travel</Text>
              <Text style={styles.menuSub}>Manajemen Perjalanan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => onNavigateBooking && onNavigateBooking()}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="ticket-outline" size={24} color={COLORS.warning} />
              </View>
              <Text style={styles.menuTitle}>Booking Tiket</Text>
              <Text style={styles.menuSub}>Kelola Penumpang</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => onNavigateCharter && onNavigateCharter()}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#fae8ff' }]}>
                <Ionicons name="car-sport-outline" size={24} color="#a855f7" />
              </View>
              <Text style={styles.menuTitle}>Charter Mobil</Text>
              <Text style={styles.menuSub}>Sewa Armada Utuh</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => onNavigatePackage && onNavigatePackage()}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#ffedd5' }]}>
                <Ionicons name="cube-outline" size={24} color="#f97316" />
              </View>
              <Text style={styles.menuTitle}>Kirim Paket</Text>
              <Text style={styles.menuSub}>Ekspedisi & Kargo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => onNavigatePembayaran && onNavigatePembayaran()}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="card-outline" size={24} color={COLORS.accentDark} />
              </View>
              <Text style={styles.menuTitle}>Pembayaran</Text>
              <Text style={styles.menuSub}>Laporan Lunas & EPOS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => onNavigateCheckIn && onNavigateCheckIn()}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#e0e7ff' }]}>
                <Ionicons name="checkmark-done-circle-outline" size={24} color="#4338ca" />
              </View>
              <Text style={styles.menuTitle}>Check-In</Text>
              <Text style={styles.menuSub}>Manifest & Boarding</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => onNavigateLaporan && onNavigateLaporan()}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#fef9c3' }]}>
                <Ionicons name="bar-chart-outline" size={24} color="#ca8a04" />
              </View>
              <Text style={styles.menuTitle}>Laporan</Text>
              <Text style={styles.menuSub}>Analitik & Eksekutif</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => onNavigateUser && onNavigateUser()}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#e0f2fe' }]}>
                <Ionicons name="people-outline" size={24} color="#0284c7" />
              </View>
              <Text style={styles.menuTitle}>Manajemen User</Text>
              <Text style={styles.menuSub}>Akun & Hak Akses</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => onNavigateMasterData && onNavigateMasterData('kota')}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#ecfdf5' }]}>
                <Ionicons name="layers-outline" size={24} color={COLORS.accent} />
              </View>
              <Text style={styles.menuTitle}>Master Data</Text>
              <Text style={styles.menuSub}>Kota, Rute, Mobil, Driver</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => onNavigateMasterData && onNavigateMasterData('armada')}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#fce7f3' }]}>
                <Ionicons name="bus-outline" size={24} color="#ec4899" />
              </View>
              <Text style={styles.menuTitle}>Master Armada</Text>
              <Text style={styles.menuSub}>Armada & Plat Mobil</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* RECENT BOOKINGS FEED */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Pemesanan Tiket Terbaru</Text>

          {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 20 }} />
          ) : recentBookings.length === 0 ? (
            <View style={styles.emptyBookingsCard}>
              <Ionicons name="receipt-outline" size={32} color={COLORS.textLight} />
              <Text style={styles.emptyText}>Belum ada riwayat booking tiket saat ini.</Text>
            </View>
          ) : (
            recentBookings.map((b) => {
              const statusStyle = getStatusBadgeStyle(b.status);
              return (
                <View key={b.id} style={styles.bookingCard}>
                  <View style={styles.bookingHeaderRow}>
                    <Text style={styles.bookingCode}>{b.bookingCode || b.id}</Text>
                    <View style={[styles.bStatusBadge, { backgroundColor: statusStyle.bg }]}>
                      <Text style={[styles.bStatusBadgeText, { color: statusStyle.text }]}>
                        {statusStyle.label}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.passengerText}>
                    👤 Penumpang: <Text style={styles.boldText}>{b.passengerName || b.customerName || '-'}</Text>
                  </Text>

                  <View style={styles.bookingFooterRow}>
                    <Text style={styles.seatText}>
                      Kursi:{' '}
                      <Text style={styles.boldText}>
                        {Array.isArray(b.seatNumbers) ? b.seatNumbers.join(', ') : b.seatNumber || '-'}
                      </Text>
                    </Text>
                    <Text style={styles.totalPriceText}>{formatRupiah(b.totalPrice || b.totalAmount)}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  headerBanner: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14
  },
  userAvatarBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium
  },
  userAvatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff'
  },
  userDetails: {
    flex: 1,
    gap: 2
  },
  userName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff'
  },
  userEmail: {
    fontSize: 12,
    color: '#94a3b8'
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800'
  },
  btnLogout: {
    padding: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.15)'
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    marginTop: -16
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
    ...SHADOWS.small
  },
  statIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  statVal: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.secondary
  },
  statValSmall: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.accentDark
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500'
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginTop: 24
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.secondary,
    marginBottom: 12
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  menuCard: {
    width: '48%',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    gap: 4,
    ...SHADOWS.small
  },
  menuIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.secondary
  },
  menuSub: {
    fontSize: 10,
    color: COLORS.textMuted
  },
  emptyBookingsCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textMuted
  },
  bookingCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
    ...SHADOWS.small
  },
  bookingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  bookingCode: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary
  },
  bStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12
  },
  bStatusBadgeText: {
    fontSize: 10,
    fontWeight: '800'
  },
  passengerText: {
    fontSize: 12,
    color: COLORS.secondary
  },
  boldText: {
    fontWeight: '700'
  },
  bookingFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.inputBg
  },
  seatText: {
    fontSize: 11,
    color: COLORS.textMuted
  },
  totalPriceText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.secondary
  }
});
