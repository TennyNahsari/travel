import React, { useState } from 'react';
import { Search, MapPin, Calendar, Bus, ArrowRight, Sparkles, ShieldCheck, Ticket, CheckCircle2, QrCode, Clock, Navigation } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const HeroSection = ({ onOpenBookingModal }) => {
  const { t } = useTranslation();
  const [origin, setOrigin] = useState('Jakarta');
  const [destination, setDestination] = useState('Bandung');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [passengers, setPassengers] = useState('1 Penumpang');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onOpenBookingModal(origin, destination);
  };

  return (
    <section id="home" className="relative pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden bg-gradient-to-b from-soft-sky via-white to-soft-sky">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-travel-blue/10 via-tropical-teal/10 to-sunset-orange/5 blur-3xl -z-10 rounded-full pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-80 h-80 bg-tropical-teal/10 blur-3xl -z-10 rounded-full pointer-events-none animate-float-slow" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Hero Text & Interactive Ticket Search Widget */}
          <div className="lg:col-span-7 flex flex-col space-y-6 text-left">
            
            {/* Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-travel-blue/10 border border-travel-blue/20 text-travel-blue text-xs sm:text-sm font-bold tracking-wide uppercase w-fit">
              <Bus className="w-4 h-4 text-sunset-orange" />
              <span>{t('landing.hero.badge', 'Transportasi Darat Antar Kota Terpercaya')}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-deep-navy tracking-tight leading-[1.15]">
              {t('landing.hero.title1', 'Pesan Tiket Travel')}{' '}
              <span className="bg-gradient-to-r from-travel-blue via-tropical-teal to-sunset-orange bg-clip-text text-transparent">
                {t('landing.hero.titleHighlight', 'Antar Kota')}
              </span>{' '}
              {t('landing.hero.title2', 'Lebih Cepat.')}
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-gray leading-relaxed max-w-2xl font-normal">
              {t('landing.hero.subtitle', 'Nikmati perjalanan aman & nyaman dengan armada Executive Shuttle, rute bebas hambatan jalan tol, jaminan tepat waktu, serta kemudahan pilih kursi online.')}
            </p>

            {/* Action CTA */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="#routes"
                className="flex items-center gap-2 px-6 py-3.5 bg-travel-blue text-white hover:bg-travel-blue-hover font-bold rounded-xl shadow-md shadow-travel-blue/20 transition-all text-sm"
              >
                <span>Lihat Rute Populer</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Trust Badges */}
            <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-gray font-semibold">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-tropical-teal" />
                Bebas Pilih Nomor Kursi
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-travel-blue" />
                E-Tiket & QR Code Boarding
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-sunset-orange" />
                Jaminan Keberangkatan Tepat Waktu
              </span>
            </div>

          </div>

          {/* Right Column: Mobile App Preview Mockup showing Intercity Shuttle E-Ticket */}
          <div className="lg:col-span-5 relative flex justify-center items-center">
            
            {/* Background Glow */}
            <div className="absolute w-72 h-72 sm:w-96 sm:h-96 bg-gradient-to-tr from-travel-blue/30 via-tropical-teal/30 to-sunset-orange/20 rounded-full blur-2xl -z-10 animate-pulse" />

            {/* Floating Badge 1: Confirmed Shuttle Booking */}
            <div className="absolute -top-4 -left-4 sm:left-0 z-20 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-floating border border-white/60 flex items-center gap-3 animate-float">
              <div className="w-10 h-10 rounded-xl bg-tropical-teal/15 flex items-center justify-center text-tropical-teal">
                <Bus className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-deep-navy">Tiket Terkonfirmasi</p>
                <p className="text-[11px] text-slate-gray">HiAce Premio • Kursi 1A & 1B</p>
              </div>
            </div>

            {/* Floating Badge 2: QR Boarding Pass Preview */}
            <div className="absolute -bottom-4 -right-4 sm:right-0 z-20 bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-floating border border-white/60 flex items-center gap-3 animate-float-slow">
              <div className="w-10 h-10 rounded-xl bg-travel-blue/15 flex items-center justify-center text-travel-blue">
                <QrCode className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-deep-navy">Scan QR at Pool</p>
                <p className="text-[11px] text-tropical-teal font-semibold">Boarding Cepat 10 Detik</p>
              </div>
            </div>

            {/* Smartphone Frame */}
            <div className="relative w-full max-w-[310px] sm:max-w-[340px] bg-deep-navy rounded-[44px] p-3 shadow-2xl ring-1 ring-slate-900/10">
              
              {/* Phone Notch */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-900 rounded-full z-30 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-slate-800 mr-2" />
                <div className="w-2 h-2 rounded-full bg-slate-700" />
              </div>

              {/* Phone Screen App Container */}
              <div className="bg-soft-sky rounded-[36px] overflow-hidden border border-slate-200 text-deep-navy relative text-left">
                
                {/* App Screen Header */}
                <div className="pt-8 pb-3 px-4 bg-deep-navy text-white flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-tropical-teal uppercase tracking-wider">E-Tiket Travel</span>
                    <h4 className="text-sm font-extrabold flex items-center gap-1">
                      🚍 Jakarta → Bandung
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-travel-blue text-[9px] font-bold uppercase">PAID</span>
                </div>

                {/* E-Ticket Summary Card */}
                <div className="p-3 space-y-3">
                  <div className="bg-white rounded-2xl p-3.5 shadow-soft border border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                      <span className="font-extrabold text-deep-navy">Kode Booking</span>
                      <span className="font-extrabold text-travel-blue">TRV-88219</span>
                    </div>

                    {/* Departure Info */}
                    <div className="flex items-start justify-between text-xs pt-1">
                      <div>
                        <p className="text-[10px] text-slate-gray font-semibold">Keberangkatan</p>
                        <p className="font-bold text-deep-navy text-sm">07:00 WIB</p>
                        <p className="text-[10px] text-slate-gray">Pool Semanggi Jakarta</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-gray font-semibold">Tujuan</p>
                        <p className="font-bold text-deep-navy text-sm">09:30 WIB</p>
                        <p className="text-[10px] text-slate-gray">Pool Pasteur Bandung</p>
                      </div>
                    </div>

                    {/* Fleet & Seats */}
                    <div className="bg-soft-sky p-2.5 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <p className="text-[10px] text-slate-gray font-semibold">Armada Shuttle</p>
                        <p className="font-bold text-deep-navy">HiAce Premio Excl.</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-gray font-semibold">Nomor Kursi</p>
                        <p className="font-extrabold text-tropical-teal">Kursi 1A & 1B</p>
                      </div>
                    </div>

                    {/* QR Code Boarding Box */}
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
                      <div className="w-14 h-14 bg-slate-900 rounded-xl p-1 shrink-0 flex items-center justify-center">
                        <QrCode className="w-full h-full text-white" />
                      </div>
                      <div>
                        <p className="text-[11px] font-extrabold text-deep-navy">Digital Boarding Pass</p>
                        <p className="text-[10px] text-slate-gray">Tunjukkan QR saat tiba di Pool untuk verifikasi.</p>
                      </div>
                    </div>
                  </div>

                  {/* Driver & Vehicle Live Status */}
                  <div className="bg-white p-3 rounded-2xl shadow-soft border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-7 h-7 rounded-full bg-travel-blue/10 text-travel-blue flex items-center justify-center font-bold text-[10px]">
                        👨‍✈️
                      </div>
                      <div>
                        <p className="font-bold text-deep-navy text-[11px]">Sopir: Pak Bambang</p>
                        <p className="text-[10px] text-slate-gray">Plat: B 7482 SFA</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[9px]">
                      On Time
                    </span>
                  </div>
                </div>

                {/* Bottom Status Bar */}
                <div className="bg-white border-t border-slate-100 px-4 py-2.5 flex items-center justify-between text-xs text-slate-400">
                  <span className="text-travel-blue font-bold text-[10px]">● Live Shuttle Tracking</span>
                  <span className="text-[10px]">TravelApp Mobile</span>
                </div>

              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
