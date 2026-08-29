import React, { useState, useEffect } from 'react';
import { Bus, Heart, ArrowUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { socialService } from '../../services/api';

const Footer = ({ onOpenBookingModal }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [socialLinks, setSocialLinks] = useState({
    instagramUrl: 'https://instagram.com',
    twitterUrl: 'https://twitter.com',
    youtubeUrl: 'https://youtube.com',
    facebookUrl: 'https://facebook.com',
    linkedinUrl: 'https://linkedin.com',
    threadsUrl: 'https://threads.net'
  });

  useEffect(() => {
    fetchSocialLinks();
  }, []);

  const fetchSocialLinks = async () => {
    try {
      const res = await socialService.getSocialSettings();
      if (res.success && res.data) {
        setSocialLinks({
          instagramUrl: res.data.instagramUrl || 'https://instagram.com',
          twitterUrl: res.data.twitterUrl || 'https://twitter.com',
          youtubeUrl: res.data.youtubeUrl || 'https://youtube.com',
          facebookUrl: res.data.facebookUrl || 'https://facebook.com',
          linkedinUrl: res.data.linkedinUrl || 'https://linkedin.com',
          threadsUrl: res.data.threadsUrl || 'https://threads.net'
        });
      }
    } catch (err) {
      console.error('Error loading footer social media links:', err);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const socialItems = [
    {
      key: 'instagramUrl',
      label: 'Instagram',
      url: socialLinks.instagramUrl,
      hoverClass: 'hover:bg-gradient-to-tr hover:from-purple-600 hover:via-pink-500 hover:to-amber-500',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      )
    },
    {
      key: 'twitterUrl',
      label: 'Twitter / X',
      url: socialLinks.twitterUrl,
      hoverClass: 'hover:bg-sky-500 hover:text-white',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      )
    },
    {
      key: 'youtubeUrl',
      label: 'YouTube',
      url: socialLinks.youtubeUrl,
      hoverClass: 'hover:bg-red-600',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 4-8 4z"/>
        </svg>
      )
    },
    {
      key: 'facebookUrl',
      label: 'Facebook',
      url: socialLinks.facebookUrl,
      hoverClass: 'hover:bg-blue-600',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.5 5H18V0h-3.808C10.592 0 9 1.583 9 4.615V8z"/>
        </svg>
      )
    },
    {
      key: 'linkedinUrl',
      label: 'LinkedIn',
      url: socialLinks.linkedinUrl,
      hoverClass: 'hover:bg-sky-700',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
        </svg>
      )
    },
    {
      key: 'threadsUrl',
      label: 'Threads',
      url: socialLinks.threadsUrl,
      hoverClass: 'hover:bg-slate-900 hover:ring-1 hover:ring-slate-700',
      icon: (
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M12.186 24c-3.23 0-5.839-.997-7.755-2.965C2.518 19.07 1.5 16.084 1.5 12.14 1.5 8.196 2.52 5.21 4.434 3.243 6.35 1.275 8.958.278 12.186.278c3.228 0 5.836.997 7.752 2.965C21.854 5.21 22.87 8.196 22.87 12.14c0 1.251-.1 2.463-.3 3.636-.2.172-.44.258-.72.258-.24 0-.46-.086-.66-.258-.16-.138-.28-.31-.36-.516l-.28-1.032c-.92 1.24-2.12 2.14-3.6 2.7-.44.172-.94.258-1.5.258-2.04 0-3.67-.714-4.89-2.142-1.22-1.428-1.83-3.306-1.83-5.634 0-2.328.61-4.206 1.83-5.634 1.22-1.428 2.85-2.142 4.89-2.142 1.8 0 3.27.568 4.41 1.704 1.14 1.136 1.77 2.68 1.89 4.632h-2.1c-.12-1.408-.55-2.486-1.29-3.234-.74-.748-1.74-1.122-3.00-1.122-1.40 0-2.52.508-3.36 1.524-.84 1.016-1.26 2.404-1.26 4.164 0 1.76.42 3.148 1.26 4.164.84 1.016 1.96 1.524 3.36 1.524.96 0 1.8-.258 2.52-.774.72-.516 1.23-1.256 1.53-2.22h-4.05v-1.8h6.15v6.528c-.4.43-1.04.81-1.92 1.14-.88.33-1.87.495-2.97.495z"/>
        </svg>
      )
    }
  ];

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

            {/* Social Media Icons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              {socialItems.map((item) => {
                if (!item.url) return null;
                return (
                  <a
                    key={item.key}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.label}
                    title={item.label}
                    className={`w-9 h-9 rounded-xl bg-white/10 ${item.hoverClass} text-white flex items-center justify-center transition-all duration-200 shadow-sm transform hover:-translate-y-0.5`}
                  >
                    {item.icon}
                  </a>
                );
              })}
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
              <li><button onClick={() => onOpenBookingModal && onOpenBookingModal()} className="hover:text-white transition-colors text-left">Booking Tiket Online</button></li>
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
