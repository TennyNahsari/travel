import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../config/theme';
import { packageService, scheduleService } from '../services/api';

export default function PublicPackageModal({ visible, onClose, onSuccess }) {
  const [schedules, setSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    scheduleId: '',
    senderName: '',
    senderPhone: '',
    senderAddress: '',
    recipientName: '',
    recipientPhone: '',
    recipientAddress: '',
    packageDescription: '',
    itemCount: '1',
    weightKg: '1',
    notes: '',
    paymentMethod: 'TRANSFER'
  });

  useEffect(() => {
    if (visible) {
      fetchSchedules();
    }
  }, [visible]);

  const fetchSchedules = async () => {
    try {
      setLoadingSchedules(true);
      const res = await scheduleService.getAvailableSchedules();
      if (res?.data) {
        setSchedules(res.data);
        if (res.data.length > 0 && !form.scheduleId) {
          setForm(prev => ({ ...prev, scheduleId: res.data[0].id }));
        }
      }
    } catch (err) {
      console.error('Fetch schedules error:', err);
    } finally {
      setLoadingSchedules(false);
    }
  };

  const selectedSchedule = schedules.find(s => s.id === form.scheduleId);
  const pricePerKg = selectedSchedule?.vehicle?.packagePricePerKg || 10000;
  const estimatedPrice = pricePerKg * (parseInt(form.weightKg, 10) || 1);

  const formatRupiah = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

  const handleSubmit = async () => {
    if (!form.scheduleId) return Alert.alert('Peringatan', 'Pilih jadwal keberangkatan shuttle terlebih dahulu.');
    if (!form.packageDescription.trim()) return Alert.alert('Peringatan', 'Deskripsi barang/paket wajib diisi.');
    if (!form.senderName.trim()) return Alert.alert('Peringatan', 'Nama pengirim wajib diisi.');
    if (!form.senderPhone.trim()) return Alert.alert('Peringatan', 'No. WhatsApp pengirim wajib diisi.');
    if (!form.recipientName.trim()) return Alert.alert('Peringatan', 'Nama penerima wajib diisi.');
    if (!form.recipientPhone.trim()) return Alert.alert('Peringatan', 'No. WhatsApp penerima wajib diisi.');
    if (!form.recipientAddress.trim()) return Alert.alert('Peringatan', 'Alamat tujuan penerima wajib diisi.');

    try {
      setSubmitting(true);
      const res = await packageService.createPackage({
        ...form,
        itemCount: parseInt(form.itemCount, 10) || 1,
        weightKg: parseInt(form.weightKg, 10) || 1
      });

      const createdPackage = res.data || res;
      onSuccess(createdPackage);
    } catch (err) {
      console.error('Create public package error:', err);
      Alert.alert('Gagal', err.response?.data?.error || 'Gagal membuat pengiriman paket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.headerTitle}>Form Pengiriman Paket & Kargo</Text>
              <Text style={styles.headerSub}>Ekspedisi Cepat Antar Kota Via Shuttle</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-outline" size={24} color={COLORS.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Schedule Selection */}
            <Text style={styles.fieldLabel}>Pilih Jadwal Perjalanan Shuttle *</Text>
            {loadingSchedules ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 10 }} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {schedules.map((s) => {
                  const label = `${s.route?.originCity?.name || ''} → ${s.route?.destinationCity?.name || ''}`;
                  const isSelected = form.scheduleId === s.id;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.sCard, isSelected && styles.sCardActive]}
                      onPress={() => setForm({ ...form, scheduleId: s.id })}
                    >
                      <Ionicons name="bus-outline" size={18} color={isSelected ? '#ffffff' : COLORS.primary} />
                      <Text style={[styles.sRoute, isSelected && styles.sRouteActive]}>{label}</Text>
                      <Text style={[styles.sSub, isSelected && styles.sSubActive]}>
                        {new Date(s.departureDate).toLocaleDateString('id-ID')} | {s.departureTime} WIB
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* Package Items */}
            <Text style={styles.fieldLabel}>Deskripsi Barang / Paket *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="cth. Dokumen Penting / Dus Pakaian"
              value={form.packageDescription}
              onChangeText={(val) => setForm({ ...form, packageDescription: val })}
            />

            <View style={styles.rowForm}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Berat (Kg) *</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="number-pad"
                  value={form.weightKg}
                  onChangeText={(val) => setForm({ ...form, weightKg: val })}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Jumlah Unit / Koli</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="number-pad"
                  value={form.itemCount}
                  onChangeText={(val) => setForm({ ...form, itemCount: val })}
                />
              </View>
            </View>

            {/* Sender Data */}
            <Text style={styles.sectionHeading}>IDENTITAS PENGIRIM</Text>
            <Text style={styles.fieldLabel}>Nama Pengirim *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="cth. Andi Pratama"
              value={form.senderName}
              onChangeText={(val) => setForm({ ...form, senderName: val })}
            />

            <Text style={styles.fieldLabel}>No. WhatsApp Pengirim *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="cth. 08123456789"
              keyboardType="phone-pad"
              value={form.senderPhone}
              onChangeText={(val) => setForm({ ...form, senderPhone: val })}
            />

            <Text style={styles.fieldLabel}>Alamat Pengirim (Opsional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Alamat asal pengirim..."
              value={form.senderAddress}
              onChangeText={(val) => setForm({ ...form, senderAddress: val })}
            />

            {/* Recipient Data */}
            <Text style={styles.sectionHeading}>IDENTITAS PENERIMA</Text>
            <Text style={styles.fieldLabel}>Nama Penerima *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="cth. Rina Wati"
              value={form.recipientName}
              onChangeText={(val) => setForm({ ...form, recipientName: val })}
            />

            <Text style={styles.fieldLabel}>No. WhatsApp Penerima *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="cth. 08987654321"
              keyboardType="phone-pad"
              value={form.recipientPhone}
              onChangeText={(val) => setForm({ ...form, recipientPhone: val })}
            />

            <Text style={styles.fieldLabel}>Alamat Tujuan Penerima Lengkap *</Text>
            <TextInput
              style={[styles.modalInput, { height: 54 }]}
              placeholder="Alamat lengkap tujuan paket di kota tujuan..."
              multiline
              value={form.recipientAddress}
              onChangeText={(val) => setForm({ ...form, recipientAddress: val })}
            />

            {/* ESTIMATED TOTAL PRICE */}
            <View style={styles.priceCalcCard}>
              <Text style={styles.priceCalcTitle}>Estimasi Total Ongkos Kirim</Text>
              <Text style={styles.priceCalcVal}>{formatRupiah(estimatedPrice)}</Text>
              <Text style={styles.priceCalcSub}>
                {form.weightKg} Kg × {formatRupiah(pricePerKg)}/Kg
              </Text>
            </View>
          </ScrollView>

          {/* Footer Submit */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.btnSubmit, submitting && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="cube-outline" size={18} color="#ffffff" />
                  <Text style={styles.btnSubmitText}>Kirim Pemesanan Paket</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end'
  },
  modalContainer: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
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
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 14
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: 4,
    marginTop: 10
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 16,
    marginBottom: 4
  },
  modalInput: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.secondary,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  sCard: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
    width: 170,
    gap: 2
  },
  sCardActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  sRoute: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.secondary
  },
  sRouteActive: {
    color: '#ffffff'
  },
  sSub: {
    fontSize: 10,
    color: COLORS.textMuted
  },
  sSubActive: {
    color: '#bfdbfe'
  },
  rowForm: {
    flexDirection: 'row',
    gap: 10
  },
  priceCalcCard: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20
  },
  priceCalcTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase'
  },
  priceCalcVal: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    marginVertical: 2
  },
  priceCalcSub: {
    fontSize: 10,
    color: COLORS.textMuted
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  btnSubmit: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
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
