import React, { useState } from 'react';
import { Search, Ticket, CreditCard, QrCode, Check, ArrowRight } from 'lucide-react';

const steps = [
  {
    number: '01',
    title: 'Cari Rute & Kota Tujuan',
    subtitle: 'Pilih kota asal, tujuan, dan tanggal perjalanan',
    desc: 'Tentukan titik Pool keberangkatan (e.g. Jakarta, Bandung, Semarang, Jogja) serta jam jadwal yang paling cocok dengan agenda Anda.',
    icon: Search,
    color: 'from-travel-blue to-blue-600',
    screenImage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
    screenBadge: '🔎 Step 1: Cari Rute Travel',
    mockDetails: {
      header: 'Rute Pilihan Anda',
      mainTitle: 'Jakarta ↔ Bandung',
      tag: 'Tol Cipularang • 2.5 Jam',
      items: ['Pilihan Jam 06:30, 09:30, 13:30', 'Pool Semanggi → Pasteur', 'HiAce Premio Executive'],
    },
  },
  {
    number: '02',
    title: 'Pilih Nomor Kursi Real-Time',
    subtitle: 'Tentukan posisi duduk Anda pada denah armada',
    desc: 'Buka denah interaktif armada dan pilih nomor kursi yang paling nyaman (Captain seat 1A, 2A, 2B, dll).',
    icon: Ticket,
    color: 'from-tropical-teal to-emerald-600',
    screenImage: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=600&q=80',
    screenBadge: '✨ Step 2: Denah Kursi Live',
    mockDetails: {
      header: 'Denah Kursi HiAce Premio',
      mainTitle: 'Pilih Kursi 1A & 1B',
      tag: '2 Kursi Terpilih',
      items: ['Kursi 1A (Window Seat)', 'Kursi 1B (Aisle)', 'Reclining Leather Seat'],
    },
  },
  {
    number: '03',
    title: 'Bayar Instan Digital',
    subtitle: 'Verifikasi otomatis tanpa perlu upload bukti transfer',
    desc: 'Gunakan QRIS (Gopay/OVO/Dana), Virtual Account BCA/Mandiri, atau Kartu Kredit dengan verifikasi langsung seketika.',
    icon: CreditCard,
    color: 'from-sunset-orange to-amber-600',
    screenImage: 'https://images.unsplash.com/photo-1556742049-0a670fc80789?auto=format&fit=crop&w=600&q=80',
    screenBadge: '💳 Step 3: Pembayaran Instan',
    mockDetails: {
      header: 'Metode Pembayaran',
      mainTitle: 'QRIS / BCA Virtual Account',
      tag: 'Verifikasi Otomatis < 5 Detik',
      items: ['Total: Rp 240.000 (2 Kursi)', 'QRIS Instant Scan & Pay', 'Bebas Biaya Admin'],
    },
  },
  {
    number: '04',
    title: 'Boarding & Scan QR Code',
    subtitle: 'Langsung menuju armada tanpa perlu antre di loket',
    desc: 'Tunjukkan QR Code E-Tiket pada smartphone Anda kepada petugas Pool saat tiba untuk proses boarding instan.',
    icon: QrCode,
    color: 'from-travel-blue via-tropical-teal to-sunset-orange',
    screenImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    screenBadge: '🚀 Step 4: Digital Boarding Pass',
    mockDetails: {
      header: 'Siap Berangkat',
      mainTitle: 'Kode Booking: TRV-88219',
      tag: 'Boarding Gate Pool Semanggi',
      items: ['Scan QR Pass di Loket Pool', 'Show Smart QR to Driver', 'Selamat Menikmati Perjalanan!'],
    },
  },
];

