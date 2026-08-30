import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  CreditCard, Search, Calendar, Filter, Trash2, Printer, CheckCircle2, 
  DollarSign, Bus, Package, Tag, FileText, AlertTriangle, RefreshCw, X, Check, Download
} from 'lucide-react';
import api from '../services/api';
import Pagination from '../components/Pagination';
import { exportToExcel } from '../utils/excelExport';

function Pembayaran() {
  const { t } = useTranslation();
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // EPOS Receipt Print Modal State
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const printRef = useRef(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, [filterType, filterStartDate, filterEndDate]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterType && filterType !== 'ALL') params.type = filterType;
      if (filterStartDate) params.startDate = filterStartDate;
      if (filterEndDate) params.endDate = filterEndDate;
      if (search) params.search = search;

      const response = await api.get('/payments', { params });
      setPayments(response.data.data || []);
      setCurrentPage(1);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('Gagal memuat data pembayaran');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    const dataToExport = payments.map((p) => ({
      'Kode Transaksi': p.code,
      'Jenis Layanan': p.typeLabel,
      'Nama Pelanggan': p.customerName,
      'No. HP': p.customerPhone,
      'Rute / Layanan': p.serviceName,
      'Detail Unit': p.details,
      'Total Biaya (Rp)': p.totalPrice,
      'Tanggal Lunas': new Date(p.paidAt).toLocaleString('id-ID'),
      'Status': p.status === 'CONFIRMED' ? 'Terkonfirmasi' : 'Selesai Lunas'
    }));
    exportToExcel(dataToExport, 'Laporan_Pembayaran_Lunas', 'Pembayaran');
  };

  const fetchStats = async () => {
    try {
      const params = {};
      if (filterStartDate) params.startDate = filterStartDate;
      if (filterEndDate) params.endDate = filterEndDate;

      const response = await api.get('/payments/stats', { params });
      setStats(response.data.data);
    } catch (err) {
      console.error('Gagal mengambil statistik pembayaran:', err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPayments();
  };

  const handleResetFilter = () => {
    setSearch('');
    setFilterType('ALL');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  const handleDeletePayment = async (item) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus transaksi pembayaran ${item.code}?`)) {
      return;
    }

    try {
      await api.delete(`/payments/${item.type}/${item.id}`);
      setSuccess(`Transaksi ${item.code} berhasil dihapus.`);
      fetchPayments();
      fetchStats();
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      console.error('Error deleting payment:', err);
      setError(err.response?.data?.error || 'Gagal menghapus transaksi pembayaran');
      setTimeout(() => setError(''), 2500);
    }
  };

  const handlePrintReceipt = (item) => {
    setSelectedReceipt(item);
    setShowReceiptModal(true);
  };

  const triggerBrowserPrint = () => {
    window.print();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'TICKET':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CHARTER':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'PACKAGE':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = payments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(payments.length / itemsPerPage);

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-deep-navy tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-travel-blue" />
            <span>Dashboard Pembayaran & Restitusi</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Riwayat transaksi resmi lunas (Tiket Confirmed, Charter Selesai, dan Paket Selesai).
          </p>
        </div>
        <button
          onClick={() => { fetchPayments(); fetchStats(); }}
          className="px-4 py-2 bg-soft-sky hover:bg-slate-200 text-deep-navy font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
        >
          <RefreshCw className="w-4 h-4 text-travel-blue" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{success}</span>
        </div>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-travel-blue to-slate-900 rounded-3xl p-5 text-white shadow-md">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">{t('payment.totalRevenuePaid', 'Total Omset Lunas')}</span>
              <DollarSign className="w-5 h-5 text-tropical-teal" />
            </div>
            <div className="text-2xl font-black mb-1">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <div className="text-[11px] text-slate-300 font-medium">
              {t('payment.fromTotal', 'Dari total {{count}} transaksi resmi', { count: stats.totalPayments })}
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-3xl p-5 text-white shadow-md">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-200">{t('payment.todayRevenueTitle', 'Pendapatan Hari Ini')}</span>
              <Calendar className="w-5 h-5 text-emerald-200" />
            </div>
            <div className="text-2xl font-black mb-1">
              {formatCurrency(stats.todayRevenue)}
            </div>
            <div className="text-[11px] text-emerald-100 font-medium">
              {t('payment.realtimeToday', 'Update real-time hari ini')}
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-slate-800 rounded-3xl p-5 text-white shadow-md">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-200">{t('payment.ticketRevenueTitle', 'Tiket Shuttle (Confirmed)')}</span>
              <Bus className="w-5 h-5 text-indigo-300" />
            </div>
            <div className="text-2xl font-black mb-1">
              {formatCurrency(stats.breakdown?.ticketRevenue || 0)}
            </div>
            <div className="text-[11px] text-indigo-200 font-medium">
              {t('payment.confirmedTickets', '{{count}} Tiket Terkonfirmasi', { count: stats.breakdown?.ticketsCount || 0 })}
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-3xl p-5 text-white shadow-md">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-100">{t('payment.charterPackageRevenueTitle', 'Charter & Paket (Selesai)')}</span>
              <Package className="w-5 h-5 text-amber-200" />
            </div>
            <div className="text-2xl font-black mb-1">
              {formatCurrency((stats.breakdown?.charterRevenue || 0) + (stats.breakdown?.packageRevenue || 0))}
            </div>
            <div className="text-[11px] text-amber-100 font-medium">
              {(stats.breakdown?.chartersCount || 0)} Charter + {(stats.breakdown?.packagesCount || 0)} Paket Selesai
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
          {/* Search box */}
          <div className="flex-1 min-w-[220px] relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('payment.searchPlaceholder', 'Cari kode transaksi, nama pelanggan, no. WA...')}
              className="w-full pl-10 pr-4 py-2.5 bg-soft-sky/60 border border-slate-200 rounded-xl text-xs font-semibold text-deep-navy outline-none focus:ring-2 focus:ring-travel-blue"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3.5 py-2.5 bg-soft-sky/60 border border-slate-200 rounded-xl text-xs font-semibold text-deep-navy outline-none focus:ring-2 focus:ring-travel-blue"
          >
            <option value="ALL">{t('payment.allServices', 'Semua Jenis Layanan')}</option>
            <option value="TICKET">{t('payment.shuttleTicketConfirmed', '🎫 Tiket Shuttle (Confirmed)')}</option>
            <option value="CHARTER">{t('payment.charterCarCompleted', '🚐 Charter Car (Selesai)')}</option>
            <option value="PACKAGE">{t('payment.packageDeliveryCompleted', '📦 Pengiriman Paket (Selesai)')}</option>
          </select>

          {/* Date Range */}
          <div className="flex items-center gap-1.5 bg-soft-sky/60 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="bg-transparent outline-none text-xs text-deep-navy font-semibold"
            />
            <span className="text-slate-400">{t('payment.to', 's/d')}</span>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="bg-transparent outline-none text-xs text-deep-navy font-semibold"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2.5 bg-travel-blue hover:bg-travel-blue-hover text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            {t('common.search', 'Cari')}
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
            title="Export data ke file Excel"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
          <button
            type="button"
            onClick={handleResetFilter}
            className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition"
          >
            {t('payment.resetFilter', 'Reset')}
          </button>
        </form>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-semibold text-xs flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-travel-blue border-t-transparent rounded-full animate-spin" />
            <span>{t('common.loading', 'Memuat data...')}</span>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <CreditCard className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs font-extrabold text-slate-500">{t('payment.noPaymentFilter', 'Tidak ada data transaksi pembayaran lunas ditemukan.')}</p>
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-soft-sky/80 text-deep-navy font-extrabold uppercase tracking-wider text-[11px] border-b border-slate-100">
                  <tr>
                    <th className="p-4">{t('payment.codeAndService', 'Kode & Layanan')}</th>
                    <th className="p-4">{t('payment.customer', 'Pelanggan')}</th>
                    <th className="p-4">{t('payment.routeService', 'Rute / Layanan')}</th>
                    <th className="p-4">{t('payment.unitDetail', 'Detail Unit')}</th>
                    <th className="p-4">{t('payment.totalRp', 'Total (Rp)')}</th>
                    <th className="p-4">{t('payment.paidDate', 'Tanggal Lunas')}</th>
                    <th className="p-4">{t('common.status', 'Status')}</th>
                    <th className="p-4 text-center">{t('common.actions', 'Aksi')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentItems.map((item) => (
                    <tr key={`${item.type}-${item.id}`} className="hover:bg-soft-sky/30 transition-colors">
                      <td className="p-4">
                        <span className="font-mono font-black text-travel-blue block">{item.code}</span>
                        <span className={`inline-block px-2 py-0.5 mt-1 rounded-md text-[10px] font-extrabold border ${getTypeBadge(item.type)}`}>
                          {item.typeLabel}
                        </span>
                      </td>
                      <td className="p-4">
                        <strong className="text-deep-navy block">{item.customerName}</strong>
                        <span className="text-[11px] text-slate-500 font-mono">{item.customerPhone}</span>
                      </td>
                      <td className="p-4 font-semibold text-slate-700 max-w-[180px] truncate">
                        {item.serviceName}
                      </td>
                      <td className="p-4 text-slate-600 max-w-[160px] truncate">
                        {item.details}
                      </td>
                      <td className="p-4 font-black text-emerald-600 text-sm">
                        {formatCurrency(item.totalPrice)}
                      </td>
                      <td className="p-4 text-[11px] text-slate-500 font-medium">
                        {formatDate(item.paidAt)}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          ✓ {item.status === 'CONFIRMED' ? 'Terkonfirmasi' : 'Selesai Lunas'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handlePrintReceipt(item)}
                            className="px-2.5 py-1.5 bg-travel-blue hover:bg-travel-blue-hover text-white font-bold rounded-xl text-xs transition flex items-center gap-1 shadow-xs"
                            title="Cetak Nota EPOS"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Cetak Nota</span>
                          </button>
                          <button
                            onClick={() => handleDeletePayment(item)}
                            className="p-1.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 rounded-xl transition"
                            title="Hapus Transaksi"
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
              {currentItems.map((item) => (
                <div key={`${item.type}-${item.id}`} className="p-4 space-y-2 hover:bg-soft-sky/30 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-black text-travel-blue font-mono">{item.code}</span>
                      <span className={`inline-block ml-2 px-2 py-0.5 rounded text-[10px] font-extrabold border ${getTypeBadge(item.type)}`}>
                        {item.typeLabel}
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ✓ Lunas
                    </span>
                  </div>

                  <div className="p-3 bg-soft-sky/60 rounded-2xl text-xs space-y-1">
                    <p className="text-slate-800 font-bold">👤 {item.customerName} ({item.customerPhone})</p>
                    <p className="text-slate-600 font-medium">📍 {item.serviceName}</p>
                    <p className="text-slate-600 font-medium">📦 Detail: {item.details}</p>
                    <p className="text-emerald-700 font-black text-sm pt-1">
                      Total: {formatCurrency(item.totalPrice)}
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[10px] text-slate-400 font-medium">{formatDate(item.paidAt)}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handlePrintReceipt(item)}
                        className="px-3 py-1.5 bg-travel-blue text-white font-bold rounded-xl text-xs flex items-center gap-1"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Cetak Nota</span>
                      </button>
                      <button
                        onClick={() => handleDeletePayment(item)}
                        className="p-1.5 bg-red-50 text-red-600 border border-red-200 rounded-xl"
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
              <div className="p-4 border-t border-slate-100">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => setCurrentPage(page)}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* EPOS Thermal Receipt Modal */}
      {showReceiptModal && selectedReceipt && (
        <div className="fixed inset-0 bg-deep-navy/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden flex flex-col max-h-[95vh] border border-slate-100">
            
            {/* Modal Header Controls (Hidden on Print) */}
            <div className="px-5 py-3.5 bg-slate-900 text-white flex justify-between items-center shrink-0 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-tropical-teal" />
                <span className="text-xs font-extrabold tracking-tight">Pratinjau Nota EPOS Thermal (58mm/80mm)</span>
              </div>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            {/* Thermal Receipt Paper Layout */}
            <div className="p-5 overflow-y-auto flex-1 bg-amber-50/20 font-mono text-[11px] text-black leading-tight space-y-3 shadow-inner">
              
              <div id="epos-receipt-printable" ref={printRef} className="bg-white p-4 rounded-xl border border-dashed border-slate-300 text-center space-y-2">
                
                {/* Store Header */}
                <div className="border-b border-dashed border-black pb-2 space-y-0.5">
                  <h2 className="text-base font-black tracking-tighter uppercase">TRAVEL EXPRESS SHUTTLE</h2>
                  <p className="text-[10px]">Jl. Raya Utama No. 88, Kota Transit</p>
                  <p className="text-[10px]">CS / WhatsApp: 0812-3456-7890</p>
                </div>

                {/* Receipt Metadata */}
                <div className="text-left text-[10px] border-b border-dashed border-black pb-2 space-y-0.5">
                  <div className="flex justify-between">
                    <span>No. Transaksi:</span>
                    <strong className="font-bold">{selectedReceipt.code}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Layanan:</span>
                    <strong>{selectedReceipt.typeLabel}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Tanggal:</span>
                    <span>{new Date(selectedReceipt.paidAt || selectedReceipt.createdAt).toLocaleDateString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Waktu:</span>
                    <span>{new Date(selectedReceipt.paidAt || selectedReceipt.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Metode Bayar:</span>
                    <strong>{selectedReceipt.paymentMethod || 'TRANSFER / QRIS'}</strong>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="text-left text-[10px] border-b border-dashed border-black pb-2 space-y-0.5">
                  <p><strong>PELANGGAN:</strong> {selectedReceipt.customerName}</p>
                  <p><strong>TELP/WA:</strong> {selectedReceipt.customerPhone}</p>
                  <p><strong>RUTE/TUJUAN:</strong> {selectedReceipt.serviceName}</p>
                  <p><strong>DETAIL:</strong> {selectedReceipt.details}</p>
                </div>

                {/* Items & Payment Summary */}
                <div className="text-left border-b border-dashed border-black pb-2 space-y-1">
                  <div className="flex justify-between font-extrabold text-[12px] pt-1">
                    <span>TOTAL LUNAS:</span>
                    <span>Rp {(selectedReceipt.totalPrice || 0).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-700">
                    <span>STATUS:</span>
                    <span className="font-bold text-emerald-800">✓ TERKONFIRMASI LUNAS</span>
                  </div>
                </div>

                {/* Footer Message */}
                <div className="pt-2 text-[10px] space-y-1">
                  <p className="font-bold uppercase tracking-wider">Terima kasih atas kepercayaan Anda!</p>
                  <p className="text-[9px]">Simpan struk nota ini sebagai bukti transaksi resmi.</p>
                  <p className="text-[9px] text-slate-500 pt-1">*** Travel Express System ***</p>
                </div>

              </div>

            </div>

            {/* Modal Bottom Actions (Hidden on Print) */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0 print:hidden">
              <button
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2 bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs"
              >
                Tutup
              </button>
              <button
                onClick={triggerBrowserPrint}
                className="px-5 py-2.5 bg-travel-blue hover:bg-travel-blue-hover text-white font-extrabold rounded-xl text-xs shadow-md flex items-center gap-1.5 transition"
              >
                <Printer className="w-4 h-4 text-sunset-orange" />
                <span>🖨️ Cetak Nota (Print EPOS)</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Print CSS Rules for EPOS Printer */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #epos-receipt-printable, #epos-receipt-printable * {
            visibility: visible !important;
          }
          #epos-receipt-printable {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 80mm !important;
            margin: 0 !important;
            padding: 10px !important;
            border: none !important;
            box-shadow: none !important;
            font-family: 'Courier New', Courier, monospace !important;
          }
        }
      `}</style>

    </div>
  );
}

export default Pembayaran;
