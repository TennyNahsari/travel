import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, Search, Filter, RefreshCw, Eye, Trash2, CheckCircle, Clock, AlertTriangle, MessageCircle, FileText, ChevronLeft, ChevronRight, Scale, User, Phone, MapPin, Copy, Check, Download, Calendar } from 'lucide-react';
import api, { getImageUrl } from '../services/api';
import { exportToExcel } from '../utils/excelExport';

const PengirimanPaket = () => {
  const { t } = useTranslation();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Selected Package Modal
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    fetchPackages();
  }, [statusFilter, startDate, endDate]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter && statusFilter !== 'ALL') params.status = statusFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (search) params.search = search;

      const response = await api.get('/packages', { params });
      setPackages(response.data.data || []);
    } catch (err) {
      console.error('Error fetching packages:', err);
      setError('Gagal memuat data pengiriman paket');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    const dataToExport = packages.map((p) => ({
      'Kode Tracking': p.packageCode,
      'Nama Pengirim': p.senderName,
      'No. HP Pengirim': p.senderPhone,
      'Alamat Pengirim': p.senderAddress || '',
      'Nama Penerima': p.recipientName,
      'No. HP Penerima': p.recipientPhone,
      'Alamat Tujuan': p.recipientAddress,
      'Deskripsi Barang': p.packageDescription,
      'Jumlah Paket': p.itemCount,
      'Berat (Kg)': p.weightKg,
      'Total Biaya (Rp)': p.totalPrice,
      'Status': p.status,
      'Batas Bayar': p.paymentDeadline ? new Date(p.paymentDeadline).toLocaleString('id-ID') : '',
      'Waktu Booking': new Date(p.createdAt).toLocaleString('id-ID')
    }));
    exportToExcel(dataToExport, 'Laporan_Pengiriman_Paket', 'Pengiriman Paket');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPackages();
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      setUpdatingStatus(true);
      // Optimistically update UI state immediately
      setPackages((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
      );
      if (selectedPackage && selectedPackage.id === id) {
        setSelectedPackage((prev) => ({ ...prev, status: newStatus }));
      }

      const res = await api.put(`/packages/${id}/status`, { status: newStatus });
      if (res.data?.data) {
        setSuccess(`Status pengiriman paket berhasil diperbarui menjadi ${newStatus}`);
        if (selectedPackage && selectedPackage.id === id) {
          setSelectedPackage(res.data.data);
        }
        fetchPackages();
        setTimeout(() => setSuccess(''), 2500);
      }
    } catch (err) {
      console.error('Error updating package status:', err);
      setError(err.response?.data?.error || 'Gagal mengupdate status paket');
      fetchPackages();
      setTimeout(() => setError(''), 2500);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeletePackage = async (id, code) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus data pengiriman paket ${code}?`)) {
      return;
    }

    try {
      await api.delete(`/packages/${id}`);
      setSuccess(`Data paket ${code} berhasil dihapus.`);
      if (selectedPackage && selectedPackage.id === id) {
        setShowDetailModal(false);
        setSelectedPackage(null);
      }
      fetchPackages();
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      console.error('Error deleting package:', err);
      setError(err.response?.data?.error || 'Gagal menghapus data paket');
      setTimeout(() => setError(''), 2500);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PROCESSED':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'CONFIRMED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'COMPLETED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'PENDING':
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'PENDING': return 'Menunggu Bayar';
      case 'PAID': return 'Sudah Bayar';
      case 'PROCESSED': return 'Diproses / Dikirim';
      case 'CONFIRMED': return 'Terkonfirmasi';
      case 'COMPLETED': return 'Selesai';
      case 'CANCELLED': return 'Dibatalkan';
      default: return status;
    }
  };

  const getWaContactLink = (phone, code, name, role) => {
    if (!phone) return '#';
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    const msg = `Halo Kak ${name} (${role}), terkait pengiriman paket Kode *${code}* di Travel Shuttle...`;
    return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
  };

  // Stats calculation
  const totalCount = packages.length;
  const pendingCount = packages.filter(p => p.status === 'PENDING').length;
  const processedCount = packages.filter(p => p.status === 'PROCESSED' || p.status === 'PAID').length;
  const completedCount = packages.filter(p => p.status === 'COMPLETED' || p.status === 'CONFIRMED').length;
  const totalRevenue = packages.filter(p => p.status !== 'CANCELLED').reduce((sum, p) => sum + (p.totalPrice || 0), 0);

  // Pagination
  const totalPages = Math.ceil(packages.length / itemsPerPage);
  const paginatedPackages = packages.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-deep-navy">
              {t('package.title', 'Pengiriman Paket & Kargo')}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('package.subtitle', 'Kelola daftar ekspres paket, status pengiriman, bukti bayar, dan kontak pengirim/penerima.')}
            </p>
          </div>
        </div>
        <button
          onClick={fetchPackages}
          className="px-4 py-2 bg-soft-sky hover:bg-slate-200 text-deep-navy rounded-xl text-xs font-bold transition flex items-center gap-2 border border-slate-200"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{t('common.refresh', 'Refresh Data')}</span>
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400">{t('package.totalPackage', 'Total Paket')}</span>
          <p className="text-xl font-extrabold text-deep-navy">{totalCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase text-amber-600">{t('package.status.PENDING', 'Menunggu Bayar')}</span>
          <p className="text-xl font-extrabold text-amber-600">{pendingCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase text-indigo-600">{t('package.status.PROCESSED', 'Sedang Diproses')}</span>
          <p className="text-xl font-extrabold text-indigo-600">{processedCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase text-emerald-600">{t('package.status.COMPLETED', 'Selesai')}</span>
          <p className="text-xl font-extrabold text-emerald-600">{completedCount}</p>
        </div>
        <div className="col-span-2 sm:col-span-1 bg-white p-4 rounded-2xl border border-blue-100 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase text-travel-blue">{t('package.totalRevenue', 'Total Omset')}</span>
          <p className="text-base font-extrabold text-travel-blue">Rp {totalRevenue.toLocaleString('id-ID')}</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-3 justify-between items-center">
        
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {['ALL', 'PENDING', 'PAID', 'PROCESSED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === st
                  ? 'bg-deep-navy text-white shadow-sm'
                  : 'bg-soft-sky/60 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? t('common.all', 'Semua') : t(`package.status.${st}`, getStatusLabel(st))}
            </button>
          ))}
        </div>

        {/* Date Range & Export Excel */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 bg-soft-sky/60 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent outline-none text-xs text-deep-navy font-semibold"
            />
            <span className="text-slate-400">s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent outline-none text-xs text-deep-navy font-semibold"
            />
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            title="Export data ke file Excel"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Main Data View */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <div className="w-6 h-6 border-2 border-travel-blue border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Memuat data pengiriman paket...</p>
          </div>
        ) : paginatedPackages.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Package className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Belum ada data pengiriman paket ditemukan.</p>
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-soft-sky/60 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="px-6 py-4">{t('table.packageCode', 'Kode Paket')}</th>
                    <th className="px-6 py-4">{t('table.senderAndWa', 'Pengirim & WA')}</th>
                    <th className="px-6 py-4">{t('table.recipientAndAddress', 'Penerima & Alamat')}</th>
                    <th className="px-6 py-4">{t('table.itemDetails', 'Detail Barang')}</th>
                    <th className="px-6 py-4">{t('table.totalCost', 'Total Biaya')}</th>
                    <th className="px-6 py-4">{t('table.status', 'Status')}</th>
                    <th className="px-6 py-4">{t('table.actions', 'Aksi')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {paginatedPackages.map((pkg) => (
                    <tr key={pkg.id} className="hover:bg-soft-sky/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-extrabold text-travel-blue font-mono block">{pkg.packageCode}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {new Date(pkg.createdAt).toLocaleDateString('id-ID')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-extrabold text-deep-navy block">{pkg.senderName}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-slate-500">{pkg.senderPhone}</span>
                          <a
                            href={getWaContactLink(pkg.senderPhone, pkg.packageCode, pkg.senderName, 'Pengirim')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md border border-emerald-200"
                          >
                            <MessageCircle className="w-3 h-3 text-emerald-600" />
                            <span>WA</span>
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <span className="font-bold text-deep-navy block">{pkg.recipientName} ({pkg.recipientPhone})</span>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">📍 {pkg.recipientAddress}</p>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <p className="font-semibold text-deep-navy text-xs truncate">{pkg.packageDescription}</p>
                        <span className="text-[10px] font-bold text-slate-500 block mt-0.5">
                          ⚖️ {pkg.weightKg} Kg ({pkg.itemCount} Paket)
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-extrabold text-deep-navy">Rp {pkg.totalPrice.toLocaleString('id-ID')}</span>
                        {pkg.paymentProofUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPackage(pkg);
                              setShowDetailModal(true);
                            }}
                            className="block text-[9px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 mt-1 w-max cursor-pointer transition"
                            title="Klik untuk lihat foto bukti transfer"
                          >
                            {t('package.viewPaymentProof', '✓ Lihat Bukti Transfer')}
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={pkg.status}
                          disabled={updatingStatus}
                          onChange={(e) => handleUpdateStatus(pkg.id, e.target.value)}
                          className={`px-2.5 py-1 text-xs font-extrabold rounded-full border outline-none cursor-pointer ${getStatusBadge(pkg.status)}`}
                        >
                          <option value="PENDING">{t('package.status.PENDING', 'Menunggu Bayar')}</option>
                          <option value="PAID">{t('package.status.PAID', 'Sudah Bayar')}</option>
                          <option value="PROCESSED">{t('package.status.PROCESSED', 'Diproses / Dikirim')}</option>
                          <option value="CONFIRMED">{t('package.status.CONFIRMED', 'Terkonfirmasi')}</option>
                          <option value="COMPLETED">{t('package.status.COMPLETED', 'Selesai')}</option>
                          <option value="CANCELLED">{t('package.status.CANCELLED', 'Dibatalkan')}</option>
                        </select>
                        {pkg.status === 'PENDING' && (
                          <span className="block text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-1 w-max">
                            ⏰ Max: {pkg.paymentDeadline ? new Date(pkg.paymentDeadline).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : new Date(new Date(pkg.createdAt).getTime() + 60*60*1000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedPackage(pkg);
                              setShowDetailModal(true);
                            }}
                            className="px-2.5 py-1 bg-soft-sky text-travel-blue hover:bg-travel-blue hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{t('common.detail', 'Detail')}</span>
                          </button>
                          <button
                            onClick={() => handleDeletePackage(pkg.id, pkg.packageCode)}
                            className="px-2 py-1 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1 border border-red-100"
                            title="Hapus Paket"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden divide-y divide-slate-100">
              {paginatedPackages.map((pkg) => (
                <div key={pkg.id} className="p-4 space-y-2 hover:bg-soft-sky/30 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-extrabold text-travel-blue font-mono">{pkg.packageCode}</span>
                      <p className="text-xs font-bold text-deep-navy mt-0.5">📦 {pkg.packageDescription}</p>
                    </div>
                    <select
                      value={pkg.status}
                      disabled={updatingStatus}
                      onChange={(e) => handleUpdateStatus(pkg.id, e.target.value)}
                      className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full border outline-none cursor-pointer ${getStatusBadge(pkg.status)}`}
                    >
                      <option value="PENDING">Pending</option>
                      <option value="PAID">Paid</option>
                      <option value="PROCESSED">Diproses</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>

                  <div className="p-2.5 bg-soft-sky/60 rounded-xl text-xs space-y-1">
                    <p className="text-[11px] text-slate-700 font-semibold">
                      👤 Pengirim: <strong>{pkg.senderName}</strong> ({pkg.senderPhone})
                    </p>
                    <p className="text-[11px] text-slate-700 font-semibold">
                      🏠 Penerima: <strong>{pkg.recipientName}</strong> ({pkg.recipientPhone})
                    </p>
                    <p className="text-[11px] text-slate-500">📍 {pkg.recipientAddress}</p>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <span className="text-xs font-extrabold text-amber-600">Rp {pkg.totalPrice.toLocaleString('id-ID')}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedPackage(pkg);
                          setShowDetailModal(true);
                        }}
                        className="px-2.5 py-1 bg-travel-blue text-white rounded-lg text-[11px] font-bold"
                      >
                        Detail
                      </button>
                      <button
                        onClick={() => handleDeletePackage(pkg.id, pkg.packageCode)}
                        className="p-1 bg-red-50 text-red-600 rounded-lg text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
                <span>Halaman {currentPage} dari {totalPages}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 bg-soft-sky rounded-lg disabled:opacity-40"
                  >
                    Sebelumnya
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 bg-soft-sky rounded-lg disabled:opacity-40"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Package Detail Modal */}
      {showDetailModal && selectedPackage && (
        <div className="fixed inset-0 bg-deep-navy/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden text-left border border-slate-100">
            
            <div className="px-6 py-4 bg-gradient-to-r from-deep-navy to-travel-blue text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-300 block tracking-wider">Detail Pengiriman Paket</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <h3 className="text-base font-extrabold font-mono text-white tracking-wider">{selectedPackage.packageCode}</h3>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedPackage.packageCode);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="px-2 py-0.5 bg-white/20 hover:bg-white/30 text-white rounded text-[10px] font-bold flex items-center gap-1 transition"
                    title="Salin Kode Paket"
                  >
                    {copiedCode ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode ? 'Tersalin!' : 'Salin'}</span>
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              
              {/* Status Badge */}
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <span className="font-bold text-slate-500">Status Saat Ini:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${getStatusBadge(selectedPackage.status)}`}>
                  {getStatusLabel(selectedPackage.status)}
                </span>
              </div>

              {/* Data Pengirim */}
              <div className="p-3.5 bg-soft-sky/60 rounded-2xl space-y-1.5">
                <span className="font-extrabold uppercase text-slate-400 text-[10px] block">Informasi Pengirim</span>
                <p className="font-bold text-deep-navy text-xs">👤 {selectedPackage.senderName}</p>
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-semibold">📞 {selectedPackage.senderPhone}</span>
                  <a
                    href={getWaContactLink(selectedPackage.senderPhone, selectedPackage.packageCode, selectedPackage.senderName, 'Pengirim')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-0.5 bg-emerald-600 text-white font-bold rounded text-[10px] inline-flex items-center gap-1"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>Chat WA Pengirim</span>
                  </a>
                </div>
              </div>

              {/* Data Penerima */}
              <div className="p-3.5 bg-soft-sky/60 rounded-2xl space-y-1.5">
                <span className="font-extrabold uppercase text-slate-400 text-[10px] block">Informasi Penerima</span>
                <p className="font-bold text-deep-navy text-xs">🏠 {selectedPackage.recipientName}</p>
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-semibold">📞 {selectedPackage.recipientPhone}</span>
                  <a
                    href={getWaContactLink(selectedPackage.recipientPhone, selectedPackage.packageCode, selectedPackage.recipientName, 'Penerima')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-0.5 bg-emerald-600 text-white font-bold rounded text-[10px] inline-flex items-center gap-1"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>Chat WA Penerima</span>
                  </a>
                </div>
                <p className="text-slate-600 font-medium">📍 Alamat: {selectedPackage.recipientAddress}</p>
              </div>

              {/* Detail Barang */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-100 rounded-2xl space-y-1.5">
                <span className="font-extrabold uppercase text-amber-800 text-[10px] block">Detail Barang & Jadwal</span>
                <p className="font-extrabold text-deep-navy text-xs">📦 {selectedPackage.packageDescription}</p>
                <p className="text-slate-600">⚖️ Berat: <strong>{selectedPackage.weightKg} Kg</strong> ({selectedPackage.itemCount} Unit Paket)</p>
                {selectedPackage.schedule && (
                  <p className="text-slate-600">
                    🚐 Rute: <strong>{selectedPackage.schedule.route?.originCity?.name} → {selectedPackage.schedule.route?.destinationCity?.name}</strong> ({selectedPackage.schedule.vehicle?.vehicleType})
                  </p>
                )}
                <p className="font-extrabold text-amber-700 text-sm pt-1">Total Biaya: Rp {selectedPackage.totalPrice.toLocaleString('id-ID')}</p>
              </div>

              {/* Bukti Transfer */}
              <div className="p-3.5 bg-slate-50 rounded-2xl space-y-2">
                <span className="font-extrabold uppercase text-slate-400 text-[10px] block">Foto Resi / Bukti Bayar</span>
                {selectedPackage.paymentProofUrl ? (
                  <div className="space-y-2">
                    <img
                      src={getImageUrl(selectedPackage.paymentProofUrl)}
                      alt="Bukti Transfer Paket"
                      className="w-full max-h-56 object-contain rounded-xl border border-slate-200 bg-white p-1"
                    />
                    <div className="text-[11px] text-slate-600 space-y-0.5">
                      <p>Pengirim Rekening: <strong>{selectedPackage.paymentSenderName || '-'}</strong></p>
                      <p>Bank: <strong>{selectedPackage.paymentBankName || '-'}</strong></p>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 italic">Belum ada foto bukti pembayaran diunggah.</p>
                )}
              </div>

              {/* Action status */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="font-bold text-slate-700 block">Ubah Status Pengiriman:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => handleUpdateStatus(selectedPackage.id, 'PAID')}
                    disabled={updatingStatus || selectedPackage.status === 'PAID'}
                    className="px-2.5 py-1 bg-blue-600 text-white font-bold rounded-lg text-xs disabled:opacity-40"
                  >
                    Sudah Bayar
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedPackage.id, 'PROCESSED')}
                    disabled={updatingStatus || selectedPackage.status === 'PROCESSED'}
                    className="px-2.5 py-1 bg-indigo-600 text-white font-bold rounded-lg text-xs disabled:opacity-40"
                  >
                    Diproses / Dikirim
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedPackage.id, 'CONFIRMED')}
                    disabled={updatingStatus || selectedPackage.status === 'CONFIRMED'}
                    className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg text-xs disabled:opacity-40"
                  >
                    Terkonfirmasi
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedPackage.id, 'COMPLETED')}
                    disabled={updatingStatus || selectedPackage.status === 'COMPLETED'}
                    className="px-2.5 py-1 bg-purple-600 text-white font-bold rounded-lg text-xs disabled:opacity-40"
                  >
                    Selesai
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedPackage.id, 'CANCELLED')}
                    disabled={updatingStatus || selectedPackage.status === 'CANCELLED'}
                    className="px-2.5 py-1 bg-red-600 text-white font-bold rounded-lg text-xs disabled:opacity-40"
                  >
                    Batalkan
                  </button>
                  <button
                    onClick={() => handleDeletePackage(selectedPackage.id, selectedPackage.packageCode)}
                    className="px-2.5 py-1 bg-red-100 text-red-700 border border-red-200 font-bold rounded-lg text-xs hover:bg-red-600 hover:text-white transition ml-auto"
                  >
                    Hapus
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PengirimanPaket;
