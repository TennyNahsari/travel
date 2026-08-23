import React from 'react';
import { Bus, Heart, Globe, ArrowUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Footer = ({ onOpenBookingModal }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-deep-navy text-white pt-16 pb-12 border-t border-slate-800 text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Footer Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <a href="#home" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-travel-blue to-tropical-teal flex items-center justify-center text-white shadow-md">
                <Bus className="w-6 h-6" />
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-white">
                Travel<span className="text-travel-blue">Express</span>
              </span>
            </a>

            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              {t('landing.footer.aboutDesc', 'Penyedia jasa transportasi travel shuttle antar kota terdepan dengan layanan eksekutif, armada modern, dan sistem pemesanan tiket online paling mudah di Indonesia.')}
            </p>

            <div className="flex items-center gap-3 pt-2">
              <a href="#social" aria-label="Instagram" className="w-9 h-9 rounded-xl bg-white/10 hover:bg-travel-blue text-white flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="#social" aria-label="Website" className="w-9 h-9 rounded-xl bg-white/10 hover:bg-tropical-teal text-white flex items-center justify-center transition-colors">
                <Globe className="w-4 h-4" />
              </a>
              <a href="#social" aria-label="YouTube" className="w-9 h-9 rounded-xl bg-white/10 hover:bg-red-600 text-white flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 4-8 4z"/></svg>
              </a>
            </div>
          </div>

          {/* Column 1: Rute Populer */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Rute Populer
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><a href="#routes" className="hover:text-white transition-colors">Jakarta ↔ Bandung</a></li>
              <li><a href="#routes" className="hover:text-white transition-colors">Jakarta ↔ Semarang</a></li>
              <li><a href="#routes" className="hover:text-white transition-colors">Jakarta ↔ Yogyakarta</a></li>
              <li><a href="#routes" className="hover:text-white transition-colors">Bandung ↔ Yogyakarta</a></li>
              <li><a href="#routes" className="hover:text-white transition-colors">Surabaya ↔ Malang</a></li>
            </ul>
          </div>

          {/* Column 2: Layanan */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Layanan Shuttle
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><button onClick={() => onOpenBookingModal()} className="hover:text-white transition-colors text-left">Booking Tiket Online</button></li>
              <li><a href="#features" className="hover:text-white transition-colors">Pilih Nomor Kursi</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Pool to Pool Service</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Door to Door Pickups</a></li>
              <li><button onClick={() => navigate('/login')} className="hover:text-travel-blue transition-colors text-left">Dashboard Operator</button></li>
            </ul>
          </div>

          {/* Column 3: Bantuan & Syarat */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Bantuan
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><a href="#help" className="hover:text-white transition-colors">Cek Status Tiket</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">FAQ Pemesanan</a></li>
              <li><a href="#privacy" className="hover:text-white transition-colors">Kebijakan Bagasi</a></li>
              <li><a href="#terms" className="hover:text-white transition-colors">Syarat & Ketentuan</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors">Kontak Pool 24/7</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Footer */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} TravelExpress Inc. {t('landing.footer.rights', 'Seluruh Hak Cipta Dilindungi.')}</p>

          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1 text-slate-400">
              Solusi Transportasi Darat Terpercaya <Heart className="w-3.5 h-3.5 text-sunset-orange fill-sunset-orange inline" />
            </span>

            <button
              onClick={scrollToTop}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1"
              aria-label="Back to top"
            >
              <ArrowUp className="w-4 h-4" />
              <span>Ke Atas</span>
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
