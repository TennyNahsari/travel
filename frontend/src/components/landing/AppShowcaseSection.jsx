import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Smartphone, Bus, Compass, Ticket, QrCode, ShieldCheck, CheckCircle2 } from 'lucide-react';

const appScreens = [
  {
    id: 'search',
    title: '01. Pencarian Rute & Kota Asal-Tujuan',
    desc: 'Cari jadwal keberangkatan travel dari pool kota terdekat Anda dengan tampilan harga yang transparan tanpa biaya tersembunyi.',
    badge: 'Pencarian Tiket',
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
    stats: '50+ Rute Antar Kota',
  },
  {
    id: 'schedules',
    title: '02. Pemilihan Jam Keberangkatan',
    desc: 'Bandingkan jam keberangkatan dari pagi hingga malam hari lengkap dengan sisa kuota kursi yang tersedia secara real-time.',
    badge: 'Jadwal Shuttle',
    image: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=600&q=80',
    stats: 'Update Kuota Live',
  },
  {
    id: 'seats',
    title: '03. Denah Kursi Interaktif',
    desc: 'Pilih nomor kursi kesukaan Anda pada denah digital armada HiAce Premio atau Mercedes Sprinter secara presisi.',
    badge: 'Pilih Kursi',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=600&q=80',
    stats: 'Captain Seat Available',
  },
  {
    id: 'payment',
    title: '04. Pembayaran Digital Instan',
    desc: 'Lakukan pembayaran serba otomatis menggunakan QRIS, Virtual Account BCA/Mandiri, atau E-Wallet tanpa perlu kirim bukti struk.',
    badge: 'Bayar Instan',
    image: 'https://images.unsplash.com/photo-1556742049-0a670fc80789?auto=format&fit=crop&w=600&q=80',
    stats: 'Verifikasi < 5 Detik',
  },
  {
    id: 'ticket',
    title: '05. E-Tiket & Boarding Pass QR',
    desc: 'Terbitkan E-Tiket resmi berisikan QR Code untuk pemindaian kilat saat check-in di Pool keberangkatan.',
    badge: 'E-Tiket & QR',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    stats: 'Tanpa Cetak Fisik',
  },
  {
    id: 'tracking',
    title: '06. Live Fleet Tracking',
    desc: 'Pantau estimasi waktu kedatangan armada dan titik penjemputan sopir secara langsung pada peta aplikasi.',
    badge: 'Live Tracking',
    image: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=600&q=80',
    stats: 'GPS Live Location',
  },
];

