import React, { useState } from 'react';
import { BookOpen, Clock, ArrowRight, X, ThumbsUp, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const TravelInspiration = () => {
  const { t } = useTranslation();
  const [selectedGuide, setSelectedGuide] = useState(null);

  const guides = [
    {
      id: 1,
      title: t('landing.inspiration.g1Title', 'Panduan Titik Penjemputan Pool Travel di Jakarta & Bandung'),
      category: t('landing.inspiration.g1Cat', 'Panduan Pool'),
      readTime: '4 min read',
      image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
      summary: t('landing.inspiration.g1Sum', 'Daftar lokasi Pool resmi TravelExpress di Semanggi, Lebak Bulus, Pasteur, dan Dipatiukur lengkap dengan akses parkir dan ruang tunggu VIP.'),
      author: 'Tim Layanan Pelanggan',
      fullContent: 'Setiap Pool TravelExpress dilengkapi dengan ruang tunggu ber-AC, koneksi WiFi gratis, toilet bersih, serta mushola. Harap datang 15 menit sebelum jam keberangkatan untuk proses scan QR Code pada e-tiket Anda.',
    },
    {
      id: 2,
      title: t('landing.inspiration.g2Title', '5 Tips Perjalanan Bebas Pegal Menggunakan Shuttle Antar Kota'),
      category: t('landing.inspiration.g2Cat', 'Tips Perjalanan'),
      readTime: '3 min read',
      image: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80',
      summary: t('landing.inspiration.g2Sum', 'Cara memanfaatkan fitur Reclining Seat, posisi duduk optimal, serta mempersiapkan hiburan perjalanan di atas jalan tol.'),
      author: 'Kapten Driver Profesional',
      fullContent: 'Memilih posisi duduk di baris tengah atau depan (Captain Seat) memberikan peredaman guncangan terbaik saat melaju di jalan tol. Manfaatkan port USB charging di dekat tempat duduk Anda untuk menjaga daya ponsel tetap terisi.',
    },
    {
      id: 3,
      title: t('landing.inspiration.g3Title', 'Ketentuan Bagasi & Prosedur Boarding QR Code di Pool'),
      category: t('landing.inspiration.g3Cat', 'Informasi Resmi'),
      readTime: '5 min read',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      summary: t('landing.inspiration.g3Sum', 'Informasi mengenai jatah bagasi maksimal per penumpang serta langkah mudah check-in 10 detik dengan QR Code.'),
      author: 'Manajemen Operasional',
      fullContent: 'Setiap penumpang mendapatkan jatah bagasi gratis hingga 15 kg. Cukup tunjukkan QR Code pada aplikasi TravelExpress kepada staf boarding di pintu masuk Pool tanpa perlu mencetak tiket fisik.',
    },
  ];

  return (
    <section id="inspiration" className="py-24 bg-soft-sky relative text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-travel-blue/10 text-travel-blue text-xs font-bold uppercase tracking-wider mb-3">
              <BookOpen className="w-4 h-4" />
              <span>{t('landing.inspiration.badge', 'Pusat Informasi & Tips Shuttle')}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-deep-navy tracking-tight">
              {t('landing.inspiration.title', 'Tips Perjalanan & Informasi Rute')}
            </h2>
            <p className="text-slate-gray mt-3 text-base max-w-xl">
              {t('landing.inspiration.subtitle', 'Panduan lengkap perjalanan antar kota agar liburan dan perjalanan bisnis Anda semakin efisien dan menyenangkan.')}
            </p>
          </div>

          <button
            onClick={() => setSelectedGuide(guides[0])}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-travel-blue border border-slate-200 hover:border-travel-blue font-bold rounded-xl shadow-sm transition-all self-start md:self-auto text-sm"
          >
            <span>Baca Seluruh Panduan</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Guides Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {guides.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedGuide(item)}
              className="group bg-white rounded-3xl overflow-hidden shadow-soft hover:shadow-card border border-slate-100 transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Image */}
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-deep-navy">
                    {item.category}
                  </div>
                  <div className="absolute bottom-3 right-3 bg-deep-navy/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-white text-[11px] font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3 text-tropical-teal" />
                    <span>{item.readTime}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <span className="text-[11px] font-semibold text-slate-400">
                    {item.author}
                  </span>
                  <h3 className="text-lg font-bold text-deep-navy tracking-tight mt-1 group-hover:text-travel-blue transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-gray mt-3 leading-relaxed line-clamp-3">
                    {item.summary}
                  </p>
                </div>
              </div>

              {/* Bottom Link */}
              <div className="px-6 pb-6 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-travel-blue">
                <span>Baca Selengkapnya</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Guide Detail Modal */}
      {selectedGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-deep-navy/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col text-left">
            
            {/* Header Image */}
            <div className="relative h-64 shrink-0">
              <img
                src={selectedGuide.image}
                alt={selectedGuide.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-deep-navy/80 via-transparent to-transparent" />
              <button
                onClick={() => setSelectedGuide(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-deep-navy flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-6 right-6 text-white">
                <span className="px-2.5 py-1 rounded bg-tropical-teal text-xs font-bold uppercase tracking-wider">
                  {selectedGuide.category}
                </span>
                <h3 className="text-2xl font-extrabold mt-2 leading-tight">
                  {selectedGuide.title}
                </h3>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-gray font-medium pb-3 border-b border-slate-100">
                <span>{selectedGuide.author}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-travel-blue" />
                  {selectedGuide.readTime}
                </span>
              </div>

              <p className="text-sm font-bold text-deep-navy leading-relaxed">
                {selectedGuide.summary}
              </p>

              <p className="text-xs text-slate-gray leading-relaxed">
                {selectedGuide.fullContent}
              </p>

              <div className="pt-4 flex items-center justify-between">
                <button
                  onClick={() => setSelectedGuide(null)}
                  className="px-5 py-2.5 bg-travel-blue text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Selesai Membaca
                </button>
                <span className="text-xs font-bold text-tropical-teal flex items-center gap-1">
                  <ThumbsUp className="w-4 h-4" />
                  99% Pengunjung Sangat Terbantu
                </span>
              </div>
            </div>

          </div>
        </div>
      )}
    </section>
  );
};

export default TravelInspiration;
