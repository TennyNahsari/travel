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
import { charterService, masterService } from '../services/api';

export default function PublicCharterModal({ visible, onClose, onSuccess }) {
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    vehicleId: '',
    originAddress: '',
    destinationAddress: '',
    charterDate: new Date().toISOString().split('T')[0],
    durationDays: '1',
    totalVehicles: '1',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    notes: '',
    paymentMethod: 'TRANSFER'
  });

  useEffect(() => {
    if (visible) {
      fetchVehicles();
    }
  }, [visible]);

  const fetchVehicles = async () => {
    try {
      setLoadingVehicles(true);
      const res = await masterService.getVehicles();
      if (res?.data) {
        const activeV = res.data.filter(v => v.status === 'ACTIVE');
        setVehicles(activeV);
        if (activeV.length > 0 && !form.vehicleId) {
          setForm(prev => ({ ...prev, vehicleId: activeV[0].id }));
        }
      }
    } catch (err) {
      console.error('Fetch vehicles error:', err);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const selectedVehicle = vehicles.find(v => v.id === form.vehicleId);
  const charterPricePerDay = selectedVehicle?.charterPrice || 1000000;
  const estimatedPrice = charterPricePerDay * (parseInt(form.durationDays, 10) || 1) * (parseInt(form.totalVehicles, 10) || 1);

  const formatRupiah = (val) => 'Rp ' + Number(val || 0).toLocaleString('id-ID');

  const handleSubmit = async () => {
    if (!form.vehicleId) return Alert.alert('Peringatan', 'Pilih armada kendaraan terlebih dahulu.');
    if (!form.originAddress.trim()) return Alert.alert('Peringatan', 'Alamat penjemputan wajib diisi.');
    if (!form.destinationAddress.trim()) return Alert.alert('Peringatan', 'Alamat tujuan wajib diisi.');
    if (!form.customerName.trim()) return Alert.alert('Peringatan', 'Nama lengkap Anda wajib diisi.');
    if (!form.customerPhone.trim()) return Alert.alert('Peringatan', 'Nomor WhatsApp wajib diisi.');

    try {
      setSubmitting(true);
      const res = await charterService.createCharter({
        ...form,
        durationDays: parseInt(form.durationDays, 10) || 1,
        totalVehicles: parseInt(form.totalVehicles, 10) || 1
      });
      
      const createdCharter = res.data || res;
      onSuccess(createdCharter);
    } catch (err) {
      console.error('Create public charter error:', err);
      Alert.alert('Gagal', err.response?.data?.error || 'Gagal membuat pemesanan charter.');
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
              <Text style={styles.headerTitle}>Form Sewa / Charter Armada</Text>
              <Text style={styles.headerSub}>Sewa 1 Unit Mobil Utuh (Rombongan)</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-outline" size={24} color={COLORS.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Vehicle Selection */}
            <Text style={styles.fieldLabel}>Pilih Armada Kendaraan *</Text>
            {loadingVehicles ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 10 }} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {vehicles.map((v) => (
                  <TouchableOpacity
                    key={v.id}
                    style={[styles.vCard, form.vehicleId === v.id && styles.vCardActive]}
                    onPress={() => setForm({ ...form, vehicleId: v.id })}
                  >
                    <Ionicons name="car-sport-outline" size={20} color={form.vehicleId === v.id ? '#ffffff' : COLORS.primary} />
                    <Text style={[styles.vType, form.vehicleId === v.id && styles.vTypeActive]}>{v.vehicleType}</Text>
                    <Text style={[styles.vSub, form.vehicleId === v.id && styles.vSubActive]}>{v.plateNumber} ({v.capacity} Kursi)</Text>
                    <Text style={[styles.vPrice, form.vehicleId === v.id && styles.vPriceActive]}>
                      {formatRupiah(v.charterPrice || 1000000)}/hari
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* User Form */}
            <Text style={styles.fieldLabel}>Nama Lengkap Pemesan *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="cth. Budi Santoso"
              value={form.customerName}
              onChangeText={(val) => setForm({ ...form, customerName: val })}
            />

            <Text style={styles.fieldLabel}>Nomor WhatsApp (Aktif) *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="cth. 081234567890"
              keyboardType="phone-pad"
              value={form.customerPhone}
              onChangeText={(val) => setForm({ ...form, customerPhone: val })}
            />

            <Text style={styles.fieldLabel}>Email (Opsional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="cth. budi@example.com"
              keyboardType="email-address"
              value={form.customerEmail}
              onChangeText={(val) => setForm({ ...form, customerEmail: val })}
            />

            <Text style={styles.fieldLabel}>Alamat Penjemputan Lengkap *</Text>
            <TextInput
              style={[styles.modalInput, { height: 54 }]}
              placeholder="Alamat asal/titik jemput rombongan..."
              multiline
              value={form.originAddress}
              onChangeText={(val) => setForm({ ...form, originAddress: val })}
            />

            <Text style={styles.fieldLabel}>Alamat Tujuan Lengkap *</Text>
            <TextInput
              style={[styles.modalInput, { height: 54 }]}
              placeholder="Alamat kota/lokasi tujuan..."
              multiline
              value={form.destinationAddress}
              onChangeText={(val) => setForm({ ...form, destinationAddress: val })}
            />

            <View style={styles.rowForm}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Tanggal Charter *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="YYYY-MM-DD"
                  value={form.charterDate}
                  onChangeText={(val) => setForm({ ...form, charterDate: val })}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Lama Sewa (Hari)</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="number-pad"
                  value={form.durationDays}
                  onChangeText={(val) => setForm({ ...form, durationDays: val })}
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Jumlah Unit Kendaraan</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="number-pad"
              value={form.totalVehicles}
              onChangeText={(val) => setForm({ ...form, totalVehicles: val })}
            />

            <Text style={styles.fieldLabel}>Catatan Tambahan</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="cth. Membawa koper besar / butuh bagasi ekstra"
              value={form.notes}
              onChangeText={(val) => setForm({ ...form, notes: val })}
            />

            {/* ESTIMATED TOTAL PRICE */}
            <View style={styles.priceCalcCard}>
              <Text style={styles.priceCalcTitle}>Estimasi Total Biaya Charter</Text>
              <Text style={styles.priceCalcVal}>{formatRupiah(estimatedPrice)}</Text>
              <Text style={styles.priceCalcSub}>
                {form.durationDays} Hari × {form.totalVehicles} Unit ({formatRupiah(charterPricePerDay)}/hari)
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
                  <Ionicons name="checkmark-circle-outline" size={18} color="#ffffff" />
                  <Text style={styles.btnSubmitText}>Kirim Pemesanan Charter</Text>
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
  vCard: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
    width: 140,
    gap: 2
  },
  vCardActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  vType: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.secondary
  },
  vTypeActive: {
    color: '#ffffff'
  },
  vSub: {
    fontSize: 10,
    color: COLORS.textMuted
  },
  vSubActive: {
    color: '#bfdbfe'
  },
  vPrice: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.accentDark,
    marginTop: 4
  },
  vPriceActive: {
    color: '#ffffff'
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
