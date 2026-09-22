import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
  Image,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../config/theme';
import api, { qrisService, getImageUrl } from '../services/api';

export default function PaymentCheckModal({ visible, onClose, initialBookingCode = '' }) {
  const [searchCode, setSearchCode] = useState(typeof initialBookingCode === 'string' ? initialBookingCode : '');
  const [bookingData, setBookingData] = useState(null);
  const [qrisData, setQrisData] = useState(null);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [paymentProofUrl, setPaymentProofUrl] = useState('');

  useEffect(() => {
    if (visible) {
      fetchQrisData();
      if (initialBookingCode && typeof initialBookingCode === 'string') {
        setSearchCode(initialBookingCode);
      } else {
        setSearchCode('');
      }
    }
  }, [visible, initialBookingCode]);

  const fetchQrisData = async () => {
    try {
      const res = await qrisService.getQris();
      if (res.success && res.data) {
        setQrisData(res.data);
      }
    } catch (err) {
      console.error('Error fetching QRIS setting:', err);
    }
  };

  const handleSearch = async () => {
    const trimmed = searchCode.trim();
    if (!trimmed) {
      setError('Masukkan Kode Booking terlebih dahulu.');
      return;
    }

    try {
      setSearching(true);
      setError('');
      setSuccessMessage('');
      setBookingData(null);
      setPaymentProofUrl('');

      const res = await api.get(`/bookings/public/code/${trimmed}`);
      if (res.data && res.data.success && res.data.data) {
        const data = res.data.data;
        setBookingData(data);
        if (data.paymentProofUrl) {
          setPaymentProofUrl(data.paymentProofUrl);
        }
      } else {
        setError('Kode Booking tidak ditemukan. Silakan periksa kembali.');
      }
    } catch (err) {
      console.error('Error searching booking code:', err);
      setError('Kode Booking tidak ditemukan atau koneksi bermasalah.');
    } finally {
      setSearching(false);
    }
  };

  // Local device/folder file picker
  const handlePickLocalImage = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          if (file.size > 10 * 1024 * 1024) {
            setError('Ukuran foto maksimal 10MB');
            return;
          }
          setError('');
          const reader = new FileReader();
          reader.onload = (event) => {
            setPaymentProofUrl(event.target.result);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      // Fallback for native
      Alert.prompt(
        'Upload Foto Bukti Transfer',
        'Tempelkan URL / Base64 Data Image Resi:',
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Simpan',
            onPress: (val) => {
              if (val) setPaymentProofUrl(val);
            }
          }
        ]
      );
    }
  };

  const handleSubmitConfirmation = async () => {
    if (!bookingData) return;
    if (!paymentProofUrl) {
      setError('Pilih foto bukti pembayaran terlebih dahulu.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccessMessage('');

      const payload = {
        bookingCode: bookingData.bookingCode,
        senderName: bookingData.passengerName || bookingData.user?.name || 'Customer',
        bankName: 'Transfer / QRIS',
        targetBank: 'PT Travel Shuttle Indonesia (BCA)',
        transferAmount: bookingData.totalPrice,
        paymentProofUrl: paymentProofUrl,
        notes: 'Diupload via Aplikasi Mobile'
      };

      const res = await api.post('/bookings/public/confirm-payment', payload);
      if (res.data && res.data.success) {
        setSuccessMessage(res.data.message || 'Bukti pembayaran berhasil terkirim! Staf kami akan segera memverifikasi.');
        if (res.data.data) {
          setBookingData(res.data.data);
        }
      } else {
        setError(res.data?.error || 'Gagal mengonfirmasi pembayaran.');
      }
    } catch (err) {
      console.error('Error submitting payment confirmation:', err);
      setError(err.response?.data?.error || 'Gagal mengonfirmasi pembayaran.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenWhatsApp = () => {
    const rawNum = qrisData?.waNumber || '6281234567890';
    let clean = rawNum.replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    if (!clean) clean = '6281234567890';

    let msg = 'Halo Admin Travel, saya ingin konfirmasi pembayaran tiket:\n';
    if (bookingData) {
      msg += `- Kode Booking: ${bookingData.bookingCode}\n` +
        `- Penumpang: ${bookingData.passengerName || bookingData.user?.name || '-'}\n` +
        `- Total Bayar: Rp ${(bookingData.totalPrice || 0).toLocaleString('id-ID')}\n\n` +
        `Berikut bukti transfer saya. Mohon diproses. Terima kasih.`;
    } else {
      msg += `Berikut detail kode booking saya: ${searchCode}`;
    }

    const waUrl = `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
    Linking.openURL(waUrl).catch(() => {
      Alert.alert('Gagal', 'Tidak dapat membuka aplikasi WhatsApp.');
    });
  };

  const formatRupiah = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="card-outline" size={22} color="#ffffff" />
              <Text style={styles.modalTitle}>Cek Status Pembayaran Tiket</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.btnClose}>
              <Ionicons name="close" size={22} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Search Input Box */}
            <View style={styles.searchSection}>
              <Text style={styles.inputLabel}>Cari Kode Booking Tiket</Text>
              <View style={styles.searchRow}>
                <View style={styles.searchInputContainer}>
                  <Ionicons name="search-outline" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Contoh: BK-172701..."
                    value={searchCode || ''}
                    onChangeText={(val) => setSearchCode(val ? val.toUpperCase() : '')}
                    autoCapitalize="characters"
                    placeholderTextColor={COLORS.textLight}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.btnSearch, searching && styles.btnDisabled]}
                  onPress={handleSearch}
                  disabled={searching}
                >
                  {searching ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.btnSearchText}>Cari Tiket</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Error & Success Alerts */}
            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={18} color={COLORS.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {successMessage ? (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.accentDark} />
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            ) : null}

            {/* REKENING BANK & QRIS PAYMENT INFO CARD */}
            <View style={styles.qrisSectionCard}>
              <View style={styles.qrisCardHeader}>
                <Ionicons name="qr-code-outline" size={18} color={COLORS.primary} />
                <Text style={styles.qrisSectionTitle}>Informasi Rekening Bank Transfer & Barcode QRIS</Text>
              </View>

              <View style={styles.qrisBodyRow}>
                {/* Bank Account List */}
                <View style={styles.bankAccountsCol}>
                  <Text style={styles.bankSectionHeading}>Nomor Rekening Bank Transfer:</Text>
                  <View style={styles.bankItemBox}>
                    <Text style={styles.bankItemLabel}>BCA:</Text>
                    <Text style={styles.bankItemValue}>{qrisData?.bankBca || '123-456-7890 (a.n. PT Travel Shuttle)'}</Text>
                  </View>
                  <View style={styles.bankItemBox}>
                    <Text style={styles.bankItemLabel}>Mandiri:</Text>
                    <Text style={styles.bankItemValue}>{qrisData?.bankMandiri || '987-000-112233 (a.n. PT Travel Shuttle)'}</Text>
                  </View>
                  {qrisData?.bankOther ? (
                    <View style={styles.bankItemBox}>
                      <Text style={styles.bankItemLabel}>Lainnya:</Text>
                      <Text style={styles.bankItemValue}>{qrisData.bankOther}</Text>
                    </View>
                  ) : null}
                </View>

                {/* QRIS Barcode Image Preview */}
                <View style={styles.qrisImageCol}>
                  <Text style={styles.bankSectionHeading}>Scan Barcode QRIS:</Text>
                  {qrisData?.imageUrl ? (
                    <View style={styles.qrisImageWrapper}>
                      <Image
                        source={{ uri: getImageUrl(qrisData.imageUrl) }}
                        style={styles.qrisImg}
                        resizeMode="contain"
                      />
                      <Text style={styles.qrisAccountName}>{qrisData.accountName || 'PT Travel Shuttle Indonesia'}</Text>
                    </View>
                  ) : (
                    <View style={styles.qrisFallbackBox}>
                      <Ionicons name="qr-code" size={48} color={COLORS.primary} />
                      <Text style={styles.qrisFallbackText}>Scan QRIS di loket atau via e-wallet</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Booking Details & Proof Upload (Shown when booking found) */}
            {bookingData && (
              <View style={styles.detailsContainer}>
                {/* Summary Box */}
                <View style={styles.summaryCard}>
                  <View style={styles.summaryHeader}>
                    <View>
                      <Text style={styles.codeLabel}>Kode Booking</Text>
                      <Text style={styles.codeValue}>{bookingData.bookingCode}</Text>
                    </View>
                    <View style={[
                      styles.statusBadge,
                      bookingData.status === 'PAID' ? styles.badgePaid :
                      bookingData.status === 'CONFIRMED' ? styles.badgePaid :
                      bookingData.status === 'CANCELLED' ? styles.badgeCancelled : styles.badgePending
                    ]}>
                      <Text style={[
                        styles.statusText,
                        bookingData.status === 'PAID' ? styles.textPaid :
                        bookingData.status === 'CONFIRMED' ? styles.textPaid :
                        bookingData.status === 'CANCELLED' ? styles.textCancelled : styles.textPending
                      ]}>
                        {bookingData.status === 'PAID' ? '✓ Dikonfirmasi Lunas' :
                         bookingData.status === 'CONFIRMED' ? '✓ Terkonfirmasi' :
                         bookingData.status === 'CANCELLED' ? '✕ Dibatalkan' : '⏳ Menunggu Pembayaran'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Nama Penumpang</Text>
                      <Text style={styles.infoValue}>{bookingData.passengerName || bookingData.user?.name || '-'}</Text>
                    </View>

                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>No. WhatsApp</Text>
                      <Text style={styles.infoValue}>{bookingData.passengerPhone || bookingData.user?.phone || '-'}</Text>
                    </View>

                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Rute Perjalanan</Text>
                      <Text style={styles.infoValue}>
                        {bookingData.schedule?.route?.originCity?.name} → {bookingData.schedule?.route?.destinationCity?.name}
                      </Text>
                    </View>

                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Jadwal Berangkat</Text>
                      <Text style={styles.infoValue}>
                        {formatDate(bookingData.schedule?.departureDate)} | {bookingData.schedule?.departureTime} WIB
                      </Text>
                    </View>

                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Nomor Kursi</Text>
                      <Text style={[styles.infoValue, { color: COLORS.primary, fontWeight: '700' }]}>
                        {(bookingData.seatNumbers || []).join(', ')}
                      </Text>
                    </View>

                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Total Tagihan</Text>
                      <Text style={styles.priceHighlight}>{formatRupiah(bookingData.totalPrice)}</Text>
                    </View>
                  </View>
                </View>

                {/* UPLOAD FOTO BUKTI PEMBAYARAN SECTION */}
                <View style={styles.uploadSection}>
                  <Text style={styles.uploadSectionTitle}>📸 Upload Foto Bukti Pembayaran / Resi</Text>

                  <TouchableOpacity
                    style={styles.btnUploadLocal}
                    onPress={handlePickLocalImage}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="cloud-upload-outline" size={20} color={COLORS.primary} />
                    <Text style={styles.btnUploadLocalText}>📁 Pilih Foto Bukti dari Penyimpanan Lokal</Text>
                  </TouchableOpacity>

                  {/* Image Preview Box */}
                  {paymentProofUrl ? (
                    <View style={styles.previewBox}>
                      <Image
                        source={{ uri: getImageUrl(paymentProofUrl) }}
                        style={styles.previewImg}
                        resizeMode="cover"
                      />
                      <View style={styles.previewInfo}>
                        <Text style={styles.previewTitle}>Preview Foto Resi</Text>
                        <Text style={styles.previewSuccess}>✓ Foto resi siap diupload</Text>
                        <TouchableOpacity onPress={() => setPaymentProofUrl('')}>
                          <Text style={styles.btnRemoveImg}>Hapus / Ganti Foto</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : null}

                  <TouchableOpacity
                    style={[styles.btnSubmitConfirm, submitting && styles.btnDisabled]}
                    onPress={handleSubmitConfirmation}
                    disabled={submitting}
                    activeOpacity={0.8}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle-outline" size={18} color="#ffffff" />
                        <Text style={styles.btnSubmitText}>Kirim Bukti Pembayaran Tiket</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {/* WhatsApp Quick Link */}
                <TouchableOpacity style={styles.btnWa} onPress={handleOpenWhatsApp} activeOpacity={0.8}>
                  <Ionicons name="logo-whatsapp" size={18} color="#ffffff" />
                  <Text style={styles.btnWaText}>Konfirmasi Pembayaran via WhatsApp Admin</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end'
  },
  modalContainer: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '94%',
    minHeight: '60%'
  },
  modalHeader: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff'
  },
  btnClose: {
    padding: 4
  },
  scrollBody: {
    padding: 20,
    gap: 16
  },
  searchSection: {
    gap: 6
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 46
  },
  searchIcon: {
    marginRight: 6
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondary
  },
  btnSearch: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnSearchText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700'
  },
  btnDisabled: {
    opacity: 0.6
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 12,
    borderRadius: 12
  },
  errorText: {
    fontSize: 12,
    color: COLORS.danger,
    fontWeight: '500',
    flex: 1
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    padding: 12,
    borderRadius: 12
  },
  successText: {
    fontSize: 12,
    color: COLORS.accentDark,
    fontWeight: '600',
    flex: 1
  },

  /* QRIS & BANK CARD STYLES */
  qrisSectionCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    gap: 12
  },
  qrisCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#dbeafe',
    paddingBottom: 8
  },
  qrisSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.secondary
  },
  qrisBodyRow: {
    gap: 12
  },
  bankAccountsCol: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6
  },
  bankSectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: 4
  },
  bankItemBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  bankItemLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted
  },
  bankItemValue: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary
  },
  qrisImageCol: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  qrisImageWrapper: {
    alignItems: 'center',
    gap: 6,
    marginTop: 6
  },
  qrisImg: {
    width: 140,
    height: 140,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  qrisAccountName: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.secondary,
    textAlign: 'center'
  },
  qrisFallbackBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 4
  },
  qrisFallbackText: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center'
  },

  detailsContainer: {
    gap: 16
  },
  summaryCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  codeLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  codeValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  badgePaid: {
    backgroundColor: '#dcfce7'
  },
  badgePending: {
    backgroundColor: '#fef3c7'
  },
  badgeCancelled: {
    backgroundColor: '#fef2f2'
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700'
  },
  textPaid: {
    color: COLORS.accentDark
  },
  textPending: {
    color: '#b45309'
  },
  textCancelled: {
    color: COLORS.danger
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12
  },
  infoGrid: {
    gap: 10
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textMuted
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondary
  },
  priceHighlight: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.accentDark
  },

  /* UPLOAD SECTION STYLES */
  uploadSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
    ...SHADOWS.small
  },
  uploadSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.secondary
  },
  btnUploadLocal: {
    backgroundColor: '#eff6ff',
    borderWidth: 1.5,
    borderColor: '#93c5fd',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  btnUploadLocalText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary
  },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 10
  },
  previewImg: {
    width: 64,
    height: 64,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  previewInfo: {
    flex: 1,
    gap: 2
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary
  },
  previewSuccess: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.accentDark
  },
  btnRemoveImg: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.danger,
    marginTop: 4
  },

  btnSubmitConfirm: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 4
  },
  btnSubmitText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700'
  },

  btnWa: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14
  },
  btnWaText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700'
  }
});
