import React, { useState, useEffect } from 'react';
import { Bus, ShieldCheck, Zap, Sparkles, CheckCircle2, Ticket, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

const fallbackImages = [
  'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
];

const PopularDestinations = ({ onOpenBookingModal }) => {
  const { t } = useTranslation();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await api.get('/vehicles');
      if (res.data?.data) {
        const activeVehicles = res.data.data.filter(v => v.status === 'ACTIVE');
        setVehicles(activeVehicles);
      }
    } catch (e) {
      console.error('Error fetching vehicles for landing page:', e);
    } finally {
      setLoading(false);
    }
  };

  const parseFacilities = (fac) => {
    if (Array.isArray(fac)) return fac;
    if (typeof fac === 'string') {
      try {
        const parsed = JSON.parse(fac);
        if (Array.isArray(parsed)) return parsed;
        if (typeof parsed === 'object') return Object.values(parsed);
      } catch (e) {
        return [fac];
      }
    }
    if (typeof fac === 'object' && fac !== null) return Object.values(fac);
    return ['Reclining Seat', 'Full AC', 'USB Fast Charger', 'Bagasi Luas'];
  };

  const totalPages = Math.ceil(vehicles.length / itemsPerPage) || 1;
  const paginatedVehicles = vehicles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <section id="showcase" className="py-24 bg-white relative overflow-hidden text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sunset-orange/10 text-sunset-orange text-xs font-bold uppercase tracking-wider mb-3">
            <Bus className="w-4 h-4" />
            <span>{t('landing.fleet.badge', 'Standar Kenyamanan Tinggi')}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-deep-navy tracking-tight">
            {t('landing.fleet.title', 'Armada Transportasi Eksekutif Modern')}
          </h2>
          <p className="text-slate-gray mt-4 text-base sm:text-lg">
            {t('landing.fleet.subtitle', 'Semua unit armada selalu dirawat secara berkala dan dibersihkan sebelum keberangkatan demi keamanan dan kenyamanan maksimal Anda.')}
          </p>
        </div>

        {/* Fleet Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-travel-blue"></div>
            <p className="text-slate-gray mt-2 text-sm">{t('common.loading')}</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-12 text-slate-gray">
            <p>{t('common.noData')}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {paginatedVehicles.map((vehicle, index) => {
                const globalIndex = (currentPage - 1) * itemsPerPage + index;
                const facilitiesList = parseFacilities(vehicle.facilities);
                const imageUrl = vehicle.imageUrl || fallbackImages[globalIndex % fallbackImages.length];

                return (
                  <div
                    key={vehicle.id}
                    className="group bg-soft-sky rounded-3xl overflow-hidden shadow-soft hover:shadow-card border border-slate-100 transition-all duration-500 flex flex-col justify-between"
                  >
                    <div>
                      {/* Image */}
                      <div className="relative h-48 overflow-hidden bg-slate-200">
                        <img
                          src={imageUrl}
                          alt={vehicle.vehicleType}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          onError={(e) => { e.target.src = fallbackImages[0]; }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-deep-navy/80 via-transparent to-transparent" />

                        <div className="absolute top-3 left-3 z-10">
                          <span className="px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[9px] font-extrabold text-deep-navy shadow-sm uppercase tracking-wider">
                            {vehicle.plateNumber}
                          </span>
                        </div>

                        <div className="absolute bottom-3 left-3 right-3 text-white">
                          <span className="text-[9px] font-bold text-tropical-teal uppercase tracking-wider block">
                            Kapasitas {vehicle.capacity} Kursi
                          </span>
                          <h3 className="text-base font-extrabold line-clamp-1">{vehicle.vehicleType}</h3>
                        </div>
                      </div>

                      {/* Body Details */}
                      <div className="p-4 space-y-3">
                        <p className="text-[11px] text-slate-gray leading-relaxed line-clamp-2">
                          {vehicle.description || 'Armada Shuttle Eksekutif berkualitas tinggi yang dirancang untuk perjalanan aman dan nyaman.'}
                        </p>

                        <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                          <p className="text-[10px] font-extrabold text-deep-navy uppercase tracking-wider">Fasilitas Utama:</p>
                          <div className="flex flex-wrap gap-1">
                            {facilitiesList.slice(0, 4).map((f, i) => (
                              <span key={i} className="text-[10px] font-semibold bg-white text-deep-navy border border-slate-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-tropical-teal shrink-0" />
                                <span className="line-clamp-1">{String(f)}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Horizontal Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-12">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-3 rounded-full border border-slate-200 bg-white text-deep-navy hover:bg-travel-blue hover:text-white disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-deep-navy transition-all shadow-sm"
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-xs font-bold text-slate-gray px-4 py-2 bg-soft-sky rounded-full border border-slate-200">
                  Halaman {currentPage} dari {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-3 rounded-full border border-slate-200 bg-white text-deep-navy hover:bg-travel-blue hover:text-white disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-deep-navy transition-all shadow-sm"
                  aria-label="Next Page"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}

      </div>
    </section>
  );
};

export default PopularDestinations;
