import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Search, CreditCard, CheckCircle2, AlertCircle, Image, Building2, User, DollarSign, Calendar, MapPin, Bus, FileText, QrCode } from 'lucide-react';
import api, { qrisService, getImageUrl } from '../../services/api';

const formatCurrency = (val) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);
};

const formatDate = (dateString, locale = 'id-ID') => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const PaymentConfirmationModal = ({ isOpen, onClose, initialBookingCode = '' }) => {
  const { t } = useTranslation();
  const [searchCode, setSearchCode] = useState(initialBookingCode);
  const [bookingData, setBookingData] = useState(null);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [qrisData, setQrisData] = useState(null);

  useEffect(() => {
    const fetchQris = async () => {
      try {
        const res = await qrisService.getQris();
        if (res.success && res.data) {
          setQrisData(res.data);
        }
      } catch (e) {
        console.error('Error loading QRIS in payment modal:', e);
      }
    };
    if (isOpen) {
      fetchQris();
    }
  }, [isOpen]);

  // Confirmation Form state
  const [form, setForm] = useState({
    senderName: '',
    bankName: 'BCA',
    targetBank: 'PT Travel Shuttle Indonesia (BCA)',
    transferAmount: '',
    paymentProofUrl: '',
    notes: ''
  });

  if (!isOpen) return null;

  const handleSearchBooking = async (e) => {
    if (e) e.preventDefault();
    if (!searchCode.trim()) {
      setError(t('booking.enterBookingCode', 'Masukkan Kode Booking terlebih dahulu'));
      return;
    }

    setSearching(true);
    setError('');
    setSuccessMessage('');
    setBookingData(null);

    try {
      const res = await api.get(`/bookings/public/code/${searchCode.trim()}`);
      if (res.data && res.data.success && res.data.data) {
        const booking = res.data.data;
        setBookingData(booking);
        setForm({
          senderName: booking.paymentSenderName || booking.passengerName || '',
          bankName: booking.paymentBankName || 'BCA',
          targetBank: booking.paymentTargetBank || 'PT Travel Shuttle Indonesia (BCA)',
          transferAmount: booking.paymentAmount || booking.totalPrice || '',
          paymentProofUrl: booking.paymentProofUrl || '',
          notes: booking.paymentNotes || ''
        });
      } else {
        setError(res.data?.error || t('booking.codeNotFound', 'Kode Booking tidak ditemukan.'));
      }
    } catch (err) {
      console.error('Error searching booking code:', err);
      setError(err.response?.data?.error || t('booking.codeNotFound', 'Kode Booking tidak ditemukan. Silakan periksa kembali.'));
    } finally {
      setSearching(false);
    }
  };

  const handleSubmitConfirmation = async (e) => {
    e.preventDefault();
    if (!bookingData) return;

    if (!form.senderName.trim() || !form.bankName.trim()) {
      setError(t('booking.fillRequiredFields', 'Nama Pengirim dan Bank Asal wajib diisi'));
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const payload = {
        bookingCode: bookingData.bookingCode,
        senderName: form.senderName,
        bankName: form.bankName,
        targetBank: form.targetBank,
        transferAmount: form.transferAmount ? parseInt(form.transferAmount) : bookingData.totalPrice,
        paymentProofUrl: form.paymentProofUrl || null,
        notes: form.notes
      };

      const res = await api.post('/bookings/public/confirm-payment', payload);
      if (res.data && res.data.success) {
        setSuccessMessage(res.data.message || t('booking.confirmSuccess', 'Konfirmasi pembayaran berhasil dikirim! Staf kami akan segera memverifikasi.'));
        setBookingData(res.data.data);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(res.data?.error || t('booking.confirmFailed', 'Gagal mengonfirmasi pembayaran.'));
      }
    } catch (err) {
      console.error('Error submitting payment confirmation:', err);
      setError(err.response?.data?.error || t('booking.confirmFailed', 'Gagal mengonfirmasi pembayaran.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError(t('booking.fileTooLarge', 'Ukuran foto maksimal 10MB'));
        return;
      }
      setError('');
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        // Immediately set paymentProofUrl so it is available instantly
        setForm((prev) => ({ ...prev, paymentProofUrl: dataUrl }));

        try {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const maxDim = 800;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.75);
            setForm((prev) => ({ ...prev, paymentProofUrl: compressed }));
          };
          img.src = dataUrl;
        } catch (err) {
          console.warn('Canvas compression error:', err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const getWaLink = () => {
    if (!bookingData) return '#';
    const rawNumber = import.meta.env.VITE_WA_NUMBER || '6281234567890';
    const waNumber = rawNumber.replace(/[^0-9]/g, '');

    const text =
      `*KONFIRMASI PEMBAYARAN TIKET TRAVEL*\n` +
      `----------------------------------\n` +
      `• *Kode Booking:* ${bookingData.bookingCode}\n` +
      `• *Nama Pemesan:* ${bookingData.passengerName || bookingData.user?.name || '-'}\n` +
      `• *No. WhatsApp:* ${bookingData.passengerPhone || '-'}\n` +
      `• *Rute Perjalanan:* ${bookingData.schedule?.route?.originCity?.name || ''} → ${bookingData.schedule?.route?.destinationCity?.name || ''}\n` +
      `• *Waktu Keberangkatan:* ${formatDate(bookingData.schedule?.departureDate, t('common.locale'))} (${bookingData.schedule?.departureTime})\n` +
      `• *Nomor Kursi:* ${(bookingData.seatNumbers || []).join(', ')}\n` +
      `• *Total Tagihan:* ${formatCurrency(bookingData.totalPrice)}\n` +
      `• *Bank Asal:* ${form.bankName || '-'}\n` +
      `• *Nama Rekening Pengirim:* ${form.senderName || '-'}\n` +
      `----------------------------------\n` +
      `Halo Admin, saya sudah melakukan konfirmasi pembayaran tiket. Mohon bantuannya untuk memverifikasi. Terima kasih!`;

    return `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-3 sm:p-4 text-left">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto border border-gray-100 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-blue-900 to-indigo-800 text-white rounded-t-2xl sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-5 h-5 text-blue-300" />
            <h3 className="text-base sm:text-lg font-bold">
              {t('booking.paymentConfirmationTitle', 'Cek Status & Konfirmasi Pembayaran')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white transition p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Search Box */}
          <form onSubmit={handleSearchBooking} className="space-y-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              {t('booking.searchByCode', 'Cari Berdasarkan Kode Booking')}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: TRV-583920"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none text-sm uppercase font-bold tracking-wider"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
              </div>
              <button
                type="submit"
                disabled={searching}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-md disabled:opacity-50 flex items-center gap-1.5 shrink-0"
              >
                {searching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span>Mencari...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Cari Tiket</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Feedback Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs sm:text-sm flex items-start gap-2.5 font-medium">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Initial State Payment Info Card (Shown before searching booking code) */}
          {!bookingData && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-200 rounded-xl p-4 space-y-3">
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 border-b border-blue-100 pb-2">
                <QrCode className="w-4 h-4 text-blue-600" />
                <span>Informasi Rekening Pembayaran Transfer & QRIS</span>
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1 font-mono text-[11px]">
                  <span className="font-sans font-bold text-slate-700 block text-xs">Rekening Bank Transfer:</span>
                  <div><span className="text-gray-500 font-sans">BCA:</span> <strong>{qrisData?.bankBca || '123-456-7890 (a.n. PT Travel Shuttle)'}</strong></div>
                  <div><span className="text-gray-500 font-sans">Mandiri:</span> <strong>{qrisData?.bankMandiri || '987-000-112233 (a.n. PT Travel Shuttle)'}</strong></div>
                  {qrisData?.bankOther && (
                    <div><span className="text-gray-500 font-sans">Lainnya:</span> <strong>{qrisData.bankOther}</strong></div>
                  )}
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col items-center justify-center text-center space-y-1.5">
                  <span className="font-sans font-bold text-slate-700 block text-xs">Scan Barcode QRIS:</span>
                  {qrisData && qrisData.imageUrl ? (
                    <div className="flex flex-col items-center space-y-1">
                      <img 
                        src={getImageUrl(qrisData.imageUrl)} 
                        alt="QRIS Barcode" 
                        className="w-32 h-32 object-contain border border-slate-200 rounded p-1"
                      />
                      <span className="text-[10px] font-bold font-mono text-slate-800">{qrisData.accountName || 'PT Travel Shuttle Indonesia'}</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-500">Scan QR Code QRIS di loket atau via e-wallet</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Booking Summary Card */}
          {bookingData && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap justify-between items-center pb-3 border-b border-slate-200 gap-2">
                  <div>
                    <span className="text-[11px] text-gray-500 font-bold block uppercase">{t('dashboard.bookingCode', 'Kode Booking')}</span>
                    <span className="text-base font-extrabold text-blue-900 font-mono tracking-wider">{bookingData.bookingCode}</span>
                  </div>
                  <div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      bookingData.status === 'PAID' || bookingData.status === 'CONFIRMED'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : bookingData.status === 'CANCELLED'
                        ? 'bg-red-100 text-red-800 border border-red-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      {bookingData.status === 'PAID' ? '✓ Dikonfirmasi Lunas' :
                       bookingData.status === 'CONFIRMED' ? '✓ Terkonfirmasi' :
                       bookingData.status === 'CANCELLED' ? '❌ Dibatalkan' : '⏳ Menunggu Verifikasi Pembayaran'}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-2.5 text-xs text-gray-700">
                  <div>
                    <span className="text-gray-500 block">Pemesan / Penumpang:</span>
                    <strong className="text-gray-900">{bookingData.passengerName || bookingData.user?.name || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">No. WhatsApp:</span>
                    <strong className="text-gray-900">{bookingData.passengerPhone || bookingData.user?.phone || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Rute Perjalanan:</span>
                    <strong className="text-gray-900">
                      {bookingData.schedule?.route?.originCity?.name} → {bookingData.schedule?.route?.destinationCity?.name}
                    </strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Waktu Berangkat:</span>
                    <strong className="text-gray-900">
                      {formatDate(bookingData.schedule?.departureDate, t('common.locale'))} | {bookingData.schedule?.departureTime}
                    </strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Nomor Kursi:</span>
                    <strong className="text-blue-700 font-bold">{(bookingData.seatNumbers || []).join(', ')}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Total Tagihan:</span>
                    <strong className="text-emerald-700 font-extrabold text-sm">{formatCurrency(bookingData.totalPrice)}</strong>
                  </div>
                </div>
              </div>

              {/* QRIS Payment Instruction Card */}
              {bookingData.status !== 'CANCELLED' && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-200 rounded-xl p-4 space-y-3">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 border-b border-blue-100 pb-2">
                    <QrCode className="w-4 h-4 text-blue-600" />
                    <span>Instruksi Pembayaran Transfer Bank / QRIS</span>
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1 font-mono text-[11px]">
                      <span className="font-sans font-bold text-slate-700 block text-xs">Rekening Bank Transfer:</span>
                      <div><span className="text-gray-500 font-sans">BCA:</span> <strong>{qrisData?.bankBca || '123-456-7890 (a.n. PT Travel Shuttle)'}</strong></div>
                      <div><span className="text-gray-500 font-sans">Mandiri:</span> <strong>{qrisData?.bankMandiri || '987-000-112233 (a.n. PT Travel Shuttle)'}</strong></div>
                      {qrisData?.bankOther && (
                        <div><span className="text-gray-500 font-sans">Lainnya:</span> <strong>{qrisData.bankOther}</strong></div>
                      )}
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col items-center justify-center text-center space-y-1.5">
                      <span className="font-sans font-bold text-slate-700 block text-xs">Scan Barcode QRIS:</span>
                      {qrisData && qrisData.imageUrl ? (
                        <div className="flex flex-col items-center space-y-1">
                          <img 
                            src={getImageUrl(qrisData.imageUrl)} 
                            alt="QRIS Barcode" 
                            className="w-32 h-32 object-contain border border-slate-200 rounded p-1"
                          />
                          <span className="text-[10px] font-bold font-mono text-slate-800">{qrisData.accountName || 'PT Travel Shuttle Indonesia'}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500">Scan QR Code QRIS di loket atau via e-wallet</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Direct WhatsApp Confirmation Link Button */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-emerald-900">
                  <span className="font-bold block text-emerald-800">💬 Ingin Konfirmasi Cepat via WhatsApp?</span>
                  <span className="text-[11px] text-emerald-700">Kirim detail pemesanan langsung ke CS WhatsApp kami.</span>
                </div>
                <a
                  href={getWaLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow flex items-center justify-center gap-2 shrink-0"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.099 4.018 4.018-1.099z" />
                  </svg>
                  <span>Chat Admin WA</span>
                </a>
              </div>

              {/* Transfer Proof Submission Form */}
              <form onSubmit={handleSubmitConfirmation} className="border border-gray-200 rounded-xl p-4 space-y-4 bg-white shadow-sm">
                <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2 border-b border-gray-100 pb-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>{t('booking.paymentProofFormTitle', 'Form Bukti Transfer Pembayaran')}</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Nama Pemilik Rekening Pengirim *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.senderName}
                      onChange={(e) => setForm({ ...form, senderName: e.target.value })}
                      placeholder="Contoh: Budi Santoso"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Bank Asal Pengirim *
                    </label>
                    <select
                      value={form.bankName}
                      onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="BCA">BCA</option>
                      <option value="Mandiri">Mandiri</option>
                      <option value="BRI">BRI</option>
                      <option value="BNI">BNI</option>
                      <option value="BSI">BSI</option>
                      <option value="CIMB Niaga">CIMB Niaga</option>
                      <option value="Bank Permata">Bank Permata</option>
                      <option value="E-Wallet (GoPay/OVO/Dana/ShopeePay)">E-Wallet (GoPay/OVO/Dana/ShopeePay)</option>
                      <option value="QRIS">QRIS</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Nominal Ditransfer (Rp) *
                    </label>
                    <input
                      type="number"
                      required
                      value={form.transferAmount}
                      onChange={(e) => setForm({ ...form, transferAmount: e.target.value })}
                      placeholder={bookingData.totalPrice.toString()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-800"
                    />
                  </div>

                  {/* Upload Foto Bukti Transfer / Resi */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Upload Foto Bukti Transfer / Resi *
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-gray-300 rounded-lg p-1"
                    />
                  </div>
                </div>

                {/* Optional paste URL link fallback */}
                <div className="text-[11px] text-gray-500">
                  <span>Atau tempelkan link URL foto: </span>
                  <input
                    type="url"
                    value={form.paymentProofUrl && !form.paymentProofUrl.startsWith('data:') ? form.paymentProofUrl : ''}
                    onChange={(e) => setForm({ ...form, paymentProofUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full mt-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs outline-none"
                  />
                </div>

                {/* Preview Image if provided */}
                {form.paymentProofUrl && (
                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 flex items-center gap-3">
                    <img
                      src={form.paymentProofUrl}
                      alt="Bukti Transfer"
                      className="w-16 h-16 object-cover rounded-lg border border-gray-300 shrink-0"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80'; }}
                    />
                    <div className="text-xs">
                      <span className="font-bold text-gray-800 block">Preview Foto Bukti Transfer</span>
                      <span className="text-emerald-600 font-semibold text-[11px]">✓ Foto resi berhasil dipilih</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Catatan Tambahan (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Contoh: Sudah transfer via BCA Mobile atas nama Budi"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        <span>Mengirim Konfirmasi...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Kirim Konfirmasi Pembayaran</span>
                      </>
                    )}
                  </button>

                  <a
                    href={getWaLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.099 4.018 4.018-1.099z" />
                    </svg>
                    <span>Kirim via WA</span>
                  </a>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentConfirmationModal;