const HowItWorksSection = () => {
  const [activeStep, setActiveStep] = useState(0);
  const currentStep = steps[activeStep];

  return (
    <section id="how-it-works" className="py-24 bg-soft-sky relative overflow-hidden text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-tropical-teal/10 text-tropical-teal text-xs font-bold uppercase tracking-wider mb-3">
            <span>4 Langkah Mudah Pemesanan</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-deep-navy tracking-tight">
            Cara Pesan Tiket Travel Online
          </h2>
          <p className="text-slate-gray mt-4 text-base sm:text-lg">
            Hanya butuh waktu kurang dari 2 menit untuk memesan tiket travel antar kota dari perangkat ponsel Anda.
          </p>
        </div>

        {/* 2-Column Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Interactive Step Selector */}
          <div className="lg:col-span-7 space-y-4">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = activeStep === idx;
              return (
                <div
                  key={step.number}
                  onClick={() => setActiveStep(idx)}
                  className={`p-6 rounded-3xl cursor-pointer transition-all duration-300 border flex items-start gap-5 ${
                    isActive
                      ? 'bg-white shadow-card border-travel-blue/40 scale-[1.01]'
                      : 'bg-white/60 hover:bg-white border-slate-200/80 shadow-sm opacity-85 hover:opacity-100'
                  }`}
                >
                  {/* Step Icon */}
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-white shrink-0 bg-gradient-to-br ${step.color} shadow-md`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Step Description */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold tracking-wider text-travel-blue uppercase">
                        Langkah {step.number}
                      </span>
                      {isActive && (
                        <span className="px-2.5 py-0.5 rounded-full bg-tropical-teal/10 text-tropical-teal text-[11px] font-bold">
                          Layar Aktif
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-deep-navy tracking-tight mt-0.5">
                      {step.title}
                    </h3>
                    <p className="text-xs font-semibold text-slate-gray mt-0.5">
                      {step.subtitle}
                    </p>
                    <p className="text-xs text-slate-gray/90 mt-2 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Dynamic Phone App Preview */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-[320px] bg-deep-navy rounded-[40px] p-3 shadow-2xl ring-1 ring-slate-900/10">
              
              {/* Notch */}
              <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-3.5 bg-slate-900 rounded-full z-20" />

              {/* Dynamic Content Container */}
              <div className="bg-white rounded-[32px] overflow-hidden text-left border border-slate-200 shadow-inner">
                
                {/* Step Badge Banner */}
                <div className="pt-8 pb-3 px-4 bg-deep-navy text-white flex items-center justify-between">
                  <span className="text-xs font-bold tracking-wide">
                    {currentStep.screenBadge}
                  </span>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">
                    Step {currentStep.number}/04
                  </span>
                </div>

                {/* Hero Image */}
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={currentStep.screenImage}
                    alt={currentStep.title}
                    className="w-full h-full object-cover transition-all duration-700 transform scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-deep-navy/90 via-deep-navy/30 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <span className="px-2 py-0.5 rounded bg-tropical-teal text-[10px] font-bold">
                      {currentStep.mockDetails.tag}
                    </span>
                    <h4 className="text-lg font-bold mt-1">
                      {currentStep.mockDetails.mainTitle}
                    </h4>
                  </div>
                </div>

                {/* Simulated Content Box */}
                <div className="p-4 space-y-3 bg-soft-sky min-h-[200px]">
                  <p className="text-xs font-bold text-slate-gray uppercase tracking-wider">
                    {currentStep.mockDetails.header}
                  </p>
                  
                  <div className="space-y-2">
                    {currentStep.mockDetails.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-3 rounded-xl shadow-soft border border-slate-100 flex items-center justify-between"
                      >
                        <span className="text-xs font-bold text-deep-navy flex items-center gap-2">
                          <Check className="w-4 h-4 text-tropical-teal shrink-0" />
                          {item}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Status */}
                <div className="bg-white p-3 border-t border-slate-100 flex items-center justify-between text-xs text-center text-slate-400 font-medium">
                  <span className="text-travel-blue font-bold">● Simulasi Aplikasi Travel</span>
                </div>

              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default HowItWorksSection;
