import React from 'react';
import { Ticket, Sparkles, Smartphone, QrCode, ArrowRight, Bus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const DownloadCtaSection = ({ onOpenBookingModal, onOpenDownloadModal }) => {
  const { t } = useTranslation();

  return (
    <section className="py-20 relative overflow-hidden text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Gradient Banner Container */}
        <div className="relative rounded-3xl lg:rounded-[40px] bg-gradient-to-r from-travel-blue via-[#0B52D9] to-tropical-teal p-8 sm:p-12 lg:p-16 text-white shadow-2xl overflow-hidden">
          
          {/* Subtle Decorative Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-2xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-tropical-teal/30 rounded-full blur-2xl pointer-events-none -ml-20 -mb-20" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            
            {/* Left Column Text & Actions */}
            <div className="lg:col-span-8 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider">
                <Bus className="w-4 h-4 text-sunset-orange" />
                <span>{t('landing.cta.badge', 'Pesan Tiket Travel Online Kapan Saja')}</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                {t('landing.cta.title', 'Siap Memulai Perjalanan Antar Kota Anda?')}
              </h2>

              <p className="text-white/90 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 font-normal">
                {t('landing.cta.subtitle', 'Pesan tiket travel online dalam hitungan detik. Bebas antre, pilih kursi favorit, dan nikmati perjalanan menyenangkan.')}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  onClick={() => onOpenBookingModal()}
                  className="flex items-center gap-3 px-7 py-4 bg-white text-deep-navy hover:bg-soft-sky font-extrabold rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 text-sm"
                >
                  <Ticket className="w-5 h-5 text-travel-blue" />
                  <span>{t('landing.cta.btnBook', 'Pesan Tiket Sekarang')}</span>
                  <ArrowRight className="w-4 h-4 text-travel-blue" />
                </button>

                <button
                  onClick={onOpenDownloadModal}
                  className="flex items-center gap-3 px-6 py-4 bg-deep-navy text-white hover:bg-slate-900 font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 border border-white/20 text-sm"
                >
                  <Smartphone className="w-5 h-5 text-tropical-teal" />
                  <span>Unduh Mobile App</span>
                </button>
              </div>
            </div>

            {/* Right Side App Illustration */}
            <div className="lg:col-span-4 flex justify-center lg:justify-end">
              <div className="relative w-56 sm:w-64 bg-slate-900 rounded-[36px] p-2.5 shadow-2xl border border-white/20 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="bg-soft-sky rounded-[28px] overflow-hidden text-deep-navy p-4 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-travel-blue text-white flex items-center justify-center mx-auto shadow-md">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-extrabold text-deep-navy">E-Tiket Travel & Boarding</h4>
                  <p className="text-[11px] text-slate-gray">Direct Pool Scan & Seat Choice</p>
                  <div className="bg-white p-2 rounded-xl shadow-sm text-[10px] font-bold text-tropical-teal">
                    ✓ Garansi Keberangkatan Terjadwal
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

export default DownloadCtaSection;
