import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../config/theme';

export default function BookingSuccessModal({ visible, bookingData, onClose }) {
  if (!bookingData) return null;

  const bookingCode = bookingData.bookingCode || bookingData.id || 'BK-SUCCESS';

  const formatRupiah = (val) => {
    return 'Rp ' + Number(val || 0).toLocaleString('id-ID');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Success Icon Badge */}
            <View style={styles.successIconBadge}>
              <Ionicons name="checkmark-circle" size={54} color={COLORS.accent} />
            </View>

            <Text style={styles.successTitle}>Pemesanan Tiket Berhasil!</Text>
            <Text style={styles.successSubtitle}>
              Terima kasih, tiket Anda telah berhasil dibuat dalam sistem.
            </Text>

            {/* Booking Code Card */}
            <View style={styles.codeCard}>
              <Text style={styles.codeLabel}>KODE BOOKING TIKET</Text>
              <Text style={styles.codeValue}>{bookingCode}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>MENUNGGU PEMBAYARAN (PENDING)</Text>
              </View>
            </View>

            {/* Order Breakdown */}
            <View style={styles.detailCard}>
              <Text style={styles.detailHeader}>Rincian Pemesanan Tiket</Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Nama Penumpang:</Text>
                <Text style={styles.detailVal}>{bookingData.passengerName || '-'}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Nomor WhatsApp:</Text>
                <Text style={styles.detailVal}>{bookingData.passengerPhone || '-'}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Nomor Kursi:</Text>
                <Text style={styles.detailValHighlight}>
                  {Array.isArray(bookingData.seatNumbers) ? bookingData.seatNumbers.join(', ') : bookingData.seatNumber || '-'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Pembayaran:</Text>
                <Text style={styles.detailTotal}>{formatRupiah(bookingData.totalPrice)}</Text>
              </View>
            </View>

            {/* Payment Instructions */}
            <View style={styles.paymentCard}>
              <Text style={styles.paymentHeader}>💳 Instruksi Pembayaran Transfer / QRIS</Text>
              <Text style={styles.paymentDesc}>
                Silakan lakukan pembayaran sesuai nominal di atas ke salah satu rekening resmi TravelExpress:
              </Text>

              <View style={styles.bankBox}>
                <Text style={styles.bankName}>BCA: 123-456-7890</Text>
                <Text style={styles.bankAccount}>a.n. PT TravelExpress Indonesia</Text>
              </View>

              <View style={styles.bankBox}>
                <Text style={styles.bankName}>Mandiri: 987-000-12345</Text>
                <Text style={styles.bankAccount}>a.n. PT TravelExpress Indonesia</Text>
              </View>

              <View style={styles.qrisHintBox}>
                <Ionicons name="qr-code-outline" size={18} color={COLORS.primary} />
                <Text style={styles.qrisHintText}>
                  Atau tunjukkan Kode Booking di atas saat check-in di lokasi pool keberangkatan.
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            {onOpenPaymentCheck ? (
              <TouchableOpacity
                style={styles.btnConfirmNow}
                onPress={() => {
                  onClose();
                  onOpenPaymentCheck(bookingCode);
                }}
              >
                <Ionicons name="card-outline" size={16} color="#ffffff" />
                <Text style={styles.btnConfirmNowText}>Konfirmasi Pembayaran Sekarang</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity style={styles.btnDone} onPress={onClose}>
              <Text style={styles.btnDoneText}>Selesai & Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end'
  },
  modalContainer: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 20
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12
  },
  successIconBadge: {
    alignItems: 'center',
    marginBottom: 10
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.secondary,
    textAlign: 'center'
  },
  successSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20
  },
  codeCard: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1
  },
  codeValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    marginVertical: 4
  },
  statusBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 4
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#b45309'
  },
  detailCard: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 8
  },
  detailHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: 4
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.textMuted
  },
  detailVal: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.secondary
  },
  detailValHighlight: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary
  },
  detailTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.accentDark
  },
  paymentCard: {
    backgroundColor: '#f8fafc',
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16
  },
  paymentHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: 6
  },
  paymentDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 12
  },
  bankBox: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8
  },
  bankName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.secondary
  },
  bankAccount: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2
  },
  qrisHintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#eff6ff',
    padding: 10,
    borderRadius: 10,
    marginTop: 4
  },
  qrisHintText: {
    fontSize: 11,
    color: COLORS.primary,
    flex: 1,
    fontWeight: '500'
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 8
  },
  btnConfirmNow: {
    backgroundColor: COLORS.accentDark,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8
  },
  btnConfirmNowText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff'
  },
  btnDone: {
    backgroundColor: '#cbd5e1',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center'
  },
  btnDoneText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.secondary
  }
});
