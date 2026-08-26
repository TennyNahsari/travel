import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { qrisService, getImageUrl } from '../services/api';
import { QrCode, Upload, Trash2, CheckCircle2, AlertCircle, RefreshCw, Image as ImageIcon, Save, ShieldCheck } from 'lucide-react';

function PengaturanQris() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const [accountName, setAccountName] = useState('PT Travel Shuttle Indonesia');
  const [instruction, setInstruction] = useState('Scan QR Code QRIS di bawah menggunakan mobile banking atau e-wallet (GoPay/OVO/Dana/ShopeePay)');
  const [bankBca, setBankBca] = useState('123-456-7890 (a.n. PT Travel Shuttle Indonesia)');
  const [bankMandiri, setBankMandiri] = useState('987-000-112233 (a.n. PT Travel Shuttle Indonesia)');
  const [bankOther, setBankOther] = useState('');
  const [waNumber, setWaNumber] = useState('6281234567890');
  const [currentImageUrl, setCurrentImageUrl] = useState(null);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Fetch QRIS config on mount
  const fetchQris = async () => {
    try {
      setLoading(true);
      const res = await qrisService.getQris();
      if (res.success && res.data) {
        setAccountName(res.data.accountName || 'PT Travel Shuttle Indonesia');
        setInstruction(res.data.instruction || 'Scan QR Code QRIS di bawah menggunakan mobile banking atau e-wallet (GoPay/OVO/Dana/ShopeePay)');
        setBankBca(res.data.bankBca || '123-456-7890 (a.n. PT Travel Shuttle Indonesia)');
        setBankMandiri(res.data.bankMandiri || '987-000-112233 (a.n. PT Travel Shuttle Indonesia)');
        setBankOther(res.data.bankOther || '');
        setWaNumber(res.data.waNumber || '6281234567890');
        setCurrentImageUrl(res.data.imageUrl || null);
      }
    } catch (err) {
      console.error('Error loading QRIS setting:', err);
      setFeedback({ type: 'error', message: 'Gagal memuat pengaturan QRIS dari server' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQris();
  }, []);

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFeedback({ type: 'error', message: 'File yang dipilih harus berupa gambar (PNG, JPG, WEBP, dll)' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setFeedback({ type: 'error', message: 'Ukuran gambar maksimal 5MB' });
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
    setFeedback({ type: '', message: '' });
  };

  // Submit update
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFeedback({ type: '', message: '' });

      let imageBase64 = null;
      if (previewUrl && selectedFile) {
        imageBase64 = previewUrl;
      }

      const res = await qrisService.updateQris({
        accountName,
        instruction,
        bankBca,
        bankMandiri,
        bankOther,
        waNumber,
        imageBase64,
        imageName: selectedFile ? selectedFile.name : null
      });

      if (res.success) {
        setFeedback({ type: 'success', message: 'Pengaturan QRIS dan Nomor Rekening berhasil disimpan!' });
        setCurrentImageUrl(res.data.imageUrl);
        setSelectedFile(null);
        setPreviewUrl(null);
      } else {
        setFeedback({ type: 'error', message: res.error || 'Gagal menyimpan pengaturan' });
      }
    } catch (err) {
      console.error('Error updating QRIS:', err);
      setFeedback({ type: 'error', message: 'Terjadi kesalahan saat memperbarui pengaturan' });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete QRIS Image
  const handleDeleteImage = async () => {
    try {
      setDeleting(true);
      setFeedback({ type: '', message: '' });

      const res = await qrisService.deleteQris();
      if (res.success) {
        setFeedback({ type: 'success', message: 'Gambar QRIS lama berhasil dihapus dari disk server!' });
        setCurrentImageUrl(null);
        setSelectedFile(null);
        setPreviewUrl(null);
        setShowConfirmDelete(false);
      } else {
        setFeedback({ type: 'error', message: res.error || 'Gagal menghapus gambar QRIS' });
      }
    } catch (err) {
      console.error('Error deleting QRIS image:', err);
      setFeedback({ type: 'error', message: 'Terjadi kesalahan saat menghapus gambar QRIS' });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-travel-blue animate-spin" />
          <p className="text-sm text-slate-600 font-medium">Memuat Pengaturan Pembayaran...</p>
        </div>
      </div>
    );
  }

  const activeDisplayUrl = previewUrl || (currentImageUrl ? getImageUrl(currentImageUrl) : null);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-travel-blue to-indigo-700 text-white flex items-center justify-center shadow-md">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Pengaturan QRIS & Rekening Bank</h1>
            <p className="text-xs text-slate-500 mt-0.5">Kelola gambar barcode QRIS dan nomor rekening tujuan transfer</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
            currentImageUrl ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
          }`}>
            <ShieldCheck className="w-4 h-4" />
            {currentImageUrl ? 'QRIS Aktif (Gambar Tersedia)' : 'Gambar QRIS Belum Diset'}
          </span>
        </div>
      </div>

      {/* Feedback Messages */}
      {feedback.message && (
        <div className={`p-4 rounded-xl text-sm flex items-center justify-between gap-3 font-medium transition-all ${
          feedback.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback({ type: '', message: '' })} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Preview Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col items-center text-center">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 w-full justify-start pb-3 border-b border-slate-100">
              <ImageIcon className="w-4 h-4 text-travel-blue" />
              <span>Preview Tampilan QRIS</span>
            </h3>

            <div className="w-full bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center min-h-[240px] relative">
              {activeDisplayUrl ? (
                <div className="space-y-3 flex flex-col items-center">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-md">
                    <img 
                      src={activeDisplayUrl} 
                      alt="QRIS Merchant" 
                      className="max-h-52 max-w-full object-contain rounded-lg"
                    />
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-bold text-slate-800 block">{accountName || 'PT Travel Shuttle Indonesia'}</span>
                    <span className="text-[11px] text-slate-500 font-mono">Scan QRIS All Payment</span>
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 space-y-2 flex flex-col items-center">
                  <QrCode className="w-16 h-16 opacity-30 stroke-1" />
                  <p className="text-xs text-slate-500 max-w-[200px]">Belum ada gambar QRIS yang diunggah.</p>
                  <p className="text-[11px] text-slate-400">Silakan pilih file gambar disamping.</p>
                </div>
              )}
            </div>

            {/* Bank Preview */}
            <div className="mt-4 w-full bg-slate-50 p-3 rounded-xl border border-slate-200 text-left text-xs space-y-1 font-mono">
              <span className="font-sans font-bold text-slate-700 block mb-1">Preview Rekening Transfer:</span>
              <div><span className="text-slate-500 font-sans">BCA:</span> <strong className="text-slate-800">{bankBca}</strong></div>
              <div><span className="text-slate-500 font-sans">Mandiri:</span> <strong className="text-slate-800">{bankMandiri}</strong></div>
              {bankOther && <div><span className="text-slate-500 font-sans">Lainnya:</span> <strong className="text-slate-800">{bankOther}</strong></div>}
            </div>

            {currentImageUrl && (
              <div className="mt-4 w-full">
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(true)}
                  className="w-full px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-xl border border-rose-200 transition flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Hapus File Gambar QRIS</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Configuration Form Card */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Save className="w-4 h-4 text-travel-blue" />
              <span>Detail Informasi QRIS & Rekening</span>
            </h3>

            {/* Account Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nama Pemilik / Merchant QRIS *
              </label>
              <input
                type="text"
                required
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Contoh: PT Travel Shuttle Indonesia"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-travel-blue focus:border-travel-blue text-sm outline-none font-medium text-slate-800"
              />
            </div>

            {/* Bank BCA */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                No. Rekening BCA *
              </label>
              <input
                type="text"
                required
                value={bankBca}
                onChange={(e) => setBankBca(e.target.value)}
                placeholder="Contoh: 123-456-7890 (a.n. PT Travel Shuttle Indonesia)"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-travel-blue focus:border-travel-blue text-xs outline-none font-medium text-slate-800"
              />
            </div>

            {/* Bank Mandiri */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                No. Rekening Mandiri *
              </label>
              <input
                type="text"
                required
                value={bankMandiri}
                onChange={(e) => setBankMandiri(e.target.value)}
                placeholder="Contoh: 987-000-112233 (a.n. PT Travel Shuttle Indonesia)"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-travel-blue focus:border-travel-blue text-xs outline-none font-medium text-slate-800"
              />
            </div>

            {/* Bank Other */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Rekening / Metode Pembayaran Lainnya (Opsional)
              </label>
              <input
                type="text"
                value={bankOther}
                onChange={(e) => setBankOther(e.target.value)}
                placeholder="Contoh: BRI: 0012-01-000123-50-1 (a.n. PT Travel Shuttle)"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-travel-blue focus:border-travel-blue text-xs outline-none text-slate-800"
              />
            </div>

            {/* WhatsApp Number CS */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nomor WhatsApp CS (Floating Icon Homepage) *
              </label>
              <input
                type="text"
                required
                value={waNumber}
                onChange={(e) => setWaNumber(e.target.value)}
                placeholder="Contoh: 6281234567890 atau 081234567890"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-travel-blue focus:border-travel-blue text-xs outline-none font-medium text-slate-800"
              />
              <p className="text-[11px] text-slate-400 mt-1">Format: Menggunakan kode negara (misal: 6281234567890). Digunakan untuk tombol chat WhatsApp di Homepage.</p>
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Instruksi Pembayaran QRIS
              </label>
              <textarea
                rows="2"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="Petunjuk singkat untuk pelanggan saat scan QRIS..."
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-travel-blue focus:border-travel-blue text-xs outline-none text-slate-700"
              />
            </div>

            {/* File Upload Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {currentImageUrl ? 'Ganti File Gambar QRIS' : 'Unggah File Gambar QRIS'}
              </label>
              <div className="relative border-2 border-dashed border-slate-300 hover:border-travel-blue rounded-xl p-4 transition bg-slate-50/50 flex flex-col items-center justify-center text-center cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-xs font-semibold text-slate-700">
                  {selectedFile ? selectedFile.name : 'Klik atau seret file gambar ke sini'}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">Format support: PNG, JPG, WEBP (Maks 5MB)</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-travel-blue hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan / Update QRIS</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal Confirm Delete */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-100 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Konfirmasi Hapus File QRIS</h3>
              <p className="text-xs text-slate-600">
                Apakah Anda yakin ingin menghapus gambar QRIS? File gambar lama akan dihapus permanen dari server.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteImage}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition shadow flex items-center gap-1.5 disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <span>Ya, Hapus Gambar</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PengaturanQris;
