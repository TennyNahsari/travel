import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authService } from '../services/api';
import LanguageSwitcher from '../components/LanguageSwitcher';
import MasterKota from './MasterKota';
import MasterRute from './MasterRute';
import MasterTemplateKursi from './MasterTemplateKursi';
import MasterArmada from './MasterArmada';
import MasterDriver from './MasterDriver';
import JadwalPerjalanan from './JadwalPerjalanan';
import ManajemenUser from './ManajemenUser';
import BookingTiket from './BookingTiket';
import Pembayaran from './Pembayaran';
import CheckIn from './CheckIn';
import Laporan from './Laporan';
import PengaturanQris from './PengaturanQris';
import PengaturanSosmed from './PengaturanSosmed';
import AIPrediction from '../components/AIPrediction';

function Dashboard({ user, page = 'dashboard' }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(user);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(page);
  const [expandedMenus, setExpandedMenus] = useState(['masterdata']);

  useEffect(() => {
    if (!currentUser) {
      const storedUser = authService.getCurrentUser();
      setCurrentUser(storedUser);
    }
  }, [currentUser]);

  useEffect(() => {
    setActiveMenu(page);
  }, [page]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleMenuClick = (menuId) => {
    setActiveMenu(menuId);
    setSidebarOpen(false);
    
    // Navigate to different routes
    switch(menuId) {
      case 'dashboard':
        navigate('/dashboard');
        break;
      case 'kota':
        navigate('/master-kota');
        break;
      case 'rute':
        navigate('/master-rute');
        break;
      case 'template-kursi':
        navigate('/master-template-kursi');
        break;
      case 'armada':
        navigate('/master-armada');
        break;
      case 'driver':
        navigate('/master-driver');
        break;
      case 'jadwal':
        navigate('/jadwal-perjalanan');
        break;
      case 'booking':
        navigate('/booking-tiket');
        break;
      case 'pembayaran':
        navigate('/pembayaran');
        break;
      case 'qris':
        navigate('/pengaturan-qris');
        break;
      case 'sosmed':
        navigate('/pengaturan-sosmed');
        break;
      case 'checkin':
        navigate('/check-in');
        break;
      case 'laporan':
        navigate('/laporan');
        break;
      case 'users':
        navigate('/manajemen-user');
        break;
      default:
        break;
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      ADMIN: 'bg-travel-blue/15 text-travel-blue border border-travel-blue/30',
      OPERATOR: 'bg-tropical-teal/15 text-tropical-teal border border-tropical-teal/30',
      DRIVER: 'bg-sunset-orange/15 text-sunset-orange border border-sunset-orange/30',
      CUSTOMER: 'bg-sky-100 text-sky-800'
    };
    return colors[role] || 'bg-slate-100 text-slate-800';
  };

  const toggleMenu = (menuId) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const getMenuItems = () => {
    const allMenus = [
      { id: 'dashboard', label: t('sidebar.dashboard'), icon: '📊', roles: ['ADMIN', 'OPERATOR', 'DRIVER', 'CUSTOMER'] },
      { 
        id: 'masterdata', 
        label: t('sidebar.masterData'), 
        icon: '📁', 
        roles: ['ADMIN', 'OPERATOR'],
        submenus: [
          { id: 'kota', label: t('sidebar.masterCity'), icon: '🏙️', roles: ['ADMIN', 'OPERATOR'] },
          { id: 'rute', label: t('sidebar.masterRoute'), icon: '🗺️', roles: ['ADMIN', 'OPERATOR'] },
          { id: 'driver', label: t('sidebar.masterDriver'), icon: '👨‍✈️', roles: ['ADMIN', 'OPERATOR'] },
          { id: 'template-kursi', label: t('sidebar.masterSeatTemplate'), icon: '🪑', roles: ['ADMIN', 'OPERATOR'] },
          { id: 'armada', label: t('sidebar.masterVehicle'), icon: '🚐', roles: ['ADMIN', 'OPERATOR'] },
          { id: 'qris', label: t('sidebar.qrisSetting', 'Pengaturan QRIS'), icon: '📱', roles: ['ADMIN', 'OPERATOR'] },
          { id: 'sosmed', label: t('sidebar.socialSetting', 'Pengaturan Social Media'), icon: '🌐', roles: ['ADMIN', 'OPERATOR'] },
        ]
      },
      { id: 'jadwal', label: t('sidebar.travelSchedule'), icon: '📅', roles: ['ADMIN', 'OPERATOR', 'DRIVER'] },
      { id: 'booking', label: t('sidebar.bookingTicket'), icon: '🎫', roles: ['ADMIN', 'OPERATOR', 'CUSTOMER'] },
      { id: 'pembayaran', label: t('sidebar.payment'), icon: '💳', roles: ['ADMIN', 'OPERATOR'] },
      { id: 'checkin', label: t('sidebar.checkIn'), icon: '✅', roles: ['ADMIN', 'OPERATOR', 'DRIVER'] },
      { id: 'laporan', label: t('sidebar.reports'), icon: '📈', roles: ['ADMIN', 'OPERATOR'] },
      { id: 'users', label: t('sidebar.userManagement'), icon: '👥', roles: ['ADMIN'] },
    ];

    return allMenus.filter(menu => menu.roles.includes(currentUser?.role));
  };

  const stats = [
    { labelKey: 'dashboard.statistics.totalTrips', value: '12', icon: '🚐', color: 'bg-travel-blue/10 text-travel-blue border border-travel-blue/20' },
    { labelKey: 'dashboard.statistics.bookingsToday', value: '8', icon: '🎫', color: 'bg-tropical-teal/10 text-tropical-teal border border-tropical-teal/20' },
    { labelKey: 'dashboard.statistics.activeVehicles', value: '5', icon: '🚗', color: 'bg-sunset-orange/10 text-sunset-orange border border-sunset-orange/20' },
    { labelKey: 'dashboard.statistics.totalRevenue', value: 'Rp 2.4M', icon: '💰', color: 'bg-emerald-50 text-emerald-600 border border-emerald-200' }
  ];

  const recentBookings = [
    { code: 'BK-001', route: 'Jakarta - Bandung', customer: 'John Doe', status: 'PAID' },
    { code: 'BK-002', route: 'Bandung - Yogyakarta', customer: 'Jane Smith', status: 'CONFIRMED' },
    { code: 'BK-003', route: 'Jakarta - Surabaya', customer: 'Bob Wilson', status: 'PENDING' }
  ];

  const menuItems = getMenuItems();

  return (
    <div className="min-h-screen bg-soft-sky flex text-deep-navy font-sans">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-deep-navy text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 border-r border-slate-800 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
            <button onClick={() => navigate('/')} className="flex items-center gap-2.5 text-left group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-travel-blue to-tropical-teal flex items-center justify-center text-white shadow-md">
                <span className="text-lg">🧭</span>
              </div>
              <div>
                <span className="text-lg font-extrabold text-white tracking-tight">
                  Travel<span className="text-travel-blue">App</span>
                </span>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest -mt-1">
                  Back to Landing
                </p>
              </div>
            </button>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Profile Info */}
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Logged in as</p>
            <p className="text-sm font-bold text-white mt-0.5">{currentUser?.name}</p>
            <span className={`inline-block px-2.5 py-0.5 mt-2 text-[11px] font-extrabold rounded-full ${getRoleBadgeColor(currentUser?.role)}`}>
              {currentUser?.role}
            </span>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-3 py-6 overflow-y-auto">
            <ul className="space-y-1.5">
              {menuItems.map((menu) => (
                <li key={menu.id}>
                  {menu.submenus ? (
                    <div>
                      <button
                        onClick={() => toggleMenu(menu.id)}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors text-slate-300 hover:bg-white/10 hover:text-white"
                      >
                        <div className="flex items-center">
                          <span className="text-lg mr-3">{menu.icon}</span>
                          <span className="text-sm font-bold">{menu.label}</span>
                        </div>
                        <svg 
                          className={`w-4 h-4 transition-transform ${
                            expandedMenus.includes(menu.id) ? 'rotate-180' : ''
                          }`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {expandedMenus.includes(menu.id) && (
                        <ul className="mt-1.5 ml-3 pl-3 border-l border-slate-800 space-y-1">
                          {menu.submenus.map((submenu) => (
                            <li key={submenu.id}>
                              <button
                                onClick={() => handleMenuClick(submenu.id)}
                                className={`w-full flex items-center px-3.5 py-2 rounded-xl transition-all text-xs font-bold ${
                                  activeMenu === submenu.id
                                    ? 'bg-travel-blue text-white shadow-md shadow-travel-blue/30'
                                    : 'text-slate-400 hover:bg-white/10 hover:text-white'
                                }`}
                              >
                                <span className="text-base mr-2.5">{submenu.icon}</span>
                                <span>{submenu.label}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleMenuClick(menu.id)}
                      className={`w-full flex items-center px-3.5 py-2.5 rounded-xl transition-all text-sm font-bold ${
                        activeMenu === menu.id
                          ? 'bg-travel-blue text-white shadow-md shadow-travel-blue/30'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span className="text-lg mr-3">{menu.icon}</span>
                      <span>{menu.label}</span>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Logout & Home Buttons */}
          <div className="p-4 border-t border-slate-800 space-y-2">
            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center justify-center px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors"
            >
              🌐 Visit Landing Page
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-4 py-2.5 bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white border border-red-500/30 rounded-xl text-xs font-bold transition-all"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {t('common.logout')}
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-deep-navy/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top Navbar Header */}
        <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-soft">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-deep-navy p-2 hover:bg-soft-sky rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <div className="flex items-center gap-2 lg:hidden">
                <span className="text-lg font-extrabold text-deep-navy">
                  Travel<span className="text-travel-blue">App</span>
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/')}
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 bg-soft-sky text-travel-blue hover:bg-travel-blue/10 border border-travel-blue/20 rounded-xl text-xs font-bold transition-colors"
                >
                  🌐 Landing Page
                </button>
                <LanguageSwitcher />
                <button className="relative p-2 text-slate-600 hover:text-deep-navy hover:bg-soft-sky rounded-xl transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-sunset-orange ring-2 ring-white"></span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {activeMenu === 'kota' && <MasterKota />}
          {activeMenu === 'rute' && <MasterRute />}
          {activeMenu === 'armada' && <MasterArmada />}
          {activeMenu === 'driver' && <MasterDriver />}
          {activeMenu === 'template-kursi' && <MasterTemplateKursi />}
          {activeMenu === 'jadwal' && <JadwalPerjalanan />}
          {activeMenu === 'booking' && <BookingTiket />}
          {activeMenu === 'pembayaran' && <Pembayaran />}
          {activeMenu === 'qris' && <PengaturanQris />}
          {activeMenu === 'sosmed' && <PengaturanSosmed />}
          {activeMenu === 'checkin' && <CheckIn />}
          {activeMenu === 'laporan' && <Laporan />}
          {activeMenu === 'users' && <ManajemenUser />}
          
          {/* Dashboard Home */}
          {activeMenu === 'dashboard' && (
            <>
              {/* Welcome Section */}
              <div className="mb-6 sm:mb-8 bg-gradient-to-r from-travel-blue via-blue-600 to-tropical-teal p-6 sm:p-8 rounded-3xl text-white shadow-card">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mb-2">
                  {t('common.welcome')}, {currentUser?.name}! 👋
                </h1>
                <p className="text-white/90 text-sm sm:text-base font-normal max-w-2xl">
                  {t('dashboard.subtitle')} — Kelola armada, rute, jadwal, dan booking tiket dalam satu panel dashboard terpadu.
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                  <div key={index} className="bg-white rounded-2xl shadow-soft p-6 border border-slate-100 hover:shadow-card transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`text-2xl ${stat.color} rounded-2xl w-12 h-12 flex items-center justify-center`}>
                        {stat.icon}
                      </div>
                    </div>
                    <h3 className="text-slate-gray text-xs font-bold uppercase tracking-wider mb-1">{t(stat.labelKey)}</h3>
                    <p className="text-2xl font-extrabold text-deep-navy">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Recent Bookings */}
              <div className="bg-white rounded-3xl shadow-soft border border-slate-100 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                  <h2 className="text-lg sm:text-xl font-extrabold text-deep-navy">{t('dashboard.recentBookings')}</h2>
                  <button className="text-travel-blue hover:text-travel-blue-dark font-bold text-xs flex items-center gap-1">
                    <span>{t('dashboard.viewAll')}</span>
                    <span>→</span>
                  </button>
                </div>

                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-soft-sky">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-gray uppercase tracking-wider rounded-l-xl">
                          {t('dashboard.bookingCode')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-gray uppercase tracking-wider">
                          {t('dashboard.route')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-gray uppercase tracking-wider">
                          {t('dashboard.customer')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-gray uppercase tracking-wider rounded-r-xl">
                          {t('common.status')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentBookings.map((booking, index) => (
                        <tr key={index} className="hover:bg-soft-sky/50 transition-colors">
                          <td className="px-4 py-4 text-xs font-bold text-deep-navy">
                            {booking.code}
                          </td>
                          <td className="px-4 py-4 text-xs text-slate-gray font-medium">
                            {booking.route}
                          </td>
                          <td className="px-4 py-4 text-xs text-slate-gray font-medium">
                            {booking.customer}
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-block px-3 py-1 text-[11px] font-extrabold rounded-full ${
                              booking.status === 'PAID' ? 'bg-tropical-teal/15 text-tropical-teal' :
                              booking.status === 'CONFIRMED' ? 'bg-travel-blue/15 text-travel-blue' :
                              'bg-sunset-orange/15 text-sunset-orange'
                            }`}>
                              {booking.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden space-y-3">
                  {recentBookings.map((booking, index) => (
                    <div key={index} className="border border-slate-100 rounded-2xl p-4 bg-soft-sky/40">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-xs font-bold text-deep-navy">{booking.code}</p>
                          <p className="text-xs text-slate-gray mt-0.5">{booking.route}</p>
                        </div>
                        <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full ${
                          booking.status === 'PAID' ? 'bg-tropical-teal/15 text-tropical-teal' :
                          booking.status === 'CONFIRMED' ? 'bg-travel-blue/15 text-travel-blue' :
                          'bg-sunset-orange/15 text-sunset-orange'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-gray">{booking.customer}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Prediction Section */}
              <div className="mt-8">
                <AIPrediction />
              </div>
            </>
          )}

          {!['dashboard', 'kota', 'rute', 'armada', 'driver', 'jadwal', 'booking', 'pembayaran', 'checkin', 'laporan', 'users', 'template-kursi', 'qris', 'sosmed'].includes(activeMenu) && (
            <div className="bg-white rounded-3xl shadow-soft p-12 text-center border border-slate-100">
              <div className="text-6xl mb-4">🚧</div>
              <h2 className="text-2xl font-bold text-deep-navy mb-2">{t('dashboard.comingSoon')}</h2>
              <p className="text-slate-gray">{t('dashboard.featureInDevelopment')}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