const AppShowcaseSection = () => {
  const [activeIdx, setActiveIdx] = useState(0);

  const prevScreen = () => {
    setActiveIdx((prev) => (prev === 0 ? appScreens.length - 1 : prev - 1));
  };

  const nextScreen = () => {
    setActiveIdx((prev) => (prev === appScreens.length - 1 ? 0 : prev + 1));
  };

  const activeScreen = appScreens[activeIdx];

  return (
    <section id="showcase" className="py-24 bg-deep-navy text-white relative overflow-hidden text-left">
      {/* Background Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-travel-blue/20 via-tropical-teal/20 to-sunset-orange/10 blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-tropical-teal text-xs font-bold uppercase tracking-wider mb-3">
            <Smartphone className="w-4 h-4 text-tropical-teal" />
            <span>Showcase Antarmuka Aplikasi</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Kemudahan Booking dalam Genggaman
          </h2>
          <p className="text-slate-300 mt-4 text-base sm:text-lg">
            Aplikasi TravelExpress menyajikan seluruh proses pemesanan tiket travel antar kota dalam desain yang ringkas, modern, dan sangat responsif.
          </p>
        </div>

        {/* Screen Switcher Tabs */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-10">
          {appScreens.map((screen, idx) => (
            <button
              key={screen.id}
              onClick={() => setActiveIdx(idx)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                activeIdx === idx
                  ? 'bg-travel-blue text-white shadow-lg shadow-travel-blue/40 scale-105'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              {screen.badge}
            </button>
          ))}
        </div>

        {/* Horizontal Phone Carousel Showcase */}
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 lg:gap-12 my-8">
          
          {/* Controls - Left Arrow */}
          <button
            onClick={prevScreen}
            className="hidden md:flex w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center backdrop-blur-md transition-colors border border-white/20"
            aria-label="Previous screen"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Center Phone Frame */}
          <div className="relative w-full max-w-[320px] sm:max-w-[340px] bg-slate-900 rounded-[44px] p-3 shadow-2xl border border-white/20">
            {/* Notch */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-950 rounded-full z-20" />

            {/* Screen Content */}
            <div className="bg-soft-sky rounded-[36px] overflow-hidden text-deep-navy text-left relative min-h-[500px]">
              
              {/* App Screen Header */}
              <div className="pt-8 pb-3 px-4 bg-white border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-extrabold text-travel-blue uppercase tracking-wider">
                  {activeScreen.badge}
                </span>
                <span className="text-[10px] bg-tropical-teal/10 text-tropical-teal px-2 py-0.5 rounded-full font-bold">
                  {activeScreen.stats}
                </span>
              </div>

              {/* Main Image View */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={activeScreen.image}
                  alt={activeScreen.title}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-deep-navy/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 text-white">
                  <p className="text-xs font-bold uppercase text-tropical-teal">Tampilan UI Aplikasi</p>
                  <p className="text-sm font-extrabold">{activeScreen.title}</p>
                </div>
              </div>

              {/* Screen Description Card */}
              <div className="p-4 space-y-3">
                <div className="bg-white p-3.5 rounded-2xl shadow-soft border border-slate-100">
                  <h4 className="text-xs font-bold text-deep-navy mb-1">Sorotan Fitur</h4>
                  <p className="text-xs text-slate-gray leading-relaxed">
                    {activeScreen.desc}
                  </p>
                </div>

                <div className="bg-white p-3 rounded-2xl shadow-soft border border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-deep-navy flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-tropical-teal" />
                    Proses Real-Time Cepat
                  </span>
                  <span className="text-[10px] font-bold text-travel-blue bg-travel-blue/10 px-2 py-0.5 rounded">
                    Aktif
                  </span>
                </div>
              </div>

              {/* Bottom Nav Bar */}
              <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-2.5 flex justify-around text-slate-400">
                <Bus className={`w-4 h-4 ${activeIdx === 0 || activeIdx === 1 ? 'text-travel-blue' : ''}`} />
                <Ticket className={`w-4 h-4 ${activeIdx === 2 || activeIdx === 4 ? 'text-travel-blue' : ''}`} />
                <QrCode className={`w-4 h-4 ${activeIdx === 3 ? 'text-travel-blue' : ''}`} />
                <Compass className={`w-4 h-4 ${activeIdx === 5 ? 'text-travel-blue' : ''}`} />
              </div>

            </div>
          </div>

          {/* Active Screen Info Text Column */}
          <div className="flex-1 max-w-md text-center md:text-left space-y-4">
            <span className="text-xs font-extrabold text-sunset-orange tracking-widest uppercase">
              Layar {activeIdx + 1} dari {appScreens.length}
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {activeScreen.title}
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              {activeScreen.desc}
            </p>

            <div className="pt-4 flex items-center justify-center md:justify-start gap-4">
              <button
                onClick={prevScreen}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold border border-white/20 transition-colors"
              >
                ← Layar Sebelumnya
              </button>
              <button
                onClick={nextScreen}
                className="px-5 py-2 bg-travel-blue hover:bg-travel-blue-hover text-white rounded-xl text-xs font-bold shadow-md transition-colors"
              >
                Layar Selanjutnya →
              </button>
            </div>
          </div>

          {/* Controls - Right Arrow */}
          <button
            onClick={nextScreen}
            className="hidden md:flex w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center backdrop-blur-md transition-colors border border-white/20"
            aria-label="Next screen"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

        </div>

      </div>
    </section>
  );
};

export default AppShowcaseSection;
