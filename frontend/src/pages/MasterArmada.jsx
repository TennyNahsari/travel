import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import Pagination from '../components/Pagination';

function MasterArmada() {
  const { t } = useTranslation();
  const [vehicles, setVehicles] = useState([]);
  const [seatTemplates, setSeatTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState({
    id: '',
    plateNumber: '',
    vehicleType: '',
    seatTemplateId: '',
    status: 'ACTIVE',
    description: '',
    facilities: '[\n  "Reclining Seats",\n  "Full AC Premium",\n  "USB Fast Charger",\n  "WiFi Gratis",\n  "Bagasi Luas"\n]',
    imageUrl: '',
    maxCharter: 0,
    charterPrice: 0
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchVehicles();
    fetchSeatTemplates();
  }, []);

  const fetchSeatTemplates = async () => {
    try {
      const response = await api.get('/seat-templates?isActive=true');
      setSeatTemplates(response.data.data);
    } catch (err) {
      console.error('Error fetching seat templates:', err);
    }
  };

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/vehicles');
      setVehicles(response.data.data);
    } catch (err) {
      setError(t('masterVehicle.loadError'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (vehicle = null) => {
    if (vehicle) {
      setEditMode(true);
      let facilitiesStr = '';
      if (vehicle.facilities) {
        try {
          facilitiesStr = typeof vehicle.facilities === 'string' 
            ? vehicle.facilities 
            : JSON.stringify(vehicle.facilities, null, 2);
        } catch (e) {
          facilitiesStr = String(vehicle.facilities);
        }
      } else {
        facilitiesStr = '[\n  "Reclining Seats",\n  "Full AC Premium",\n  "USB Fast Charger",\n  "WiFi Gratis",\n  "Bagasi Luas"\n]';
      }

      setCurrentVehicle({
        ...vehicle,
        seatTemplateId: vehicle.seatTemplateId || vehicle.seatTemplate?.id || '',
        description: vehicle.description || '',
        facilities: facilitiesStr,
        imageUrl: vehicle.imageUrl || '',
        maxCharter: vehicle.maxCharter !== undefined ? vehicle.maxCharter : 0,
        charterPrice: vehicle.charterPrice !== undefined ? vehicle.charterPrice : 0
      });
    } else {
      setEditMode(false);
      setCurrentVehicle({
        id: '',
        plateNumber: '',
        vehicleType: '',
        seatTemplateId: '',
        status: 'ACTIVE',
        description: '',
        facilities: '[\n  "Reclining Seats",\n  "Full AC Premium",\n  "USB Fast Charger",\n  "WiFi Gratis",\n  "Bagasi Luas"\n]',
        imageUrl: '',
        maxCharter: 0,
        charterPrice: 0,
        maxPackageCount: 0,
        maxPackageWeight: 0,
        packagePricePerKg: 0
      });
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentVehicle({
      id: '',
      plateNumber: '',
      vehicleType: '',
      seatTemplateId: '',
      status: 'ACTIVE',
      description: '',
      facilities: '',
      imageUrl: '',
      maxCharter: 0,
      charterPrice: 0,
      maxPackageCount: 0,
      maxPackageWeight: 0,
      packagePricePerKg: 0
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editMode) {
        await api.put(`/vehicles/${currentVehicle.id}`, currentVehicle);
        setSuccess(t('masterVehicle.updateSuccess'));
      } else {
        await api.post('/vehicles', currentVehicle);
        setSuccess(t('masterVehicle.addSuccess'));
      }
      
      fetchVehicles();
      setTimeout(() => {
        handleCloseModal();
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || t('masterVehicle.saveError'));
    }
  };

  const handleDelete = async (id, plateNumber) => {
    if (window.confirm(t('masterVehicle.deleteConfirm', { plate: plateNumber }))) {
      try {
        await api.delete(`/vehicles/${id}`);
        setSuccess(t('masterVehicle.deleteSuccess'));
        fetchVehicles();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.response?.data?.error || t('masterVehicle.saveError'));
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      ACTIVE: 'bg-green-100 text-green-800',
      MAINTENANCE: 'bg-yellow-100 text-yellow-800',
      INACTIVE: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    return t(`masterVehicle.status.${status}`);
  };

  const renderFacilitiesBadges = (facilities) => {
    let list = [];
    if (Array.isArray(facilities)) {
      list = facilities;
    } else if (typeof facilities === 'string') {
      try {
        const parsed = JSON.parse(facilities);
        if (Array.isArray(parsed)) list = parsed;
        else if (typeof parsed === 'object') list = Object.values(parsed);
      } catch (e) {
        list = [facilities];
      }
    } else if (typeof facilities === 'object' && facilities !== null) {
      list = Object.values(facilities);
    }

    if (list.length === 0) return <span className="text-gray-400 text-xs">-</span>;

    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {list.slice(0, 4).map((f, i) => (
          <span key={i} className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded">
            ✨ {String(f)}
          </span>
        ))}
        {list.length > 4 && (
          <span className="text-[10px] text-gray-500 font-medium">+{list.length - 4} lainnya</span>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{t('masterVehicle.title')}</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">{t('masterVehicle.subtitle')}</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center font-bold"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-sm sm:text-base">{t('masterVehicle.addVehicle')}</span>
        </button>
      </div>

      {/* Alert Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}
      {error && !showModal && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-2">{t('common.loading')}</p>
          </div>
        ) : (
          <>
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    {t('masterVehicle.number', 'NO')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    {t('masterVehicle.photoAndVehicle', 'FOTO & ARMADA')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    {t('masterVehicle.descAndFacilities', 'DESKRIPSI & FASILITAS')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    {t('masterVehicle.capacityHeader', 'KAPASITAS')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    {t('common.status', 'STATUS')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    {t('common.actions', 'AKSI')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {vehicles.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      {t('common.noData')}
                    </td>
                  </tr>
                ) : (
                  vehicles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((vehicle, index) => (
                    <tr key={vehicle.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-800 font-bold">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={vehicle.imageUrl || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'}
                            alt={vehicle.vehicleType}
                            className="w-16 h-12 object-cover rounded-lg border border-gray-200 shadow-sm shrink-0"
                          />
                          <div>
                            <span className="text-sm font-extrabold text-gray-900 block">{vehicle.plateNumber}</span>
                            <span className="text-xs font-medium text-blue-600">{vehicle.vehicleType}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-xs text-gray-600 line-clamp-2 italic mb-1">
                          {vehicle.description || t('masterVehicle.noDesc', 'Tidak ada deskripsi armada.')}
                        </p>
                        {renderFacilitiesBadges(vehicle.facilities)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="text-gray-800 font-bold">{vehicle.capacity} {t('schedule.seats', 'Kursi')}</div>
                          {vehicle.seatTemplate && (
                            <div className="text-xs text-gray-500">{vehicle.seatTemplate.name}</div>
                          )}
                          <div className="mt-1">
                            {vehicle.maxCharter > 0 ? (
                              <span className="inline-block text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                                🚗 Charter: Max {vehicle.maxCharter}/hari (Rp {Number(vehicle.charterPrice || 0).toLocaleString('id-ID')})
                              </span>
                            ) : (
                              <span className="inline-block text-[10px] font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                Non-Charter
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(vehicle.status)}`}>
                          {getStatusLabel(vehicle.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleOpenModal(vehicle)}
                            className="text-blue-600 hover:text-blue-800 font-semibold"
                          >
                            {t('common.edit')}
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => handleDelete(vehicle.id, vehicle.plateNumber)}
                            className="text-red-600 hover:text-red-800 font-semibold"
                          >
                            {t('common.delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Mobile Card View */}
          <div className="lg:hidden">
            {vehicles.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                {t('common.noData')}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {vehicles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((vehicle, index) => (
                  <div key={vehicle.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start gap-3 mb-3">
                      <img
                        src={vehicle.imageUrl || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'}
                        alt={vehicle.vehicleType}
                        className="w-16 h-12 object-cover rounded-lg border border-gray-200 shadow-sm shrink-0"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium mb-1">
                            #{(currentPage - 1) * itemsPerPage + index + 1}
                          </span>
                          <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${getStatusBadge(vehicle.status)}`}>
                            {getStatusLabel(vehicle.status)}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-gray-800">{vehicle.plateNumber}</p>
                        <p className="text-xs text-blue-600 font-semibold">{vehicle.vehicleType} ({vehicle.capacity} {t('schedule.seats', 'Kursi')})</p>
                        <div className="mt-1">
                          {vehicle.maxCharter > 0 ? (
                            <span className="inline-block text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                              🚗 Charter: Max {vehicle.maxCharter}/hari (Rp {Number(vehicle.charterPrice || 0).toLocaleString('id-ID')})
                            </span>
                          ) : (
                            <span className="inline-block text-[10px] font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                              Non-Charter
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mb-3 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                      <p className="italic mb-1.5">{vehicle.description || t('masterVehicle.noDesc', 'Tidak ada deskripsi.')}</p>
                      {renderFacilitiesBadges(vehicle.facilities)}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenModal(vehicle)}
                        className="flex-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-2 rounded-lg font-bold transition text-center"
                      >
                        {t('common.edit')}
                      </button>
                      <button
                        onClick={() => handleDelete(vehicle.id, vehicle.plateNumber)}
                        className="flex-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 rounded-lg font-bold transition text-center"
                      >
                        {t('common.delete')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          </>
        )}
        {!loading && vehicles.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={vehicles.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-800">
                {editMode ? t('masterVehicle.editVehicle') : t('masterVehicle.addVehicle')}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('masterVehicle.plateNumber')} *
                  </label>
                  <input
                    type="text"
                    value={currentVehicle.plateNumber}
                    onChange={(e) => setCurrentVehicle({ ...currentVehicle, plateNumber: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none uppercase font-bold text-gray-800"
                    placeholder={t('masterVehicle.enterPlate')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('masterVehicle.vehicleType')} *
                  </label>
                  <input
                    type="text"
                    value={currentVehicle.vehicleType}
                    onChange={(e) => setCurrentVehicle({ ...currentVehicle, vehicleType: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Contoh: Toyota Hiace Premio Executive"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('masterVehicle.seatTemplate', 'Template Kursi')} *
                  </label>
                  <select
                    value={currentVehicle.seatTemplateId}
                    onChange={(e) => setCurrentVehicle({ ...currentVehicle, seatTemplateId: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">{t('masterVehicle.selectTemplate', 'Pilih Template Kursi')}</option>
                    {seatTemplates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name} ({template.totalSeats} kursi)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('masterVehicle.description', 'Deskripsi Armada')}
                  </label>
                  <textarea
                    rows={2}
                    value={currentVehicle.description || ''}
                    onChange={(e) => setCurrentVehicle({ ...currentVehicle, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-xs"
                    placeholder="Contoh: Armada flagship 12 kursi captain seat dengan Reclining 1-1, legroom ekstra lega, USB charger, dan Full AC."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('masterVehicle.facilitiesJson', 'Fasilitas Armada (Format JSON Array)')}
                  </label>
                  <textarea
                    rows={4}
                    value={currentVehicle.facilities || ''}
                    onChange={(e) => setCurrentVehicle({ ...currentVehicle, facilities: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-xs bg-slate-50"
                    placeholder='[\n  "Reclining Seats",\n  "Full AC Premium",\n  "USB Fast Charger",\n  "WiFi Gratis",\n  "Bagasi Luas"\n]'
                  />
                  <div className="mt-1 text-[11px] text-blue-700 bg-blue-50 p-2 rounded border border-blue-100">
                    💡 <strong>{t('masterVehicle.facilitiesHint', 'Contoh Format JSON Array:')}</strong>
                    <code className="block mt-0.5 font-mono text-[10px] text-blue-900">
                      ["Reclining Seats", "Full AC Premium", "USB Fast Charger", "WiFi Gratis", "Bagasi Luas"]
                    </code>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('masterVehicle.imageUrl', 'URL Photo Representasi Armada')}
                  </label>
                  <input
                    type="url"
                    value={currentVehicle.imageUrl || ''}
                    onChange={(e) => setCurrentVehicle({ ...currentVehicle, imageUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-xs"
                    placeholder="https://images.unsplash.com/photo-..."
                  />
                  {currentVehicle.imageUrl && (
                    <div className="mt-2 flex items-center gap-3 bg-gray-50 p-2 rounded border border-gray-200">
                      <img
                        src={currentVehicle.imageUrl}
                        alt="Preview Armada"
                        className="w-16 h-12 object-cover rounded border border-gray-300"
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'; }}
                      />
                      <span className="text-xs text-gray-500 font-medium">Preview Foto Armada</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('masterVehicle.maxCharter', 'Batas Charter Harian (Unit)')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={currentVehicle.maxCharter}
                    onChange={(e) => setCurrentVehicle({ ...currentVehicle, maxCharter: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-bold text-gray-800"
                    placeholder="Contoh: 3 (Maksimal 3 mobil yang bisa dicarter per hari)"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    💡 Jika diisi misal 3, maka untuk armada ini pada hari tertentu maksimal 3 unit yang bisa dicarter. Isikan 0 jika tidak melayani charter.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('masterVehicle.charterPrice', 'Harga Charter per Hari (Rp)')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={currentVehicle.charterPrice}
                    onChange={(e) => setCurrentVehicle({ ...currentVehicle, charterPrice: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-bold text-gray-800"
                    placeholder="Contoh: 1500000"
                  />
                </div>

                {/* Package Delivery Configuration */}
                <div className="pt-3 border-t border-gray-200 space-y-4">
                  <h4 className="text-xs font-extrabold uppercase text-blue-900 tracking-wider">📦 Konfigurasi Pengiriman Paket / Kargo</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Batas Maksimal Jumlah Paket (Unit / Jadwal)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={currentVehicle.maxPackageCount || 0}
                        onChange={(e) => setCurrentVehicle({ ...currentVehicle, maxPackageCount: parseInt(e.target.value, 10) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-800 outline-none"
                        placeholder="Contoh: 5"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Batas Maksimal Berat Paket (Kg / Jadwal)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={currentVehicle.maxPackageWeight || 0}
                        onChange={(e) => setCurrentVehicle({ ...currentVehicle, maxPackageWeight: parseInt(e.target.value, 10) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-800 outline-none"
                        placeholder="Contoh: 50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Tarif Pengiriman Paket per Kg (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={currentVehicle.packagePricePerKg || 0}
                      onChange={(e) => setCurrentVehicle({ ...currentVehicle, packagePricePerKg: parseInt(e.target.value, 10) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-800 outline-none"
                      placeholder="Contoh: 10000"
                    />
                    <p className="text-[11px] text-gray-500 mt-1">
                      💡 Apabila salah satu batas (jumlah unit atau berat Kg) terpenuhi pada jadwal keberangkatan tertentu, sistem akan memblokir pengiriman paket berikutnya untuk jadwal tersebut.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('common.status')} *
                  </label>
                  <select
                    value={currentVehicle.status}
                    onChange={(e) => setCurrentVehicle({ ...currentVehicle, status: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="ACTIVE">{t('masterVehicle.status.ACTIVE')}</option>
                    <option value="MAINTENANCE">{t('masterVehicle.status.MAINTENANCE')}</option>
                    <option value="INACTIVE">{t('masterVehicle.status.INACTIVE')}</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-semibold"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-bold shadow-md"
                >
                  {editMode ? t('common.edit') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MasterArmada;
