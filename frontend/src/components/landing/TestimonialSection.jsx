import React from 'react';
import { Star, Quote, CheckCircle2, Users, MapPin, Bus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const TestimonialSection = () => {
  const { t } = useTranslation();

  const stats = [
    { label: t('landing.testimonials.statPassengers', 'Penumpang Terlayani'), value: '100K+', icon: Users, color: 'text-travel-blue' },
    { label: t('landing.testimonials.statRoutes', 'Rute Antar Kota'), value: '50+', icon: MapPin, color: 'text-tropical-teal' },
    { label: t('landing.testimonials.statTickets', 'Tiket Diterbitkan'), value: '50K+', icon: Bus, color: 'text-sunset-orange' },
  ];

  const testimonials = [
    {
      quote: t('landing.testimonials.t1Quote', 'Setiap minggu saya naik travel Jakarta-Bandung untuk kerjaan kantor. Aplikasi TravelExpress bikin booking tiket dan pilih kursi jadi praktis banget!'),
      name: 'Hendra Wijaya',
      role: t('landing.testimonials.t1Role', 'Penglaju Rutin'),
      location: 'Jakarta - Bandung',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      rating: 5,
    },
    {
      quote: t('landing.testimonials.t2Quote', 'Layanan HiAce Premio-nya nyaman banget, sopir mengemudi halus via tol Trans-Jawa, dan boarding di pool tinggal scan QR Code di HP tanpa ribet.'),
      name: 'Siti Rahmawati',
      role: t('landing.testimonials.t2Role', 'Mahasiswa'),
      location: 'Bandung - Yogyakarta',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
      rating: 5,
    },
    {
      quote: t('landing.testimonials.t3Quote', 'Sangat membantu buat perjalanan bisnis mendadak ke Semarang. Pilihan jam keberangkatannya banyak dan garansi tepat waktu.'),
      name: 'Deni Kurniawan',
      role: t('landing.testimonials.t3Role', 'Business Traveler'),
      location: 'Jakarta - Semarang',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      rating: 5,
    },
  ];

  return (
    <section id="testimonials" className="py-24 bg-soft-sky relative overflow-hidden text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Real Statistics Banner */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-card border border-slate-100 mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {stats.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="pt-6 md:pt-0 md:px-6 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-soft-sky flex items-center justify-center mb-3">
                    <Icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <h3 className="text-4xl sm:text-5xl font-extrabold text-deep-navy tracking-tight">
                    {item.value}
                  </h3>
                  <p className="text-sm font-semibold text-slate-gray mt-1">
                    {item.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-travel-blue/10 text-travel-blue text-xs font-bold uppercase tracking-wider mb-3">
            <Star className="w-4 h-4 fill-travel-blue text-travel-blue" />
            <span>{t('landing.testimonials.badge', 'Testimoni & Pengalaman Penumpang')}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-deep-navy tracking-tight">
            {t('landing.testimonials.title', 'Dipercaya Ribuan Penumpang Setiap Bulan')}
          </h2>
          <p className="text-slate-gray mt-4 text-base sm:text-lg">
            {t('landing.testimonials.subtitle', 'Kepuasan dan kenyamanan perjalanan Anda adalah prioritas utama operasional kami.')}
          </p>
        </div>

        {/* Testimonials Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((item) => (
            <div
              key={item.name}
              className="bg-white rounded-3xl p-8 shadow-soft border border-slate-100 flex flex-col justify-between relative group hover:shadow-card hover:-translate-y-1 transition-all duration-300"
            >
              <div>
                {/* Quote Icon & Rating */}
                <div className="flex items-center justify-between mb-4">
                  <Quote className="w-8 h-8 text-travel-blue/30" />
                  <div className="flex items-center gap-1">
                    {[...Array(item.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>

                {/* Quote Text */}
                <p className="text-deep-navy text-sm font-medium leading-relaxed italic mb-6">
                  "{item.quote}"
                </p>
              </div>

              {/* Author Info */}
              <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                <img
                  src={item.avatar}
                  alt={item.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-travel-blue/20"
                />
                <div>
                  <h4 className="text-sm font-bold text-deep-navy flex items-center gap-1">
                    {item.name}
                    <CheckCircle2 className="w-3.5 h-3.5 text-tropical-teal" />
                  </h4>
                  <p className="text-xs text-slate-gray">
                    {item.role} • Rute {item.location}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default TestimonialSection;
