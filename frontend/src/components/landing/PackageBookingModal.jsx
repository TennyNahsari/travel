import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Package, Calendar, MapPin, Bus, User, Phone, Mail, FileText, CheckCircle2, AlertTriangle, CreditCard, QrCode, Clock, Scale, Copy, Check } from 'lucide-react';
import api, { qrisService, getImageUrl } from '../../services/api';

const PackageBookingModal = ({ isOpen, onClose, initialSchedule = null }) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1); // 1: Form, 2: Payment & Confirmation
  const [qrisInfo, setQrisInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingQuota, setCheckingQuota] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState(null);
  const [error, setError] = useState('');
  const [createdPackage, setCreatedPackage] = useState(null);
  const [copied, setCopied] = useState(false);

  // Form State
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderAddress, setSenderAddress] = useState('');

  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');

  const [packageDescription, setPackageDescription] = useState('');
  const [itemCount, setItemCount] = useState(1);
  const [weightKg, setWeightKg] = useState(1);
  const [notes, setNotes] = useState('');

  // Payment Proof Form State
  const [senderBankName, setSenderBankName] = useState('BCA');
  const [paymentSenderName, setPaymentSenderName] = useState('');
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchQrisSettings();
      setError('');
      setStep(1);
      setPaymentSuccess(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && initialSchedule && initialSchedule.id) {
      checkPackageQuota(initialSchedule.id);
    }
  }, [isOpen, initialSchedule]);

  const fetchQrisSettings = async () => {
    try {
      const res = await qrisService.getQris();
      if (res.success && res.data) {
        setQrisInfo(res.data);
      }
    } catch (e) {
      console.error('Error fetching QRIS settings for package modal:', e);
    }
  };

  const checkPackageQuota = async (scheduleId) => {
    try {
      setCheckingQuota(true);
      const res = await api.get(`/packages/check-availability?scheduleId=${scheduleId}`);
      if (res.data?.data) {
        setQuotaInfo(res.data.data);
      }
    } catch (e) {
      console.error('Error checking package quota:', e);
      setQuotaInfo(null);
    } finally {
      setCheckingQuota(false);
    }
  };

  const calculateTotalPrice = () => {
    const vehPrice = initialSchedule?.vehicle?.packagePricePerKg;
    const pricePerKg = (quotaInfo?.packagePricePerKg > 0) ? quotaInfo.packagePricePerKg : ((vehPrice > 0) ? vehPrice : 10000);
    const kg = parseInt(weightKg, 10) || 1;
    return kg * pricePerKg;
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Ukuran foto bukti transfer maksimal 10MB');
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

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    if (!initialSchedule || !initialSchedule.id) {
      setError('Silakan pilih jadwal keberangkatan terlebih dahulu');
      return;
    }

    // Quota Validation Check
    const reqItems = parseInt(itemCount, 10) || 1;
    const reqKg = parseInt(weightKg, 10) || 1;

    if (quotaInfo) {
      if (quotaInfo.maxPackageCount > 0 && quotaInfo.availableItems < reqItems) {
        setError(`Sisa kuota unit paket pada jadwal ini hanya ${quotaInfo.availableItems} paket.`);
        return;
      }
      if (quotaInfo.maxPackageWeight > 0 && quotaInfo.availableWeight < reqKg) {
        setError(`Sisa kuota berat paket pada jadwal ini hanya ${quotaInfo.availableWeight} Kg.`);
        return;
      }
    }

    try {
      setLoading(true);
      setError('');

      const payload = {
        scheduleId: initialSchedule.id,
        senderName,
        senderPhone,
        senderAddress: senderAddress || null,
        recipientName,
        recipientPhone,
        recipientAddress,
        packageDescription,
        itemCount: reqItems,
        weightKg: reqKg,
        notes: notes || null,
        paymentMethod: 'TRANSFER'
      };

      const res = await api.post('/packages/public', payload);
      if (res.data?.data) {
        setCreatedPackage(res.data.data);
        setStep(2);
      }
    } catch (err) {
      console.error('Submit package booking error:', err);
      setError(err.response?.data?.error || 'Gagal membuat pemesanan pengiriman paket.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPaymentProof = async (e) => {
    e.preventDefault();
    if (!createdPackage) return;

    try {
      setPaymentSubmitting(true);
      await api.post(`/packages/public/confirm-payment/${createdPackage.id}`, {
        paymentSenderName: paymentSenderName || senderName,
        paymentBankName: senderBankName,
        paymentTargetBank: 'BCA',
        paymentProofUrl: paymentProofUrl || null,
        paymentAmount: createdPackage.totalPrice
      });
      setPaymentSuccess(true);
    } catch (err) {
      console.error('Package payment proof error:', err);
      alert(err.response?.data?.error || 'Gagal mengunggah bukti pembayaran paket.');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const getWaLink = () => {
    const rawNum = qrisInfo?.waNumber || '6281234567890';
    let clean = rawNum.replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    if (!clean) clean = '6281234567890';

    const msg = `Halo Admin Travel, saya ingin konfirmasi pembayaran pengiriman paket:\n` +
      `- Kode Paket: ${createdPackage?.packageCode || ''}\n` +
      `- Pengirim: ${createdPackage?.senderName || senderName} (${createdPackage?.senderPhone || senderPhone})\n` +
      `- Penerima: ${createdPackage?.recipientName || recipientName} (${createdPackage?.recipientPhone || recipientPhone})\n` +
      `- Rute: ${createdPackage?.schedule?.route?.originCity?.name || ''} → ${createdPackage?.schedule?.route?.destinationCity?.name || ''}\n` +
      `- Barang & Berat: ${createdPackage?.packageDescription} (${createdPackage?.weightKg} Kg, ${createdPackage?.itemCount} Paket)\n` +
      `- Total Bayar: Rp ${(createdPackage?.totalPrice || 0).toLocaleString('id-ID')}\n\n` +
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
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-amber-400 border border-white/20">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                {t('package.modalTitle', 'Formulir Pengiriman Paket / Kargo')}
              </h2>
              <p className="text-[11px] text-slate-300">
                {t('package.modalSubtitle', 'Kirim dokumen dan barang ekspres antar kota bersama armada travel shuttle.')}
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
              
              {/* Schedule Info Banner */}
              {initialSchedule && (
                <div className="p-4 bg-soft-sky/80 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                    <span className="font-extrabold text-deep-navy text-sm">
                      {initialSchedule.route?.originCity?.name} → {initialSchedule.route?.destinationCity?.name}
                    </span>
                    <span className="px-2 py-0.5 bg-travel-blue text-white font-extrabold text-[10px] rounded-full">
                      ⏰ {initialSchedule.departureTime} WIB
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between text-slate-600 gap-2 pt-1">
                    <span>🚐 <strong>Armada:</strong> {initialSchedule.vehicle?.vehicleType} ({initialSchedule.vehicle?.plateNumber})</span>
                    <span>📅 <strong>Tanggal:</strong> {new Date(initialSchedule.departureDate).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
              )}

              {/* Quota Status Alert */}
              {checkingQuota ? (
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-travel-blue border-t-transparent rounded-full animate-spin" />
                  <span>Mengecek kuota kapasitas paket pada jadwal ini...</span>
                </div>
              ) : (
                <div className={`p-3 rounded-2xl text-xs font-bold border ${
                  (!quotaInfo || (quotaInfo.availableItems > 0 && quotaInfo.availableWeight > 0))
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {(!quotaInfo || (quotaInfo.availableItems > 0 && quotaInfo.availableWeight > 0)) ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span>
                      {(!quotaInfo || (quotaInfo.availableItems > 0 && quotaInfo.availableWeight > 0))
                        ? `Sisa Kuota Paket Jadwal Ini: ${quotaInfo?.availableItems ?? 5} Unit / ${quotaInfo?.availableWeight ?? 50} Kg`
                        : `Kapasitas Paket Jadwal Ini Penuh (Maksimal ${quotaInfo.maxPackageCount} Unit / ${quotaInfo.maxPackageWeight} Kg)`}
                    </span>
                  </div>
                </div>
              )}

              {/* Data Pengirim */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-travel-blue" />
                  <span>Data Pengirim (Sender)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-deep-navy mb-1">Nama Pengirim *</label>
                    <input
                      type="text"
                      required
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="Contoh: Ahmad Yani"
                      className="w-full px-3.5 py-2.5 bg-soft-sky/50 border border-slate-200 rounded-xl text-xs font-medium text-deep-navy outline-none focus:ring-2 focus:ring-travel-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-deep-navy mb-1">No. WhatsApp Pengirim *</label>
                    <input
                      type="tel"
                      required
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      placeholder="0812xxxxxxx"
                      className="w-full px-3.5 py-2.5 bg-soft-sky/50 border border-slate-200 rounded-xl text-xs font-medium text-deep-navy outline-none focus:ring-2 focus:ring-travel-blue"
                    />
                  </div>
                </div>
              </div>

              {/* Data Penerima */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Data Penerima (Recipient)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-deep-navy mb-1">Nama Penerima *</label>
                    <input
                      type="text"
                      required
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Contoh: Siti Rahma"
                      className="w-full px-3.5 py-2.5 bg-soft-sky/50 border border-slate-200 rounded-xl text-xs font-medium text-deep-navy outline-none focus:ring-2 focus:ring-travel-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-deep-navy mb-1">No. WhatsApp Penerima *</label>
                    <input
                      type="tel"
                      required
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      placeholder="0857xxxxxxx"
                      className="w-full px-3.5 py-2.5 bg-soft-sky/50 border border-slate-200 rounded-xl text-xs font-medium text-deep-navy outline-none focus:ring-2 focus:ring-travel-blue"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-deep-navy mb-1">Alamat Tujuan Lengkap Penerima *</label>
                  <input
                    type="text"
                    required
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    placeholder="Contoh: Jl. Dipatiukur No. 12, Bandung (Ambil di Pool Pasteur)"
                    className="w-full px-3.5 py-2.5 bg-soft-sky/50 border border-slate-200 rounded-xl text-xs font-medium text-deep-navy outline-none focus:ring-2 focus:ring-travel-blue"
                  />
                </div>
              </div>

              {/* Detail Paket */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-amber-500" />
                  <span>Detail Barang & Paket</span>
                </h4>

                <div>
                  <label className="block text-xs font-bold text-deep-navy mb-1">Deskripsi / Isi Paket *</label>
                  <input
                    type="text"
                    required
                    value={packageDescription}
                    onChange={(e) => setPackageDescription(e.target.value)}
                    placeholder="Contoh: Dokumen penting & Pakaian (Kardus ukuran sedang)"
                    className="w-full px-3.5 py-2.5 bg-soft-sky/50 border border-slate-200 rounded-xl text-xs font-medium text-deep-navy outline-none focus:ring-2 focus:ring-travel-blue"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-deep-navy mb-1">Jumlah Unit Barang *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={itemCount}
                      onChange={(e) => setItemCount(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-soft-sky/50 border border-slate-200 rounded-xl text-xs font-bold text-deep-navy outline-none focus:ring-2 focus:ring-travel-blue"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-deep-navy mb-1">Berat Total Paket (Kg) *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-soft-sky/50 border border-slate-200 rounded-xl text-xs font-bold text-deep-navy outline-none focus:ring-2 focus:ring-travel-blue"
                    />
                  </div>
                </div>
              </div>

              {/* Price Banner */}
              <div className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-soft-sky rounded-2xl border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-amber-800 tracking-wider block">Est. Biaya Pengiriman</span>
                  <span className="text-xs text-slate-500">
                    {weightKg} Kg × Rp {(quotaInfo?.packagePricePerKg || initialSchedule?.vehicle?.packagePricePerKg || 10000).toLocaleString('id-ID')}/Kg
                  </span>
                </div>
                <span className="text-xl font-extrabold text-amber-600">
                  Rp {calculateTotalPrice().toLocaleString('id-ID')}
                </span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || (quotaInfo && (quotaInfo.availableItems <= 0 || quotaInfo.availableWeight <= 0))}
                className="w-full py-3.5 bg-travel-blue hover:bg-travel-blue-hover disabled:bg-slate-300 text-white font-extrabold rounded-2xl shadow-lg transition-all text-sm flex items-center justify-center gap-2"
              >
                {loading ? 'Memproses Pemesanan...' : 'Pesan Pengiriman Paket'}
              </button>

            </form>
          )}

          {step === 2 && createdPackage && (
            <div className="space-y-6">
              
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs space-y-1.5 text-center">
                <span className="font-extrabold text-sm block">🎉 Pemesanan Paket Berhasil Dibuat!</span>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <span className="text-xs font-semibold text-emerald-800">Kode Tracking Paket Anda:</span>
                  <strong className="text-sm font-mono text-emerald-950 font-extrabold bg-white px-2.5 py-1 rounded-lg border border-emerald-300">
                    {createdPackage.packageCode}
                  </strong>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(createdPackage.packageCode);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0"
                    title="Salin Kode Tracking"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Tersalin!' : 'Salin Kode'}</span>
                  </button>
                </div>
              </div>

              {/* Payment Deadline Banner */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs font-bold text-amber-900 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>⏰ Paling Telat Bayar:</span>
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-amber-700 bg-white px-2.5 py-0.5 rounded-lg border border-amber-300">
                  {createdPackage.paymentDeadline 
                    ? `${new Date(createdPackage.paymentDeadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}, ${new Date(createdPackage.paymentDeadline).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`
                    : `${new Date(Date.now() + 60*60*1000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`}
                </span>
              </div>

              {/* Summary Card */}
              <div className="p-4 bg-soft-sky rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500 font-semibold">Pengirim:</span>
                  <span className="font-bold text-deep-navy">{createdPackage.senderName} ({createdPackage.senderPhone})</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500 font-semibold">Penerima:</span>
                  <span className="font-bold text-deep-navy">{createdPackage.recipientName} ({createdPackage.recipientPhone})</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500 font-semibold">Deskripsi & Berat:</span>
                  <span className="font-bold text-deep-navy">{createdPackage.packageDescription} ({createdPackage.weightKg} Kg, {createdPackage.itemCount} Paket)</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500 font-semibold">Alamat Tujuan:</span>
                  <span className="font-bold text-deep-navy text-right max-w-xs">{createdPackage.recipientAddress}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-700 font-bold">Total Biaya:</span>
                  <span className="font-extrabold text-base text-amber-600">Rp {createdPackage.totalPrice.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Payment Instructions */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-deep-navy uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-travel-blue" />
                  <span>Instruksi Pembayaran Transfer / QRIS</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
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

                {/* QRIS Image */}
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
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl">
                      QR Code QRIS belum diunggah di sistem pengaturan. Silakan transfer via rekening bank di atas.
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Proof Upload Form */}
              {!paymentSuccess ? (
                <form onSubmit={handleSubmitPaymentProof} className="p-4 bg-soft-sky/70 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-extrabold text-deep-navy uppercase">Upload / Konfirmasi Bukti Pembayaran</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Pemilik Rekening *</label>
                      <input
                        type="text"
                        required
                        value={paymentSenderName}
                        onChange={(e) => setPaymentSenderName(e.target.value)}
                        placeholder="Contoh: Ahmad Yani"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Bank Asal *</label>
                      <input
                        type="text"
                        required
                        value={senderBankName}
                        onChange={(e) => setSenderBankName(e.target.value)}
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
                        <span className="text-emerald-600 font-semibold text-[11px]">✓ Foto resi berhasil dipilih</span>
                      </div>
                    </div>
                  )}

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
                      className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2 shrink-0"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.099 4.018 4.018-1.099z" />
                      </svg>
                      <span>Chat WA Admin</span>
                    </a>
                  </div>
                </form>
              ) : (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center text-xs text-emerald-800 font-bold space-y-1">
                  <span>✓ Konfirmasi bukti pembayaran telah terkirim! Tim admin akan segera memverifikasi.</span>
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default PackageBookingModal;
