import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Calendar, MapPin, Bus, User, Phone, Mail, FileText, CheckCircle2, AlertTriangle, CreditCard, QrCode, Clock, ShieldCheck } from 'lucide-react';
import api, { qrisService, getImageUrl } from '../../services/api';

const CharterBookingModal = ({ isOpen, onClose, initialVehicle = null }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1); // 1: Form, 2: Success & Payment
  const [vehicles, setVehicles] = useState([]);
  const [cities, setCities] = useState([]);
  const [qrisInfo, setQrisInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingQuota, setCheckingQuota] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState(null);
  const [error, setError] = useState('');
  const [createdCharter, setCreatedCharter] = useState(null);

  // Form State
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [charterDate, setCharterDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
  });
  const [durationDays, setDurationDays] = useState(1);
  const [totalVehicles, setTotalVehicles] = useState(1);
  const [originCity, setOriginCity] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [originAddress, setOriginAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');

  // Payment Proof State
  const [senderName, setSenderName] = useState('');
  const [bankName, setBankName] = useState('BCA');
  const [targetBank, setTargetBank] = useState('BCA');
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchVehicles();
      fetchCities();
      fetchQrisSettings();
      setError('');
      setStep(1);
      setPaymentSuccess(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialVehicle && initialVehicle.id) {
      setSelectedVehicleId(initialVehicle.id);
    }
  }, [initialVehicle]);

  useEffect(() => {
    if (selectedVehicleId && charterDate) {
      checkQuotaAvailability(selectedVehicleId, charterDate);
    }
  }, [selectedVehicleId, charterDate]);

  const fetchVehicles = async () => {
    try {
      const res = await api.get('/vehicles');
      if (res.data?.data) {
        // All ACTIVE vehicles can be chartered
        const charterable = res.data.data.filter(v => v.status === 'ACTIVE');
        setVehicles(charterable);
        if (charterable.length > 0 && !selectedVehicleId) {
          setSelectedVehicleId(initialVehicle?.id || charterable[0].id);
        }
      }
    } catch (e) {
      console.error('Error fetching vehicles for charter:', e);
    }
  };

  const fetchCities = async () => {
    try {
      const res = await api.get('/cities');
      if (res.data?.data) {
        setCities(res.data.data);
      }
    } catch (e) {
      console.error('Error fetching cities:', e);
    }
  };

  const fetchQrisSettings = async () => {
    try {
      const res = await qrisService.getQris();
      if (res.success && res.data) {
        setQrisInfo(res.data);
      }
    } catch (e) {
      console.error('Error fetching QRIS settings:', e);
    }
  };

  const checkQuotaAvailability = async (vId, dateStr) => {
    try {
      setCheckingQuota(true);
      const res = await api.get(`/charters/check-availability?vehicleId=${vId}&charterDate=${dateStr}`);
      if (res.data?.data) {
        setQuotaInfo(res.data.data);
      }
    } catch (e) {
      console.error('Check quota error:', e);
      setQuotaInfo(null);
    } finally {
      setCheckingQuota(false);
    }
  };

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  const calculateTotalPrice = () => {
    if (!selectedVehicle) return 0;
    const price = selectedVehicle.charterPrice > 0 ? selectedVehicle.charterPrice : 1000000;
    return price * (parseInt(durationDays, 10) || 1) * (parseInt(totalVehicles, 10) || 1);
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedVehicleId) {
      setError(t('charter.selectVehicle', 'Pilih armada kendaraan.'));
      return;
    }

    if (quotaInfo && quotaInfo.availableQuota < (parseInt(totalVehicles, 10) || 1)) {
      setError(t('charter.quotaFull', `Kuota charter armada ini pada tanggal ${charterDate} sudah tidak mencukupi (Sisa ${quotaInfo.availableQuota} unit).`));
      return;
    }

    try {
      setLoading(true);
      const fullOrigin = originCity ? `${originCity} - ${originAddress}` : originAddress;
      const fullDestination = destinationCity ? `${destinationCity} - ${destinationAddress}` : destinationAddress;

      const payload = {
        vehicleId: selectedVehicleId,
        charterDate,
        durationDays: parseInt(durationDays, 10) || 1,
        totalVehicles: parseInt(totalVehicles, 10) || 1,
        originAddress: fullOrigin,
        destinationAddress: fullDestination,
        customerName,
        customerPhone,
        customerEmail: customerEmail || null,
        notes: notes || null,
        paymentMethod: 'TRANSFER'
      };

      const res = await api.post('/charters/public', payload);
      if (res.data?.data) {
        setCreatedCharter(res.data.data);
        setStep(2);
      }
    } catch (err) {
      console.error('Charter submit error:', err);
      setError(err.response?.data?.error || t('common.saveError', 'Gagal membuat pemesanan charter.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPaymentProof = async (e) => {
    e.preventDefault();
    if (!createdCharter) return;

    try {
      setPaymentSubmitting(true);
      await api.post(`/charters/public/confirm-payment/${createdCharter.id}`, {
        paymentSenderName: senderName,
        paymentBankName: bankName,
        paymentTargetBank: targetBank,
        paymentProofUrl: paymentProofUrl || null,
        paymentAmount: createdCharter.totalPrice
      });
      setPaymentSuccess(true);
    } catch (err) {
      console.error('Payment submit error:', err);
      alert(err.response?.data?.error || 'Gagal mengunggah bukti pembayaran.');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Ukuran foto maksimal 10MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setPaymentProofUrl(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const getWaLink = () => {
    const rawNum = qrisInfo?.waNumber || '6281234567890';
    let clean = rawNum.replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    if (!clean) clean = '6281234567890';
    const msg = `Halo Admin Travel, saya ingin konfirmasi pembayaran charter armada:\n` +
      `- Kode Charter: ${createdCharter?.charterCode || ''}\n` +
      `- Pemesan: ${createdCharter?.customerName || customerName} (${createdCharter?.customerPhone || customerPhone})\n` +
      `- Armada: ${createdCharter?.vehicle?.vehicleType || ''}\n` +
      `- Tanggal: ${createdCharter?.charterDate || charterDate}\n` +
      `- Total Bayar: Rp ${createdCharter?.totalPrice ? createdCharter.totalPrice.toLocaleString('id-ID') : ''}\n\n` +
      `Berikut bukti pembayaran saya. Mohon segera diproses. Terima kasih.`;
    return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-deep-navy/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden text-left border border-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-deep-navy via-slate-900 to-travel-blue text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-tropical-teal border border-white/20">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                {t('charter.bookTitle', 'Formulir Booking Charter Armada')}
              </h2>
              <p className="text-[11px] text-slate-300">
                {t('charter.bookSubtitle', 'Pesan 1 unit armada penuh untuk kebutuhan dinas, keluarga, atau perjalanan eksklusif.')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleSubmitBooking} className="space-y-5">
              
              {/* Select Armada */}
              <div>
                <label className="block text-xs font-extrabold uppercase text-deep-navy mb-1.5 flex items-center gap-1.5">
                  <Bus className="w-4 h-4 text-travel-blue" />
                  <span>{t('charter.selectVehicle', 'Pilih Armada Kendaraan')} *</span>
                </label>

                {vehicles.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                    ⚠️ Belum ada armada eksekutif yang dikonfigurasi untuk fasilitas charter. Silakan hubungi admin.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {vehicles.map((veh) => {
                      const isSelected = veh.id === selectedVehicleId;
                      return (
                        <div
                          key={veh.id}
                          onClick={() => setSelectedVehicleId(veh.id)}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                            isSelected
                              ? 'bg-travel-blue/10 border-travel-blue ring-2 ring-travel-blue/30'
                              : 'bg-soft-sky/40 border-slate-200 hover:border-travel-blue/50'
                          }`}
                        >
                          <img
                            src={veh.imageUrl || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=300&q=80'}
                            alt={veh.vehicleType}
                            className="w-14 h-12 object-cover rounded-xl border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-deep-navy truncate">{veh.vehicleType}</h4>
                            <p className="text-[10px] text-slate-500 font-medium">Plat: {veh.plateNumber} • {veh.capacity} Kursi</p>
                            <p className="text-xs font-extrabold text-travel-blue mt-0.5">
                              Rp {Number(veh.charterPrice || 0).toLocaleString('id-ID')} / hari
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Date & Quota Live Checker */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase text-deep-navy mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-travel-blue" />
                    <span>{t('charter.charterDate', 'Tanggal Charter')} *</span>
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    value={charterDate}
                    onChange={(e) => setCharterDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-soft-sky/50 border border-slate-200 rounded-xl text-xs font-bold text-deep-navy focus:ring-2 focus:ring-travel-blue outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase text-deep-navy mb-1.5">
                    {t('charter.durationDays', 'Lama Sewa (Hari)')} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-soft-sky/50 border border-slate-200 rounded-xl text-xs font-bold text-deep-navy focus:ring-2 focus:ring-travel-blue outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase text-deep-navy mb-1.5">
                    {t('charter.totalVehicles', 'Jumlah Mobil')} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={quotaInfo ? Math.max(1, quotaInfo.maxCharter) : 10}
                    value={totalVehicles}
                    onChange={(e) => setTotalVehicles(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-soft-sky/50 border border-slate-200 rounded-xl text-xs font-bold text-deep-navy focus:ring-2 focus:ring-travel-blue outline-none"
                  />
                </div>
              </div>

              {/* Quota Status Alert */}
              {checkingQuota ? (
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-travel-blue border-t-transparent rounded-full animate-spin" />
                  <span>Mengecek kuota ketersediaan armada...</span>
                </div>
              ) : quotaInfo ? (
                <div className={`p-3 rounded-2xl text-xs font-bold flex items-center justify-between border ${
                  quotaInfo.availableQuota >= (parseInt(totalVehicles, 10) || 1)
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {quotaInfo.availableQuota >= (parseInt(totalVehicles, 10) || 1) ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span>
                      {quotaInfo.availableQuota >= (parseInt(totalVehicles, 10) || 1)
                        ? `Sisa Kuota Tanggal Ini: ${quotaInfo.availableQuota} dari ${quotaInfo.maxCharter} unit`
                        : `Kuota Tanggal ${charterDate} Habis / Tidak Cukup (Maksimal ${quotaInfo.maxCharter} unit per hari)`}
                    </span>
                  </div>
                  <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-slate-200">
                    {quotaInfo.vehicleType}
                  </span>
                </div>
              ) : null}

              {/* Pickup & Destination Address */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Lokasi Penjemputan & Tujuan</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-deep-navy mb-1">Kota Keberangkatan *</label>
                    <input
                      type="text"
                      value={originCity}
                      onChange={(e) => setOriginCity(e.target.value)}
                      required
                      placeholder="Contoh: Jakarta"
                      className="w-full px-3.5 py-2.5 bg-soft-sky/50 border border-slate-200 rounded-xl text-xs font-medium text-deep-navy outline-none focus:ring-2 focus:ring-travel-blue"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-deep-navy mb-1">Kota Tujuan *</label>
                    <input
                      type="text"
                      value={destinationCity}
                      onChange={(e) => setDestinationCity(e.target.value)}
                      required
                      placeholder="Contoh: Bandung"
                      className="w-full px-3.5 py-2.5 bg-soft-sky/50 border border-slate-200 rounded-xl text-xs font-medium text-deep-navy outline-none focus:ring-2 focus:ring-travel-blue"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-deep-navy mb-1">Alamat Penjemputan Spesifik *</label>
                  <input
                    type="text"
                    value={originAddress}
                    onChange={(e) => setOriginAddress(e.target.value)}
                    required
                    placeholder={t('charter.originAddressPlaceholder', 'Contoh: Jl. Sudirman No. 45, Jakarta Selatan (Rumah / Hotel)')}
                    className="w-full px-3.5 py-2.5 bg-soft-sky/50 border border-slate-200 rounded-xl text-xs font-medium text-deep-navy outline-none focus:ring-2 focus:ring-travel-blue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-deep-navy mb-1">Alamat Tujuan Spesifik *</label>
                  <input
                    type="text"
                    value={destinationAddress}
                    onChange={(e) => setDestinationAddress(e.target.value)}
                    required
                    placeholder={t('charter.destinationAddressPlaceholder', 'Contoh: Villa Istana Bunga Block A3, Lembang, Bandung')}
                    className="w-full px-3.5 py-2.5 bg-soft-sky/50 border border-slate-200 rounded-xl text-xs font-medium text-deep-navy outline-none focus:ring-2 focus:ring-travel-blue"
                  />
                </div>
              </div>

              {/* Customer Details */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Data Pemesan / Penanggung Jawab</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-deep-navy mb-1">Nama Lengkap *</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                      placeholder="Contoh: Budi Santoso"
                      className="w-full px-3.5 py-2 bg-soft-sky/50 border border-slate-200 rounded-xl text-xs font-medium text-deep-navy outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-deep-navy mb-1">No. WhatsApp / HP Active *</label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      required
                      placeholder="Contoh: 081234567890"
                      className="w-full px-3.5 py-2 bg-soft-sky/50 border border-slate-200 rounded-xl text-xs font-medium text-deep-navy outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-deep-navy mb-1">Email Pemesan (Opsional)</label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full px-3.5 py-2 bg-soft-sky/50 border border-slate-200 rounded-xl text-xs font-medium text-deep-navy outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-deep-navy mb-1">Catatan Tambahan</label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Misal: Perlu bagasi ekstra untuk alat shooting"
                      className="w-full px-3.5 py-2 bg-soft-sky/50 border border-slate-200 rounded-xl text-xs font-medium text-deep-navy outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Summary Price Card */}
              <div className="p-4 bg-gradient-to-r from-deep-navy to-travel-blue rounded-2xl text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
                <div>
                  <span className="text-[10px] uppercase font-bold text-tropical-teal tracking-wider block">Estimasi Total Biaya</span>
                  <p className="text-2xl font-extrabold">Rp {calculateTotalPrice().toLocaleString('id-ID')}</p>
                  <p className="text-[11px] text-slate-300">
                    {durationDays} Hari × {totalVehicles} Mobil @ Rp {Number(selectedVehicle?.charterPrice || 0).toLocaleString('id-ID')}/hari
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={loading || (quotaInfo && quotaInfo.availableQuota < (parseInt(totalVehicles, 10) || 1))}
                  className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all"
                >
                  {loading ? 'Memproses...' : 'Konfirmasi Booking Charter →'}
                </button>
              </div>

            </form>
          )}

          {step === 2 && createdCharter && (
            <div className="space-y-6">
              
              {/* Success Banner */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h3 className="text-base font-extrabold text-emerald-900">{t('charter.charterSuccess', 'Pemesanan Charter Berhasil!')}</h3>
                <p className="text-xs text-emerald-700">
                  Kode Charter Anda: <strong className="font-extrabold bg-white px-2 py-0.5 rounded border border-emerald-300">{createdCharter.charterCode}</strong>
                </p>
              </div>

              {/* Payment Deadline Banner */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs font-bold text-amber-900 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>⏰ Paling Telat Bayar:</span>
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-amber-700 bg-white px-2.5 py-0.5 rounded-lg border border-amber-300">
                  {createdCharter.paymentDeadline 
                    ? `${new Date(createdCharter.paymentDeadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}, ${new Date(createdCharter.paymentDeadline).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`
                    : `${new Date(Date.now() + 60*60*1000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`}
                </span>
              </div>

              {/* Order Summary */}
              <div className="p-4 bg-soft-sky rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500 font-semibold">Armada Kendaraan:</span>
                  <span className="font-bold text-deep-navy">{createdCharter.vehicle?.vehicleType}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500 font-semibold">Tanggal & Durasi:</span>
                  <span className="font-bold text-deep-navy">
                    {new Date(createdCharter.charterDate).toLocaleDateString('id-ID')} ({createdCharter.durationDays} Hari, {createdCharter.totalVehicles} Mobil)
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500 font-semibold">Penjemputan:</span>
                  <span className="font-bold text-deep-navy text-right max-w-xs">{createdCharter.originAddress}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500 font-semibold">Tujuan:</span>
                  <span className="font-bold text-deep-navy text-right max-w-xs">{createdCharter.destinationAddress}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-700 font-bold">Total Pembayaran:</span>
                  <span className="font-extrabold text-base text-travel-blue">Rp {createdCharter.totalPrice.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Payment Instructions */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-deep-navy uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-travel-blue" />
                  <span>Instruksi Pembayaran Transfer / QRIS</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Transfer Bank BCA</span>
                    <p className="text-sm font-extrabold text-deep-navy">{qrisInfo?.bankBca || '123-456-7890'}</p>
                    <p className="text-[11px] text-slate-500">a.n. PT Travel Shuttle Indonesia</p>
                  </div>

                  <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Transfer Bank Mandiri</span>
                    <p className="text-sm font-extrabold text-deep-navy">{qrisInfo?.bankMandiri || '987-000-112233'}</p>
                    <p className="text-[11px] text-slate-500">a.n. PT Travel Shuttle Indonesia</p>
                  </div>
                </div>

                {/* QRIS Image if available */}
                <div className="bg-gradient-to-br from-blue-50 to-slate-50 border border-blue-200 rounded-2xl p-4 space-y-2.5 text-center">
                  <div className="flex items-center justify-center gap-1.5 font-bold text-slate-800 text-xs">
                    <QrCode className="w-4 h-4 text-travel-blue" />
                    <span>Pembayaran via QRIS All Payment</span>
                  </div>

                  {qrisInfo && qrisInfo.imageUrl ? (
                    <div className="flex flex-col items-center space-y-2">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm inline-block">
                        <img 
                          src={getImageUrl(qrisInfo.imageUrl)} 
                          alt="QRIS Code" 
                          className="w-44 h-44 object-contain mx-auto rounded-lg"
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-800 font-mono">
                        {qrisInfo.accountName || 'PT Travel Shuttle Indonesia'}
                      </span>
                      <p className="text-[11px] text-slate-600 max-w-xs leading-relaxed">
                        {qrisInfo.instruction || 'Scan QR Code QRIS di atas menggunakan GoPay, OVO, Dana, ShopeePay, BCA Mobile, atau aplikasi e-wallet / mobile banking lainnya.'}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl">
                      QR Code QRIS belum diunggah di sistem pengaturan QRIS. Silakan lakukan pembayaran via Transfer Bank BCA / Mandiri di atas.
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Proof Form */}
              {!paymentSuccess ? (
                <form onSubmit={handleSubmitPaymentProof} className="p-4 bg-soft-sky/70 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-extrabold text-deep-navy uppercase">Upload / Konfirmasi Bukti Pembayaran</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Pemilik Rekening *</label>
                      <input
                        type="text"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        required
                        placeholder="Contoh: Budi Santoso"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Bank Asal *</label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        required
                        placeholder="Contoh: BCA / Mandiri / GoPay"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Upload File Foto Bukti Transfer / Resi *
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-travel-blue/10 file:text-travel-blue hover:file:bg-travel-blue/20 cursor-pointer border border-slate-200 rounded-xl p-1 bg-white"
                    />
                  </div>

                  {paymentProofUrl && (
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center gap-3">
                      <img
                        src={paymentProofUrl}
                        alt="Preview Bukti Transfer"
                        className="w-16 h-16 object-cover rounded-lg border border-slate-300 shrink-0"
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80'; }}
                      />
                      <div className="text-xs">
                        <span className="font-bold text-deep-navy block">Preview Foto Bukti Transfer</span>
                        <span className="text-emerald-600 font-semibold text-[11px]">✓ Foto bukti bayar berhasil dipilih</span>
                      </div>
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400">
                    <span>Atau tempelkan link URL foto: </span>
                    <input
                      type="url"
                      value={paymentProofUrl && !paymentProofUrl.startsWith('data:') ? paymentProofUrl : ''}
                      onChange={(e) => setPaymentProofUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full mt-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none bg-white"
                    />
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <button
                      type="submit"
                      disabled={paymentSubmitting}
                      className="flex-1 py-3 bg-travel-blue hover:bg-travel-blue-hover text-white text-xs font-extrabold rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{paymentSubmitting ? 'Mengirim Bukti Bayar...' : 'Kirim Konfirmasi Pembayaran'}</span>
                    </button>

                    <a
                      href={getWaLink()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.099 4.018 4.018-1.099z" />
                      </svg>
                      <span>Chat WhatsApp Admin</span>
                    </a>
                  </div>
                </form>
              ) : (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center text-xs text-emerald-800 font-bold space-y-1">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                  <p>Bukti pembayaran telah berhasil terkirim! Admin kami akan memverifikasi dalam waktu singkat.</p>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-deep-navy font-bold text-xs rounded-xl transition-colors"
              >
                Tutup Window
              </button>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default CharterBookingModal;
