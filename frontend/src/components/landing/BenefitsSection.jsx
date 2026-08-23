import React from 'react';
import { Clock, Ticket, ShieldCheck, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const BenefitsSection = () => {
  const { t } = useTranslation();

  const benefits = [
    {
      icon: Clock,
      title: t('landing.benefits.b1Title', 'Keberangkatan Pasti Tepat Waktu'),
      desc: t('landing.benefits.b1Desc', 'Armada berangkat sesuai jam jadwal resmi tanpa menunggu kursi terisi penuh. Rute jalan tol utama menjamin estimasi perjalanan yang presisi.'),
      highlight: t('landing.benefits.b1High', 'Garansi Keberangkatan Terjadwal'),
      color: 'from-travel-blue to-blue-600',
    },
    {
      icon: Ticket,
      title: t('landing.benefits.b2Title', 'Kepastian Nomor Kursi Online'),
      desc: t('landing.benefits.b2Desc', 'Pilih nomor kursi favorit Anda secara transparan melalui aplikasi sebelum bayar. Tidak ada istilah rebutan tempat duduk saat tiba di Pool.'),
      highlight: t('landing.benefits.b2High', '100% Seat Guaranteed'),
      color: 'from-tropical-teal to-teal-600',
    },
    {
      icon: ShieldCheck,
      title: t('landing.benefits.b3Title', 'Keamanan & Kenyamanan Terjamin'),
      desc: t('landing.benefits.b3Desc', 'Semua unit kendaraan melalui inspeksi berkala, pengemudi berlisensi resmi, serta dukungan layanan bantuan darurat 24 jam nonstop.'),
      highlight: t('landing.benefits.b3High', 'Asuransi Perjalanan Resmi'),
      color: 'from-sunset-orange to-orange-600',
    },
  ];

  return (
    <section className="py-24 bg-white relative overflow-hidden text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-tropical-teal/10 text-tropical-teal text-xs font-bold uppercase tracking-wider mb-3">
            <span>{t('landing.benefits.badge', 'Jaminan Layanan Kredibel')}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-deep-navy tracking-tight">
            {t('landing.benefits.title', 'Komitmen Garansi Perjalanan Anda')}
          </h2>
          <p className="text-slate-gray mt-4 text-base sm:text-lg">
            {t('landing.benefits.subtitle', 'Standar operasional ketat untuk menghadirkan ketenangan pikiran bagi setiap penumpang.')}
          </p>
        </div>

        {/* 3 Columns Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {benefits.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="group p-8 rounded-3xl bg-soft-sky border border-slate-100 hover:bg-white hover:shadow-card transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${item.color} text-white flex items-center justify-center shadow-md mb-6 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7" />
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-bold text-deep-navy tracking-tight mb-2">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="text-slate-gray text-sm leading-relaxed mb-6">
                    {item.desc}
                  </p>
                </div>

                {/* Highlight Badge */}
                <div className="pt-4 border-t border-slate-200/60 flex items-center gap-2 text-xs font-bold text-travel-blue">
                  <CheckCircle className="w-4 h-4 text-tropical-teal" />
                  <span>{item.highlight}</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default BenefitsSection;
