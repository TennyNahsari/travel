import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../config/theme';
import { bookingService } from '../services/api';

export default function BookingModal({ visible, schedule, onClose, onSuccess }) {
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [passengerEmail, setPassengerEmail] = useState('');
  const [passengerNik, setPassengerNik] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!schedule) return null;

  const capacity = schedule.vehicle?.capacity || 10;
  const ticketPrice = Number(schedule.ticketPrice) || 0;
  const totalCost = selectedSeats.length * ticketPrice;

  const toggleSeat = (seatNum) => {
    if (selectedSeats.includes(seatNum)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seatNum));
    } else {
      setSelectedSeats([...selectedSeats, seatNum].sort((a, b) => a - b));
    }
  };

  const handleConfirmBooking = async () => {
    setError('');
    if (selectedSeats.length === 0) {
      setError('Pilih minimal 1 nomor kursi.');
      return;
    }
    if (!passengerName.trim()) {
      setError('Nama penumpang wajib diisi.');
      return;
    }
    if (!passengerPhone.trim()) {
      setError('Nomor WhatsApp / HP wajib diisi.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        scheduleId: schedule.id,
        seatNumbers: selectedSeats.map((s) => String(s)),
        passengerName: passengerName.trim(),
        passengerPhone: passengerPhone.trim(),
        passengerEmail: passengerEmail.trim() || undefined,
        passengerNik: passengerNik.trim() || undefined
      };

      const result = await bookingService.createBooking(payload);
      setLoading(false);
      onSuccess(result.data);
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.error || 'Gagal membuat booking. Silakan coba lagi.';
      setError(errMsg);
    }
  };

  const formatRupiah = (val) => {
    return 'Rp ' + Number(val).toLocaleString('id-ID');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Pemesanan Tiket Travel</Text>
              <Text style={styles.modalSubtitle}>
                {schedule.route?.originCity?.name} → {schedule.route?.destinationCity?.name}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.btnClose}>
              <Ionicons name="close" size={24} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Error Alert */}
            {error ? (
              <View style={styles.errorCard}>
                <Ionicons name="alert-circle-outline" size={18} color={COLORS.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Schedule Summary Banner */}
            <View style={styles.scheduleBanner}>
              <View style={styles.bannerRow}>
                <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
                <Text style={styles.bannerText}>{formatDate(schedule.departureDate)}</Text>
                <Text style={styles.bannerDot}>•</Text>
                <Ionicons name="time-outline" size={16} color={COLORS.primary} />
                <Text style={styles.bannerText}>{schedule.departureTime} WIB</Text>
              </View>

              <View style={styles.bannerRow}>
                <Ionicons name="bus-outline" size={16} color={COLORS.primary} />
                <Text style={styles.bannerText}>
                  {schedule.vehicle?.vehicleType} ({schedule.vehicle?.plateNumber})
                </Text>
              </View>

              <View style={styles.priceTag}>
                <Text style={styles.priceLabel}>Harga per Kursi:</Text>
                <Text style={styles.priceValue}>{formatRupiah(ticketPrice)}</Text>
              </View>
            </View>

            {/* Seat Selection Section */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>💺 Pilih Nomor Kursi Armada</Text>
              <Text style={styles.sectionDesc}>
                Tersedia {schedule.availableSeats} dari total {capacity} kursi.
              </Text>

              <View style={styles.seatGrid}>
                {Array.from({ length: capacity }, (_, i) => i + 1).map((seatNum) => {
                  const isSelected = selectedSeats.includes(seatNum);
                  return (
                    <TouchableOpacity
                      key={seatNum}
                      style={[styles.seatBox, isSelected && styles.seatBoxSelected]}
                      onPress={() => toggleSeat(seatNum)}
                    >
                      <Ionicons
                        name="car-sport-outline"
                        size={18}
                        color={isSelected ? '#ffffff' : COLORS.primary}
                      />
                      <Text style={[styles.seatNumText, isSelected && styles.seatNumTextSelected]}>
                        #{seatNum}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {selectedSeats.length > 0 && (
                <View style={styles.seatSummaryBox}>
                  <Text style={styles.seatSummaryText}>
                    Kursi Terpilih: <Text style={styles.seatBold}>{selectedSeats.join(', ')}</Text>
                  </Text>
                </View>
              )}
            </View>

            {/* Passenger Information Form */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>👤 Data Penumpang / Customer</Text>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Nama Penumpang *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Contoh: Budi Santoso"
                  value={passengerName}
                  onChangeText={setPassengerName}
                  placeholderTextColor={COLORS.textLight}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>No. WhatsApp / HP *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Contoh: 081234567890"
                  keyboardType="phone-pad"
                  value={passengerPhone}
                  onChangeText={setPassengerPhone}
                  placeholderTextColor={COLORS.textLight}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Email Customer (Opsional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="budi@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={passengerEmail}
                  onChangeText={setPassengerEmail}
                  placeholderTextColor={COLORS.textLight}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>No. KTP / NIK (Opsional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="3201xxxxxxxxxxxx"
                  keyboardType="numeric"
                  value={passengerNik}
                  onChangeText={setPassengerNik}
                  placeholderTextColor={COLORS.textLight}
                />
              </View>
            </View>

            {/* Cost Breakdown */}
            <View style={styles.costBox}>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Total ({selectedSeats.length} Kursi):</Text>
                <Text style={styles.costAmount}>{formatRupiah(totalCost)}</Text>
              </View>
            </View>
          </ScrollView>

          {/* Modal Footer / Action Button */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.btnCancel} onPress={onClose}>
              <Text style={styles.btnCancelText}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btnSubmit, loading && styles.btnDisabled]}
              onPress={handleConfirmBooking}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#ffffff" />
                  <Text style={styles.btnSubmitText}>Konfirmasi Booking</Text>
                </>
              )}
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
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end'
  },
  modalContainer: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 24
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.secondary
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2
  },
  btnClose: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: COLORS.inputBg
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '500',
    flex: 1
  },
  scheduleBanner: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    gap: 8
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  bannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.secondary
  },
  bannerDot: {
    color: COLORS.textMuted
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#dbeafe'
  },
  priceLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500'
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary
  },
  sectionContainer: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: 4
  },
  sectionDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 12
  },
  seatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  seatBox: {
    width: '22%',
    aspectRatio: 1.1,
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4
  },
  seatBoxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  seatNumText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary
  },
  seatNumTextSelected: {
    color: '#ffffff'
  },
  seatSummaryBox: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 12
  },
  seatSummaryText: {
    fontSize: 13,
    color: COLORS.accentDark
  },
  seatBold: {
    fontWeight: '800'
  },
  formGroup: {
    marginBottom: 12
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: 6
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textMain
  },
  costBox: {
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  costLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary
  },
  costAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center'
  },
  btnCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted
  },
  btnSubmit: {
    flex: 2,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnDisabled: {
    opacity: 0.6
  },
  btnSubmitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff'
  }
});
