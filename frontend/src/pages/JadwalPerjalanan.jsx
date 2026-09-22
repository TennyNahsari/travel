import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import api, { authService } from '../services/api';
import Pagination from '../components/Pagination';

function JadwalPerjalanan() {
  const { t } = useTranslation();
  const currentUser = authService.getCurrentUser();
  const isDriver = currentUser?.role === 'DRIVER';
  const isStaff = currentUser?.role === 'ADMIN' || currentUser?.role === 'OPERATOR';

  const [activeTab, setActiveTab] = useState('schedules'); // 'schedules' or 'templates'
  const [schedules, setSchedules] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState({
    id: '',
    routeId: '',
    vehicleId: '',
    driverId: '',
    departureDate: '',
    departureTime: '',
    ticketPrice: '',
    isTemplate: false,
    recurringType: 'NONE',
    recurringDays: [],
    templateName: ''
  });
  const [filterDate, setFilterDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('UPCOMING'); // 'UPCOMING', 'SCHEDULED', 'DEPARTED', 'COMPLETED', 'CANCELLED', 'ALL'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    if (activeTab === 'schedules') {
      fetchSchedules();
    } else {
      fetchTemplates();
    }
  }, [filterDate, activeTab]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const params = filterDate ? { date: filterDate } : {};
      const response = await api.get('/schedules', { params });
      // Filter only real schedules (not templates)
      const realSchedules = response.data.data.filter(s => !s.isTemplate);
      setSchedules(realSchedules);
    } catch (err) {
      setError(t('schedule.loadError'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateScheduleStatus = async (scheduleId, newStatus) => {
    try {
      await api.put(`/schedules/${scheduleId}/status`, { status: newStatus });
      setSuccess(t('schedule.statusUpdateSuccess'));
      fetchSchedules();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || t('schedule.statusUpdateError'));
      setTimeout(() => setError(''), 4000);
    }
  };

  const getStatusBadge = (status = 'SCHEDULED') => {
    switch (status) {
      case 'DEPARTED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            {t('schedule.statusDeparted')}
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
            {t('schedule.statusCompleted')}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
            {t('schedule.statusCancelled')}
          </span>
        );
      case 'SCHEDULED':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            {t('schedule.statusScheduled')}
          </span>
        );
    }
  };

  // Memoized sorted and filtered schedules
  const sortedSchedules = useMemo(() => {
    if (schedules.length === 0) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filtered = schedules.filter(s => {
      const scheduleDate = new Date(s.departureDate);
      scheduleDate.setHours(0, 0, 0, 0);
      const isPast = scheduleDate < today;

      if (statusFilter === 'UPCOMING') {
        // Hide past completed or cancelled schedules by default
        if (isPast && (s.status === 'COMPLETED' || s.status === 'CANCELLED')) {
          return false;
        }
        return true;
      } else if (statusFilter === 'ALL') {
        return true;
      } else {
        return s.status === statusFilter;
      }
    });

    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.departureDate);
      const dateB = new Date(b.departureDate);
      
      const [hoursA, minutesA] = (a.departureTime || '00:00').split(':').map(Number);
      const [hoursB, minutesB] = (b.departureTime || '00:00').split(':').map(Number);
      
      dateA.setHours(hoursA, minutesA, 0, 0);
      dateB.setHours(hoursB, minutesB, 0, 0);
      
      if (sortOrder === 'asc') {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    });
  }, [schedules, statusFilter, sortOrder]);

  // Count past schedules
  const pastSchedulesCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return schedules.filter(s => {
      const scheduleDate = new Date(s.departureDate);
      scheduleDate.setHours(0, 0, 0, 0);
      return scheduleDate < today;
    }).length;
  }, [schedules]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.get('/schedule-templates');
      setTemplates(response.data.data);
    } catch (err) {
      setError(t('schedule.templateLoadError'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePastSchedules = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Count past schedules
    const pastSchedules = schedules.filter(s => {
      const scheduleDate = new Date(s.departureDate);
      scheduleDate.setHours(0, 0, 0, 0);
      return scheduleDate < today;
    });
    
    if (pastSchedules.length === 0) {
      setError(t('schedule.noPastSchedules'));
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    const confirmMessage = t('schedule.deletePastConfirm', { count: pastSchedules.length });
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Delete each past schedule
      let deletedCount = 0;
      for (const schedule of pastSchedules) {
        try {
          await api.delete(`/schedules/${schedule.id}`);
          deletedCount++;
        } catch (err) {
          console.error('Failed to delete schedule:', schedule.id, err);
        }
      }
      
      setSuccess(t('schedule.deletePastSuccess', { count: deletedCount }));
      fetchSchedules();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || t('schedule.deletePastError'));
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [routesRes, vehiclesRes, driversRes] = await Promise.all([
        api.get('/schedules/dropdown/routes'),
        api.get('/schedules/dropdown/vehicles'),
        api.get('/schedules/dropdown/drivers')
      ]);
      
      setRoutes(routesRes.data.data);
      setVehicles(vehiclesRes.data.data);
      setDrivers(driversRes.data.data);
    } catch (err) {
      console.error('Gagal mengambil data dropdown:', err);
    }
  };

  const handleOpenModal = async (schedule = null, isTemplate = false) => {
    await fetchDropdownData();
    
    if (schedule) {
      setEditMode(true);
      const departureDate = schedule.departureDate ? new Date(schedule.departureDate).toISOString().split('T')[0] : '';
      
      setCurrentSchedule({
        id: schedule.id,
        routeId: schedule.routeId,
        vehicleId: schedule.vehicleId,
        driverId: schedule.driverId,
        departureDate: departureDate,
        departureTime: schedule.departureTime,
        ticketPrice: schedule.ticketPrice,
        isTemplate: schedule.isTemplate || false,
        recurringType: schedule.recurringType || 'NONE',
        recurringDays: schedule.recurringDays || [],
        templateName: schedule.templateName || '',
        poolOrigin: schedule.poolOrigin || '',
        poolDestination: schedule.poolDestination || '',
        imageUrl: schedule.imageUrl || ''
      });
    } else {
      setEditMode(false);
      setCurrentSchedule({
        id: '',
        routeId: '',
        vehicleId: '',
        driverId: '',
        departureDate: '',
        departureTime: '',
        ticketPrice: '',
        isTemplate: isTemplate,
        recurringType: 'NONE',
        recurringDays: [],
        templateName: '',
        poolOrigin: '',
        poolDestination: '',
        imageUrl: ''
      });
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentSchedule({
      id: '',
      routeId: '',
      vehicleId: '',
      driverId: '',
      departureDate: '',
      departureTime: '',
      ticketPrice: '',
      isTemplate: false,
      recurringType: 'NONE',
      recurringDays: [],
      templateName: '',
      poolOrigin: '',
      poolDestination: '',
      imageUrl: ''
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const payload = {
        routeId: currentSchedule.routeId,
        vehicleId: currentSchedule.vehicleId,
        driverId: currentSchedule.driverId,
        departureTime: currentSchedule.departureTime,
        ticketPrice: currentSchedule.ticketPrice,
        poolOrigin: currentSchedule.poolOrigin || null,
        poolDestination: currentSchedule.poolDestination || null,
        imageUrl: currentSchedule.imageUrl || null
      };

      if (currentSchedule.isTemplate) {
        // Template: tidak perlu departureDate
        payload.isTemplate = true;
        payload.recurringType = currentSchedule.recurringType;
        payload.templateName = currentSchedule.templateName;
        
        if (currentSchedule.recurringType === 'WEEKLY') {
          payload.recurringDays = currentSchedule.recurringDays;
        }

        if (editMode) {
          await api.put(`/schedule-templates/${currentSchedule.id}`, payload);
          setSuccess(t('schedule.templateUpdateSuccess'));
        } else {
          await api.post('/schedule-templates', payload);
          setSuccess(t('schedule.templateAddSuccess'));
        }
        fetchTemplates();
      } else {
        // Real schedule: perlu departureDate
        payload.departureDate = currentSchedule.departureDate;
        
        if (editMode) {
          await api.put(`/schedules/${currentSchedule.id}`, payload);
          setSuccess(t('schedule.updateSuccess'));
        } else {
          await api.post('/schedules', payload);
          setSuccess(t('schedule.addSuccess'));
        }
        fetchSchedules();
      }
      
      setTimeout(() => {
        handleCloseModal();
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || t('schedule.saveError'));
    }
  };

  const handleDelete = async (id, route) => {
    if (window.confirm(t('schedule.deleteConfirm', { route }))) {
      try {
        await api.delete(`/schedules/${id}`);
        setSuccess(t('schedule.deleteSuccess'));
        fetchSchedules();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.response?.data?.error || t('schedule.saveError'));
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const handleDeleteTemplate = async (id, name) => {
    if (window.confirm(t('schedule.deleteTemplateConfirm', { name }))) {
      try {
        await api.delete(`/schedule-templates/${id}`);
        setSuccess(t('schedule.deleteTemplateSuccess'));
        fetchTemplates();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.response?.data?.error || t('schedule.deleteTemplateError'));
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const toggleRecurringDay = (day) => {
    const days = [...currentSchedule.recurringDays];
    const index = days.indexOf(day);
    if (index > -1) {
      days.splice(index, 1);
    } else {
      days.push(day);
    }
    setCurrentSchedule({ ...currentSchedule, recurringDays: days.sort() });
  };

  const getDayName = (day) => {
    const keys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    return t(`schedule.days.${keys[day]}`);
  };

  const getRecurringTypeLabel = (type) => {
    return t(`schedule.recurring.${type}`, type);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(t('common.locale') || 'id-ID', { 
      weekday: 'short',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString) => {
    return timeString;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getSeatsStatus = (availableSeats, capacity) => {
    const percentage = (availableSeats / capacity) * 100;
    if (percentage > 50) return 'text-green-600 bg-green-50';
    if (percentage > 20) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{t('schedule.title')}</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">{t('schedule.subtitle')}</p>
        </div>
        
        {/* Controls Section */}
        <div className="flex flex-col gap-3">
          {/* Row 1: Date, Sort, Add Button */}
          <div className="flex flex-wrap gap-2">
            {activeTab === 'schedules' && (
              <>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="flex-1 min-w-[140px] px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white font-medium text-gray-700"
                >
                  <option value="UPCOMING">{t('schedule.filterUpcoming')}</option>
                  <option value="SCHEDULED">{t('schedule.filterScheduled')}</option>
                  <option value="DEPARTED">{t('schedule.filterDeparted')}</option>
                  <option value="COMPLETED">{t('schedule.filterCompleted')}</option>
                  <option value="CANCELLED">{t('schedule.filterCancelled')}</option>
                  <option value="ALL">{t('schedule.filterAll')}</option>
                </select>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                >
                  <option value="asc">↑ {t('schedule.oldest')}</option>
                  <option value="desc">↓ {t('schedule.newest')}</option>
                </select>
              </>
            )}
            {!isDriver && (
              <button
                onClick={() => handleOpenModal(null, activeTab === 'templates')}
                className="flex-1 sm:flex-initial bg-blue-600 text-white px-3 sm:px-4 py-2 text-sm rounded-lg hover:bg-blue-700 transition flex items-center justify-center whitespace-nowrap"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {activeTab === 'schedules' ? t('schedule.addSchedule') : t('schedule.addTemplate')}
              </button>
            )}
          </div>
          
          {/* Row 2: Action Buttons (only for schedules tab) */}
          {activeTab === 'schedules' && !isDriver && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleDeletePastSchedules}
                disabled={pastSchedulesCount === 0}
                className="flex-1 sm:flex-initial bg-red-600 text-white px-3 sm:px-4 py-2 text-sm rounded-lg hover:bg-red-700 transition flex items-center justify-center whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed relative"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="hidden sm:inline">{t('schedule.deletePastSchedules')}</span>
                <span className="sm:hidden">{t('schedule.deletePastSchedules')}</span>
                {pastSchedulesCount > 0 && (
                  <span className="ml-1 sm:ml-2 bg-white text-red-600 px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-bold">
                    {pastSchedulesCount}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4 sm:mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('schedules')}
          className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium transition whitespace-nowrap ${
            activeTab === 'schedules'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('schedule.activeSchedules')}
        </button>
        {!isDriver && (
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium transition whitespace-nowrap ${
              activeTab === 'templates'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('schedule.scheduleTemplates')}
          </button>
        )}
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

      {/* Schedules Table */}
      {activeTab === 'schedules' && (
        <div className="bg-white rounded-xl shadow-md max-w-full">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 mt-2">{t('common.loading')}</p>
            </div>
          ) : (
            <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto w-full max-w-full rounded-xl">
              <table className="w-full min-w-[1150px] divide-y divide-gray-200">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      {t('schedule.number')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      {t('schedule.routeAndPool')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      {t('schedule.dateTimeHeader')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      {t('schedule.vehicleHeader')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      {t('schedule.driverHeader')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      {t('schedule.priceHeader')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      {t('schedule.seatsAvailableHeader')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      {t('schedule.statusHeader')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      {t('common.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedSchedules.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                        {filterDate ? t('schedule.noScheduleOnDate') : t('common.noData')}
                      </td>
                    </tr>
                  ) : (
                    sortedSchedules.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((schedule, index) => {
                      const canDriverUpdate = isStaff || (isDriver && schedule.driver?.userId === currentUser?.id);
                      const poolOriginText = schedule.poolOrigin || (schedule.route?.originCity?.name ? `${t('schedule.poolPrefix')} ${schedule.route.originCity.name}` : '-');
                      const poolDestText = schedule.poolDestination || (schedule.route?.destinationCity?.name ? `${t('schedule.poolPrefix')} ${schedule.route.destinationCity.name}` : '-');

                      return (
                        <tr key={schedule.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-800">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-bold text-gray-900">
                              {schedule.route.originCity.name} → {schedule.route.destinationCity.name}
                            </div>
                            <div className="text-xs text-gray-500 mb-1">
                              {schedule.route.originCity.province} - {schedule.route.destinationCity.province}
                            </div>
                            <div className="text-[11px] text-blue-800 bg-blue-50/90 p-2 rounded-lg border border-blue-100 space-y-0.5 mt-1 font-medium">
                              <div>🏢 <strong>{t('schedule.poolOriginLabel')}:</strong> {poolOriginText}</div>
                              <div>🏁 <strong>{t('schedule.poolDestinationLabel')}:</strong> {poolDestText}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-800">
                              {formatDate(schedule.departureDate)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatTime(schedule.departureTime)} {t('common.timezone')}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-800">{schedule.vehicle.vehicleType}</div>
                            <div className="text-xs text-gray-500">{schedule.vehicle.plateNumber}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-800">{schedule.driver.user.name}</div>
                            <div className="text-xs text-gray-500">{schedule.driver.licenseNumber}</div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-800">
                            {formatCurrency(schedule.ticketPrice)}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getSeatsStatus(schedule.availableSeats, schedule.vehicle.capacity)}`}>
                              {schedule.availableSeats} / {schedule.vehicle.capacity}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              {getStatusBadge(schedule.status)}
                              {canDriverUpdate ? (
                                <select
                                  value={schedule.status || 'SCHEDULED'}
                                  onChange={(e) => handleUpdateScheduleStatus(schedule.id, e.target.value)}
                                  className="text-[11px] font-semibold border border-gray-300 rounded px-1.5 py-0.5 mt-1 bg-white outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value="SCHEDULED">📅 SCHEDULED ({t('schedule.statusScheduledText')})</option>
                                  <option value="DEPARTED">🚌 DEPARTED ({t('schedule.statusDepartedText')})</option>
                                  <option value="COMPLETED">🏁 COMPLETED ({t('schedule.statusCompletedText')})</option>
                                  <option value="CANCELLED">❌ CANCELLED ({t('schedule.statusCancelledText')})</option>
                                </select>
                              ) : (
                                <span className="text-[10px] text-gray-400 mt-0.5">{t('schedule.otherDriver')}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="flex flex-col gap-1.5">
                              {isStaff && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleOpenModal(schedule)}
                                    className="text-blue-600 hover:text-blue-800 text-xs font-semibold"
                                  >
                                    {t('common.edit')}
                                  </button>
                                  <span className="text-gray-300">|</span>
                                  <button
                                    onClick={() => handleDelete(schedule.id, `${schedule.route.originCity.name} - ${schedule.route.destinationCity.name}`)}
                                    className="text-red-600 hover:text-red-800 text-xs font-semibold"
                                  >
                                    {t('common.delete')}
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Mobile Card View */}
            <div className="md:hidden">
              {sortedSchedules.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  {filterDate ? t('schedule.noScheduleOnDate') : t('common.noData')}
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {sortedSchedules.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((schedule, index) => {
                    const canDriverUpdate = isStaff || (isDriver && schedule.driver?.userId === currentUser?.id);
                    return (
                      <div key={schedule.id} className="p-4 hover:bg-gray-50">
                        {/* Header: Number & Route & Status */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                              <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                                #{(currentPage - 1) * itemsPerPage + index + 1}
                              </span>
                              {getStatusBadge(schedule.status)}
                              <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${getSeatsStatus(schedule.availableSeats, schedule.vehicle.capacity)}`}>
                                {schedule.availableSeats}/{schedule.vehicle.capacity} kursi
                              </span>
                            </div>
                            <p className="text-sm font-bold text-gray-800">
                              {schedule.route.originCity.name} → {schedule.route.destinationCity.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {schedule.route.originCity.province} - {schedule.route.destinationCity.province}
                            </p>
                          </div>
                        </div>

                        {/* Date & Time */}
                        <div className="mb-3 pb-3 border-b border-gray-100">
                          <div className="flex items-center gap-2 text-sm">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium text-gray-800">{formatDate(schedule.departureDate)}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600">{formatTime(schedule.departureTime)} {t('common.timezone', 'WIB')}</span>
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                          <div>
                            <span className="text-gray-500 block mb-1">{t('schedule.vehicleLabel', 'Armada:')}</span>
                            <p className="font-medium text-gray-800">{schedule.vehicle.vehicleType}</p>
                            <p className="text-gray-500">{schedule.vehicle.plateNumber}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 block mb-1">{t('schedule.driverLabel', 'Driver:')}</span>
                            <p className="font-medium text-gray-800">{schedule.driver.user.name}</p>
                            <p className="text-gray-500">{schedule.driver.licenseNumber}</p>
                          </div>
                          <div className="col-span-2 bg-blue-50/80 p-2 rounded-lg border border-blue-100 space-y-0.5 text-[11px] text-blue-800 font-medium">
                            <div>🏢 <strong>{t('schedule.poolOriginLabel', 'Pool Asal')}:</strong> {schedule.poolOrigin || (schedule.route?.originCity?.name ? `Pool ${schedule.route.originCity.name}` : '-')}</div>
                            <div>🏁 <strong>{t('schedule.poolDestinationLabel', 'Pool Tujuan')}:</strong> {schedule.poolDestination || (schedule.route?.destinationCity?.name ? `Pool ${schedule.route.destinationCity.name}` : '-')}</div>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-500 block mb-1">{t('schedule.ticketPriceLabel', 'Harga Tiket:')}</span>
                            <p className="font-bold text-blue-600 text-sm">{formatCurrency(schedule.ticketPrice)}</p>
                          </div>
                        </div>

                        {/* Status Selector */}
                        {canDriverUpdate ? (
                          <div className="mb-3">
                            <label className="text-[11px] font-semibold text-gray-500 block mb-1">{t('schedule.updateTripStatusLabel')}</label>
                            <select
                              value={schedule.status || 'SCHEDULED'}
                              onChange={(e) => handleUpdateScheduleStatus(schedule.id, e.target.value)}
                              className="w-full text-xs font-semibold border border-gray-300 rounded px-2 py-1.5 bg-white outline-none"
                            >
                              <option value="SCHEDULED">📅 SCHEDULED ({t('schedule.statusScheduledText')})</option>
                              <option value="DEPARTED">🚌 DEPARTED ({t('schedule.statusDepartedText')})</option>
                              <option value="COMPLETED">🏁 COMPLETED ({t('schedule.statusCompletedText')})</option>
                              <option value="CANCELLED">❌ CANCELLED ({t('schedule.statusCancelledText')})</option>
                            </select>
                          </div>
                        ) : (
                          <div className="mb-3 text-[11px] text-gray-400 italic">
                            {t('schedule.driverStatusNotice', { name: schedule.driver.user.name })}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col gap-2 pt-3 border-t border-gray-100">
                          {isStaff && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleOpenModal(schedule)}
                                className="flex-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-2 rounded-lg font-medium transition"
                              >
                                {t('common.edit')}
                              </button>
                              <button
                                onClick={() => handleDelete(schedule.id, `${schedule.route.originCity.name} - ${schedule.route.destinationCity.name}`)}
                                className="flex-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 rounded-lg font-medium transition"
                              >
                                {t('common.delete')}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            </>
          )}
          {!loading && sortedSchedules.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalItems={sortedSchedules.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      )}

      {/* Templates Table */}
      {activeTab === 'templates' && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 mt-2">{t('common.loading')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('schedule.number')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('schedule.templateNameHeader')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('schedule.routeHeader')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('schedule.recurringPatternHeader')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('schedule.departureTimeHeader')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('schedule.vehicleHeader')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('schedule.statusHeader')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('common.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {templates.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                        {t('schedule.noTemplatesYet')}
                      </td>
                    </tr>
                  ) : (
                    templates.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((template, index) => (
                      <tr key={template.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-800">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-800">{template.templateName || '-'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-800">
                            {template.route.originCity.name} → {template.route.destinationCity.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {template.route.originCity.province} - {template.route.destinationCity.province}
                          </div>
                          {(template.poolOrigin || template.poolDestination) && (
                            <div className="text-[11px] text-blue-700 mt-1.5 bg-blue-50/80 p-1.5 rounded-md border border-blue-100 space-y-0.5">
                              <div>🏢 <strong>{t('schedule.originPoolLabel')}:</strong> {template.poolOrigin || '-'}</div>
                              <div>🏁 <strong>{t('schedule.destPoolLabel')}:</strong> {template.poolDestination || '-'}</div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-800">{getRecurringTypeLabel(template.recurringType)}</div>
                          {template.recurringType === 'WEEKLY' && template.recurringDays && (
                            <div className="text-xs text-gray-500 mt-1">
                              {template.recurringDays.map(day => getDayName(day)).join(', ')}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800">
                          {formatTime(template.departureTime)} {t('common.timezone')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-800">{template.vehicle.vehicleType}</div>
                          <div className="text-xs text-gray-500">{template.vehicle.plateNumber}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                            template.isActive ? 'text-green-600 bg-green-50' : 'text-gray-600 bg-gray-50'
                          }`}>
                            {template.isActive ? t('common.active') : t('common.inactive')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleOpenModal(template, true)}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              {t('common.edit')}
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate(template.id, template.templateName)}
                              className="text-red-600 hover:text-red-800 font-medium"
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
          )}
          {!loading && templates.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalItems={templates.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      )}



      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-800">
                {editMode 
                  ? (currentSchedule.isTemplate ? t('schedule.editTemplate') : t('schedule.editSchedule'))
                  : (currentSchedule.isTemplate ? t('schedule.addTemplate') : t('schedule.addSchedule'))
                }
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Template Name (only for templates) */}
                {currentSchedule.isTemplate && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('schedule.templateName')} *
                    </label>
                    <input
                      type="text"
                      value={currentSchedule.templateName}
                      onChange={(e) => setCurrentSchedule({ ...currentSchedule, templateName: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder={t('schedule.templateNamePlaceholder')}
                    />
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('dashboard.route')} *
                  </label>
                  <select
                    value={currentSchedule.routeId}
                    onChange={(e) => setCurrentSchedule({ ...currentSchedule, routeId: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">{t('schedule.selectRoute')}</option>
                    {routes.map((route) => (
                      <option key={route.id} value={route.id}>
                        {route.originCity.name} → {route.destinationCity.name} ({route.distance} km)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('schedule.vehicle')} *
                  </label>
                  <select
                    value={currentSchedule.vehicleId}
                    onChange={(e) => setCurrentSchedule({ ...currentSchedule, vehicleId: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">{t('schedule.selectVehicle')}</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.vehicleType} - {vehicle.plateNumber} ({vehicle.capacity} {t('schedule.seats')})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('schedule.driver')} *
                  </label>
                  <select
                    value={currentSchedule.driverId}
                    onChange={(e) => setCurrentSchedule({ ...currentSchedule, driverId: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">{t('schedule.selectDriver')}</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.user.name} - {driver.licenseNumber}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Recurring Type (only for templates) */}
                {currentSchedule.isTemplate && (
                  <>
                    <div className="md:col-span-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 flex items-center gap-2">
                      <span className="text-base">✨</span>
                      <span>{t('schedule.autoGenerateNotice')}</span>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('schedule.recurringPattern')} *
                      </label>
                    <select
                      value={currentSchedule.recurringType}
                      onChange={(e) => setCurrentSchedule({ ...currentSchedule, recurringType: e.target.value, recurringDays: e.target.value === 'WEEKLY' ? currentSchedule.recurringDays : [] })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="DAILY">{t('schedule.daily')}</option>
                      <option value="WEEKLY">{t('schedule.weekly')}</option>
                      <option value="MONTHLY">{t('schedule.monthly')}</option>
                    </select>
                  </div>
                  </>
                )}

                {/* Recurring Days (only for WEEKLY templates) */}
                {currentSchedule.isTemplate && currentSchedule.recurringType === 'WEEKLY' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('schedule.selectOperationalDays')} *
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleRecurringDay(day)}
                          className={`px-4 py-2 rounded-lg border transition ${
                            currentSchedule.recurringDays.includes(day)
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-blue-600'
                          }`}
                        >
                          {getDayName(day)}
                        </button>
                      ))}
                    </div>
                    {currentSchedule.recurringDays.length === 0 && (
                      <p className="text-sm text-red-600 mt-1">{t('schedule.selectAtLeast1Day')}</p>
                    )}
                  </div>
                )}

                {/* Departure Date (only for real schedules) */}
                {!currentSchedule.isTemplate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('schedule.departureDate')} *
                    </label>
                    <input
                      type="date"
                      value={currentSchedule.departureDate}
                      onChange={(e) => setCurrentSchedule({ ...currentSchedule, departureDate: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('schedule.departureTime')} *
                  </label>
                  <input
                    type="time"
                    value={currentSchedule.departureTime}
                    onChange={(e) => setCurrentSchedule({ ...currentSchedule, departureTime: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('schedule.ticketPrice')} (Rp) *
                  </label>
                  <input
                    type="number"
                    value={currentSchedule.ticketPrice}
                    onChange={(e) => setCurrentSchedule({ ...currentSchedule, ticketPrice: e.target.value })}
                    required
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder={t('schedule.pricePlaceholder', 'Contoh: 150000')}
                  />
                </div>

                {/* Pool Keberangkatan (Pool Origin) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('schedule.poolOrigin')}
                  </label>
                  <input
                    type="text"
                    value={currentSchedule.poolOrigin || ''}
                    onChange={(e) => setCurrentSchedule({ ...currentSchedule, poolOrigin: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder={t('schedule.poolOriginPlaceholder')}
                  />
                </div>

                {/* Pool Tujuan (Pool Destination) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('schedule.poolDestination')}
                  </label>
                  <input
                    type="text"
                    value={currentSchedule.poolDestination || ''}
                    onChange={(e) => setCurrentSchedule({ ...currentSchedule, poolDestination: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder={t('schedule.poolDestinationPlaceholder')}
                  />
                </div>

                {/* URL Photo Representasi Jadwal */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('schedule.schedulePhotoUrl')}
                  </label>
                  <input
                    type="url"
                    value={currentSchedule.imageUrl || ''}
                    onChange={(e) => setCurrentSchedule({ ...currentSchedule, imageUrl: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="https://images.unsplash.com/photo-..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t('schedule.imageTip')}
                  </p>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={currentSchedule.isTemplate && currentSchedule.recurringType === 'WEEKLY' && currentSchedule.recurringDays.length === 0}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
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

export default JadwalPerjalanan;
