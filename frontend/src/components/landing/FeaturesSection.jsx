import React from 'react';
import { Bus, Ticket, MapPin, ShieldCheck, Clock, CreditCard, Sparkles, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const FeaturesSection = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: Ticket,
      title: t('landing.features.f1Title', 'Pilih Kursi Online'),
      subtitle: t('landing.features.f1Sub', 'Bebas tentukan posisi duduk favorit'),
      desc: t('landing.features.f1Desc', 'Lihat denah kursi secara real-time dan pilih nomor kursi yang Anda inginkan saat reservasi.'),
      color: 'bg-travel-blue/10 text-travel-blue border-travel-blue/20',
      accentColor: 'group-hover:border-travel-blue',
    },
    {
      icon: ShieldCheck,
      title: t('landing.features.f2Title', 'E-Tiket & QR Boarding Pass'),
      subtitle: t('landing.features.f2Sub', 'Boarding super cepat tanpa cetak fisik'),
      desc: t('landing.features.f2Desc', 'Dapatkan E-Tiket otomatis berisikan QR Code yang dapat dipindai petugas Pool dalam hitungan detik.'),
      color: 'bg-tropical-teal/10 text-tropical-teal border-tropical-teal/20',
      accentColor: 'group-hover:border-tropical-teal',
    },
    {
      icon: MapPin,
      title: t('landing.features.f3Title', 'Pool to Pool & Flexi Shuttle'),
      subtitle: t('landing.features.f3Sub', 'Titik keberangkatan pusat kota terdekat'),
      desc: t('landing.features.f3Desc', 'Pilih titik keberangkatan dari Pool pusat kota terdekat di Jakarta, Bandung, Cirebon, Semarang, Surabaya.'),
      color: 'bg-sunset-orange/10 text-sunset-orange border-sunset-orange/20',
      accentColor: 'group-hover:border-sunset-orange',
    },
    {
      icon: Bus,
      title: t('landing.features.f4Title', 'Armada Eksekutif Terbaru'),
      subtitle: t('landing.features.f4Sub', 'Toyota HiAce Premio & Isuzu Elf VIP'),
      desc: t('landing.features.f4Desc', 'Seluruh armada dilengkapi AC Double Blower, Reclining Leather Seats, USB Fast Charging Port, dan Bagasi Luas.'),
      color: 'bg-travel-blue/10 text-travel-blue border-travel-blue/20',
      accentColor: 'group-hover:border-travel-blue',
    },
    {
      icon: Clock,
      title: t('landing.features.f5Title', 'Jaminan Tepat Waktu'),
      subtitle: t('landing.features.f5Sub', 'Rute Bebas Hambatan Jalan Tol'),
      desc: t('landing.features.f5Desc', 'Keberangkatan terjadwal tepat waktu via rute tol utama Trans-Jawa & Cipularang dengan driver profesional.'),
      color: 'bg-tropical-teal/10 text-tropical-teal border-tropical-teal/20',
      accentColor: 'group-hover:border-tropical-teal',
    },
    {
      icon: CreditCard,
      title: t('landing.features.f6Title', 'Bayar Digital Instan'),
      subtitle: t('landing.features.f6Sub', 'Dukungan QRIS, VA, & E-Wallet'),
      desc: t('landing.features.f6Desc', 'Proses pembayaran langsung terverifikasi otomatis dengan pilihan QRIS, Virtual Account, dan Transfer Bank.'),
      color: 'bg-sunset-orange/10 text-sunset-orange border-sunset-orange/20',
      accentColor: 'group-hover:border-sunset-orange',
    },
  ];

  return (
    <section id="features" className="py-24 bg-white relative overflow-hidden text-left">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-travel-blue/5 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-tropical-teal/5 blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-travel-blue/10 text-travel-blue text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-4 h-4" />
            <span>{t('landing.features.badge', 'Keunggulan Layanan Travel')}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-deep-navy tracking-tight">
            {t('landing.features.title', 'Mengapa Memilih TravelExpress Antar Kota?')}
          </h2>
          <p className="text-slate-gray mt-4 text-base sm:text-lg">
            {t('landing.features.subtitle', 'Kami menghadirkan pengalaman perjalanan darat berstandar tinggi dengan mengutamakan aspek keamanan, kenyamanan, dan efisiensi waktu.')}
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className={`group p-8 rounded-3xl bg-soft-sky border border-slate-200/80 hover:bg-white hover:shadow-card transition-all duration-300 flex flex-col justify-between relative ${feat.accentColor}`}
              >
                <div>
                  {/* Top Icon */}
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${feat.color} shadow-sm group-hover:scale-110 transition-transform`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className="text-xs font-extrabold text-slate-300 tracking-wider">
                      0{index + 1}
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <h3 className="text-2xl font-bold text-deep-navy tracking-tight mb-1">
                    {feat.title}
                  </h3>
                  <h4 className="text-sm font-semibold text-travel-blue mb-3">
                    {feat.subtitle}
                  </h4>

                  {/* Description */}
                  <p className="text-slate-gray text-sm leading-relaxed font-normal">
                    {feat.desc}
                  </p>
                </div>

                {/* Bottom Badge */}
                <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center gap-2 text-xs font-semibold text-deep-navy opacity-80 group-hover:opacity-100">
                  <CheckCircle2 className="w-4 h-4 text-tropical-teal" />
                  <span>Fitur Resmi TravelExpress</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
