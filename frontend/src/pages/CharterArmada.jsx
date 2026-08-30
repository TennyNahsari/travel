import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import Pagination from '../components/Pagination';
import { Bus, Search, Filter, Calendar, MapPin, CheckCircle2, XCircle, Clock, Eye, AlertCircle, RefreshCw, Trash2, MessageCircle, PhoneCall, Mail, User, Download } from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';

function CharterArmada() {
  const { t } = useTranslation();
  const [charters, setCharters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Detail & Status Modal
  const [selectedCharter, setSelectedCharter] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const getContactWaLink = (phone, charterCode, name) => {
    if (!phone) return '#';
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    const msg = `Halo ${name || 'Pelanggan'}, kami dari Admin Travel Shuttle terkait pemesanan charter armada (${charterCode}).`;
    return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
  };

  useEffect(() => {
    fetchCharters();
  }, [statusFilter, startDate, endDate]);

  const fetchCharters = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter && statusFilter !== 'ALL') params.status = statusFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (searchTerm) params.search = searchTerm;

      const response = await api.get('/charters', { params });
      setCharters(response.data.data || []);
      setCurrentPage(1);
    } catch (err) {
      console.error('Error fetching charters:', err);
      setError('Gagal mengambil data charter armada.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    const dataToExport = charters.map((c) => ({
      'Kode Charter': c.charterCode,
      'Armada': c.vehicle?.vehicleType || '',
      'Plat Nomor': c.vehicle?.plateNumber || '',
      'Nama Pemesan': c.customerName || '',
      'No. HP': c.customerPhone || '',
      'Email': c.customerEmail || '',
      'Tanggal Charter': new Date(c.charterDate).toLocaleDateString('id-ID'),
      'Lama Sewa (Hari)': c.durationDays,
      'Jumlah Unit': c.totalVehicles,
      'Alamat Penjemputan': c.originAddress,
      'Alamat Tujuan': c.destinationAddress,
      'Total Biaya (Rp)': c.totalPrice,
      'Status': c.status,
      'Batas Bayar': c.paymentDeadline ? new Date(c.paymentDeadline).toLocaleString('id-ID') : '',
      'Waktu Booking': new Date(c.createdAt).toLocaleString('id-ID')
    }));
    exportToExcel(dataToExport, 'Laporan_Charter_Armada', 'Charter Armada');
  };

  const handleUpdateStatus = async (charterId, newStatus) => {
    try {
      setUpdatingStatus(true);
      await api.put(`/charters/${charterId}/status`, { status: newStatus });
      setSuccess(`Status charter berhasil diubah menjadi ${newStatus}`);
      fetchCharters();
      if (selectedCharter && selectedCharter.id === charterId) {
        setSelectedCharter(prev => prev ? { ...prev, status: newStatus } : null);
      }
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Update status error:', err);
      setError(err.response?.data?.error || 'Gagal mengubah status charter.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteCharter = async (charterId, charterCode) => {
    if (window.confirm(t('charter.deleteConfirm', `Apakah Anda yakin ingin menghapus pemesanan charter "${charterCode}"?`))) {
      try {
        await api.delete(`/charters/${charterId}`);
        setSuccess(t('charter.deleteSuccess', 'Pemesanan charter berhasil dihapus.'));
        if (showDetailModal && selectedCharter?.id === charterId) {
          setShowDetailModal(false);
        }
        fetchCharters();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        console.error('Delete charter error:', err);
        setError(err.response?.data?.error || t('common.saveError', 'Gagal menghapus pemesanan charter.'));
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const filteredCharters = charters.filter(c => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (c.charterCode && c.charterCode.toLowerCase().includes(term)) ||
      (c.customerName && c.customerName.toLowerCase().includes(term)) ||
      (c.customerPhone && c.customerPhone.toLowerCase().includes(term)) ||
      (c.originAddress && c.originAddress.toLowerCase().includes(term)) ||
      (c.destinationAddress && c.destinationAddress.toLowerCase().includes(term)) ||
      (c.vehicle?.vehicleType && c.vehicle.vehicleType.toLowerCase().includes(term))
    );
  });

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
      PAID: 'bg-blue-100 text-blue-800 border-blue-200',
      PROCESSED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      CONFIRMED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      CANCELLED: 'bg-red-100 text-red-800 border-red-200',
      COMPLETED: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return badges[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusLabel = (status) => {
    const labels = {
      PENDING: 'Menunggu Bayar',
      PAID: 'Sudah Bayar',
      PROCESSED: 'Diproses',
      CONFIRMED: 'Terkonfirmasi',
      CANCELLED: 'Dibatalkan',
      COMPLETED: 'Selesai'
    };
    return labels[status] || status;
  };

  // Stats calculation
  const totalCount = charters.length;
  const pendingCount = charters.filter(c => c.status === 'PENDING').length;
  const processedCount = charters.filter(c => c.status === 'PROCESSED').length;
  const paidCount = charters.filter(c => c.status === 'PAID' || c.status === 'CONFIRMED' || c.status === 'PROCESSED').length;
  const totalRevenue = charters
    .filter(c => c.status === 'PAID' || c.status === 'CONFIRMED' || c.status === 'PROCESSED' || c.status === 'COMPLETED')
    .reduce((sum, c) => sum + (c.totalPrice || 0), 0);

  const paginatedCharters = filteredCharters.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 text-left">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-deep-navy tracking-tight flex items-center gap-2">
            <Bus className="w-7 h-7 text-travel-blue" />
            <span>{t('charter.title', 'Charter Armada')}</span>
          </h1>
          <p className="text-sm text-slate-gray mt-1">
            {t('charter.subtitle', 'Kelola dan pantau pemesanan sewa armada kendaraan eksklusif.')}
          </p>
        </div>

        <button
          onClick={fetchCharters}
          className="px-4 py-2 bg-white border border-slate-200 hover:bg-soft-sky text-deep-navy font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{t('common.refresh', 'Refresh Data')}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{t('charter.totalBookings', 'Total Pemesanan')}</span>
          <p className="text-2xl font-extrabold text-deep-navy">{totalCount} <span className="text-xs font-normal text-slate-400">Order</span></p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block mb-1">{t('charter.pendingPayment', 'Menunggu Bayar')}</span>
          <p className="text-2xl font-extrabold text-amber-700">{pendingCount} <span className="text-xs font-normal text-slate-400">Pending</span></p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">{t('charter.confirmedPaid', 'Lunas / Terkonfirmasi')}</span>
          <p className="text-2xl font-extrabold text-emerald-700">{paidCount} <span className="text-xs font-normal text-slate-400">Charter</span></p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft">
          <span className="text-[11px] font-bold text-travel-blue uppercase tracking-wider block mb-1">{t('charter.totalRevenue', 'Total Omset Charter')}</span>
          <p className="text-2xl font-extrabold text-travel-blue">Rp {totalRevenue.toLocaleString('id-ID')}</p>
        </div>
      </div>

      {/* Alert Messages */}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold">
          {success}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs font-bold">
          {error}
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-soft flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('charter.searchPlaceholder', 'Cari kode charter, nama, no HP, alamat...')}
            className="w-full pl-9 pr-4 py-2 bg-soft-sky/60 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-travel-blue"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Date range filter */}
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

          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-soft-sky/60 border border-slate-200 rounded-xl text-xs font-semibold text-deep-navy outline-none"
          >
            <option value="ALL">{t('common.all', 'Semua Status')}</option>
            <option value="PENDING">{t('charter.status.PENDING', 'Menunggu Bayar')}</option>
            <option value="PAID">{t('charter.status.PAID', 'Sudah Bayar')}</option>
            <option value="PROCESSED">{t('charter.status.PROCESSED', 'Diproses')}</option>
            <option value="CONFIRMED">{t('charter.status.CONFIRMED', 'Terkonfirmasi')}</option>
            <option value="COMPLETED">Selesai</option>
            <option value="CANCELLED">Dibatalkan</option>
          </select>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            title="Export data ke file Excel"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Main Table & Cards */}
      <div className="bg-white rounded-3xl shadow-soft border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-travel-blue"></div>
            <p className="text-slate-500 mt-2 text-xs font-medium">{t('common.loading')}</p>
          </div>
        ) : filteredCharters.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-sm font-semibold">{t('common.noData')}</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-soft-sky border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5 text-xs font-extrabold text-deep-navy uppercase">{t('table.charterCode', 'Kode Charter')}</th>
                    <th className="px-6 py-3.5 text-xs font-extrabold text-deep-navy uppercase">{t('table.vehicle', 'Armada')}</th>
                    <th className="px-6 py-3.5 text-xs font-extrabold text-deep-navy uppercase">{t('table.customer', 'Customer')}</th>
                    <th className="px-6 py-3.5 text-xs font-extrabold text-deep-navy uppercase">{t('table.dateAndLocation', 'Tanggal & Lokasi')}</th>
                    <th className="px-6 py-3.5 text-xs font-extrabold text-deep-navy uppercase">{t('table.totalCost', 'Total Biaya')}</th>
                    <th className="px-6 py-3.5 text-xs font-extrabold text-deep-navy uppercase">{t('table.status', 'Status')}</th>
                    <th className="px-6 py-3.5 text-xs font-extrabold text-deep-navy uppercase">{t('table.actions', 'Aksi')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedCharters.map((charter) => (
                    <tr key={charter.id} className="hover:bg-soft-sky/40 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-xs font-extrabold text-travel-blue block">{charter.charterCode}</span>
                        <span className="text-[10px] text-slate-400">{new Date(charter.createdAt).toLocaleDateString('id-ID')}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-deep-navy block">{charter.vehicle?.vehicleType}</span>
                        <span className="text-[10px] text-slate-500 font-medium">Plat: {charter.vehicle?.plateNumber}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-extrabold text-deep-navy block">{charter.customerName}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-slate-500 font-medium">{charter.customerPhone}</span>
                          {charter.customerPhone && (
                            <a
                              href={getContactWaLink(charter.customerPhone, charter.charterCode, charter.customerName)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-md border border-emerald-200"
                              title="Chat WhatsApp Pemesan"
                            >
                              <MessageCircle className="w-3 h-3 text-emerald-600" />
                              <span>WA</span>
                            </a>
                          )}
                        </div>
                        {charter.customerEmail && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">{charter.customerEmail}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-xs font-semibold text-deep-navy">
                          📅 {new Date(charter.charterDate).toLocaleDateString('id-ID')} ({charter.durationDays} Hari, {charter.totalVehicles} Mobil)
                        </p>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">📍 {charter.originAddress} → {charter.destinationAddress}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-extrabold text-deep-navy">Rp {charter.totalPrice.toLocaleString('id-ID')}</span>
                        {charter.paymentProofUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCharter(charter);
                              setShowDetailModal(true);
                            }}
                            className="block text-[9px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300 mt-1 w-max cursor-pointer transition"
                            title="Klik untuk lihat foto bukti transfer"
                          >
                            {t('charter.viewPaymentProof', '✓ Lihat Bukti Transfer')}
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={charter.status}
                          disabled={updatingStatus}
                          onChange={(e) => handleUpdateStatus(charter.id, e.target.value)}
                          className={`px-2.5 py-1 text-xs font-extrabold rounded-full border outline-none cursor-pointer ${getStatusBadge(charter.status)}`}
                        >
                          <option value="PENDING">{t('charter.status.PENDING', 'Menunggu Bayar')}</option>
                          <option value="PAID">{t('charter.status.PAID', 'Sudah Bayar')}</option>
                          <option value="PROCESSED">{t('charter.status.PROCESSED', 'Diproses')}</option>
                          <option value="CONFIRMED">{t('charter.status.CONFIRMED', 'Terkonfirmasi')}</option>
                          <option value="COMPLETED">{t('charter.status.COMPLETED', 'Selesai')}</option>
                          <option value="CANCELLED">{t('charter.status.CANCELLED', 'Dibatalkan')}</option>
                        </select>
                        {charter.status === 'PENDING' && (
                          <span className="block text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-1 w-max">
                            ⏰ Max: {charter.paymentDeadline ? new Date(charter.paymentDeadline).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : new Date(new Date(charter.createdAt).getTime() + 60*60*1000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedCharter(charter);
                              setShowDetailModal(true);
                            }}
                            className="px-2.5 py-1 bg-soft-sky text-travel-blue hover:bg-travel-blue hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{t('common.detail', 'Detail')}</span>
                          </button>
                          <button
                            onClick={() => handleDeleteCharter(charter.id, charter.charterCode)}
                            className="px-2 py-1 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1 border border-red-100"
                            title="Hapus Charter"
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
              {paginatedCharters.map((charter) => (
                <div key={charter.id} className="p-4 hover:bg-soft-sky/30 transition-colors space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-extrabold text-travel-blue">{charter.charterCode}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs font-bold text-deep-navy">👤 {charter.customerName}</p>
                        {charter.customerPhone && (
                          <a
                            href={getContactWaLink(charter.customerPhone, charter.charterCode, charter.customerName)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md border border-emerald-200"
                          >
                            <MessageCircle className="w-3 h-3 text-emerald-600" />
                            <span>{charter.customerPhone}</span>
                          </a>
                        )}
                      </div>
                    </div>
                    <select
                      value={charter.status}
                      disabled={updatingStatus}
                      onChange={(e) => handleUpdateStatus(charter.id, e.target.value)}
                      className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full border outline-none cursor-pointer ${getStatusBadge(charter.status)}`}
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
                    <p className="font-bold text-deep-navy">🚐 {charter.vehicle?.vehicleType} ({charter.vehicle?.plateNumber})</p>
                    <p className="text-[11px] text-slate-600">📅 {new Date(charter.charterDate).toLocaleDateString('id-ID')} ({charter.durationDays} Hari, {charter.totalVehicles} Unit)</p>
                    <p className="text-[10px] text-slate-500 truncate">📍 {charter.originAddress} → {charter.destinationAddress}</p>
                  </div>

                  <div className="flex justify-between items-center pt-1 gap-2">
                    <span className="text-xs font-extrabold text-deep-navy">Rp {charter.totalPrice.toLocaleString('id-ID')}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedCharter(charter);
                          setShowDetailModal(true);
                        }}
                        className="px-3 py-1 bg-travel-blue text-white rounded-lg text-xs font-bold shadow-xs"
                      >
                        Detail & Aksi
                      </button>
                      <button
                        onClick={() => handleDeleteCharter(charter.id, charter.charterCode)}
                        className="p-1.5 bg-red-50 text-red-600 rounded-lg text-xs border border-red-100 font-bold"
                        title="Hapus Charter"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalItems={filteredCharters.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* Detail & Action Modal */}
      {showDetailModal && selectedCharter && (
        <div className="fixed inset-0 bg-deep-navy/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 text-left space-y-5 border border-slate-100">
            
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Detail Pemesanan Charter</span>
                <h3 className="text-lg font-extrabold text-deep-navy">{selectedCharter.charterCode}</h3>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-8 h-8 rounded-full bg-soft-sky hover:bg-slate-200 text-deep-navy font-bold flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Customer Info */}
            <div className="space-y-2 text-xs">
              <h4 className="font-extrabold text-deep-navy uppercase text-[11px] text-slate-400 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-travel-blue" />
                <span>Contact Person Pemesan</span>
              </h4>
              <div className="p-3.5 bg-gradient-to-r from-soft-sky to-blue-50/50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Nama Pemesan / Penanggung Jawab</span>
                    <p className="text-sm font-extrabold text-deep-navy">{selectedCharter.customerName}</p>
                  </div>
                  {selectedCharter.customerPhone && (
                    <a
                      href={getContactWaLink(selectedCharter.customerPhone, selectedCharter.charterCode, selectedCharter.customerName)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                    >
                      <MessageCircle className="w-4 h-4 fill-current" />
                      <span>Chat WhatsApp Pemesan</span>
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <PhoneCall className="w-3.5 h-3.5 text-travel-blue" />
                    <span><strong>No. Telepon / WA:</strong> {selectedCharter.customerPhone}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Mail className="w-3.5 h-3.5 text-travel-blue" />
                    <span><strong>Email:</strong> {selectedCharter.customerEmail || '-'}</span>
                  </div>
                </div>

                {selectedCharter.notes && (
                  <div className="pt-1 border-t border-slate-200/60 text-slate-600">
                    <strong>Catatan Pemesan:</strong> {selectedCharter.notes}
                  </div>
                )}
              </div>
            </div>

            {/* Vehicle & Trip Info */}
            <div className="space-y-2 text-xs">
              <h4 className="font-extrabold text-deep-navy uppercase text-[11px] text-slate-400">Detail Perjalanan & Armada</h4>
              <div className="p-3 bg-soft-sky rounded-2xl space-y-1">
                <p><strong>Armada:</strong> {selectedCharter.vehicle?.vehicleType} (Plat: {selectedCharter.vehicle?.plateNumber})</p>
                <p><strong>Tanggal Charter:</strong> {new Date(selectedCharter.charterDate).toLocaleDateString('id-ID')}</p>
                <p><strong>Lama Sewa:</strong> {selectedCharter.durationDays} Hari ({selectedCharter.totalVehicles} Mobil)</p>
                <p><strong>Alamat Jemput:</strong> {selectedCharter.originAddress}</p>
                <p><strong>Alamat Tujuan:</strong> {selectedCharter.destinationAddress}</p>
                <p><strong>Total Price:</strong> <span className="font-extrabold text-travel-blue">Rp {selectedCharter.totalPrice.toLocaleString('id-ID')}</span></p>
              </div>
            </div>

            {/* Payment Proof Info */}
            <div className="space-y-2 text-xs">
              <h4 className="font-extrabold text-deep-navy uppercase text-[11px] text-slate-400">Konfirmasi Pembayaran</h4>
              <div className="p-3 bg-soft-sky rounded-2xl space-y-1">
                <p><strong>Pengirim:</strong> {selectedCharter.paymentSenderName || '-'}</p>
                <p><strong>Bank Asal:</strong> {selectedCharter.paymentBankName || '-'}</p>
                {selectedCharter.paymentProofUrl ? (
                  <div className="pt-2">
                    <p className="mb-1 font-bold text-slate-700">Foto Bukti Bayar:</p>
                    <a href={selectedCharter.paymentProofUrl} target="_blank" rel="noopener noreferrer">
                      <img src={selectedCharter.paymentProofUrl} alt="Bukti Transfer" className="w-full max-h-48 object-contain rounded-xl border border-slate-200 bg-white p-1" />
                    </a>
                  </div>
                ) : (
                  <p className="text-slate-400 italic">Belum mengunggah foto bukti bayar.</p>
                )}
              </div>
            </div>

            {/* Change Status Actions */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="font-extrabold text-deep-navy text-xs uppercase">Ubah Status Charter:</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleUpdateStatus(selectedCharter.id, 'PAID')}
                  disabled={updatingStatus || selectedCharter.status === 'PAID'}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 disabled:opacity-40"
                >
                  Set Lunas (PAID)
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedCharter.id, 'PROCESSED')}
                  disabled={updatingStatus || selectedCharter.status === 'PROCESSED'}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-40"
                >
                  Diproses (PROCESSED)
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedCharter.id, 'CONFIRMED')}
                  disabled={updatingStatus || selectedCharter.status === 'CONFIRMED'}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 disabled:opacity-40"
                >
                  Konfirmasi (CONFIRMED)
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedCharter.id, 'COMPLETED')}
                  disabled={updatingStatus || selectedCharter.status === 'COMPLETED'}
                  className="px-3 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 disabled:opacity-40"
                >
                  Selesai (COMPLETED)
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedCharter.id, 'CANCELLED')}
                  disabled={updatingStatus || selectedCharter.status === 'CANCELLED'}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 disabled:opacity-40"
                >
                  Batalkan (CANCELLED)
                </button>
                <button
                  onClick={() => handleDeleteCharter(selectedCharter.id, selectedCharter.charterCode)}
                  className="px-3 py-1.5 bg-red-100 text-red-700 border border-red-300 rounded-xl text-xs font-bold hover:bg-red-700 hover:text-white transition flex items-center gap-1 ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Permanen</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default CharterArmada;
