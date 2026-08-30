import React, { useState, useEffect } from 'react';
import { Bus, Menu, X, Ticket, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../LanguageSwitcher';

const Navbar = ({ onOpenBookingModal, onOpenPaymentConfirmationModal }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: t('landing.nav.home', 'Home'), href: '#home' },
    { name: t('landing.nav.routes', 'Rute Populer'), href: '#routes' },
    { name: t('landing.nav.features', 'Keunggulan'), href: '#features' },
    { name: t('landing.nav.fleet', 'Armada'), href: '#showcase' },
    { name: t('landing.nav.testimonials', 'Testimoni'), href: '#testimonials' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-soft py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo Brand */}
          <a href="#home" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-travel-blue to-tropical-teal flex items-center justify-center text-white shadow-md shadow-travel-blue/20 group-hover:scale-105 transition-transform">
              <Bus className="w-6 h-6" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xl font-extrabold tracking-tight text-deep-navy">
                Travel<span className="text-travel-blue">Express</span>
              </span>
              <span className="text-[10px] font-bold text-tropical-teal tracking-wider uppercase -mt-1">
                Shuttle Antar Kota
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="px-3.5 py-2 text-sm font-semibold text-slate-gray hover:text-travel-blue rounded-lg hover:bg-travel-blue/5 transition-colors"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            <button
              onClick={() => onOpenPaymentConfirmationModal && onOpenPaymentConfirmationModal()}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-travel-blue border border-travel-blue/30 hover:border-travel-blue bg-travel-blue/5 hover:bg-travel-blue/10 rounded-xl transition-all"
            >
              <CreditCard className="w-4 h-4" />
              <span>{t('landing.nav.checkPayment', 'Cek Pembayaran')}</span>
            </button>
            <button
              onClick={() => onOpenBookingModal()}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-travel-blue hover:bg-travel-blue-hover rounded-xl shadow-md shadow-travel-blue/25 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              <Ticket className="w-4 h-4 text-sunset-orange" />
              <span>{t('landing.nav.bookNow', 'Pesan Tiket Online')}</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center gap-2">
            <LanguageSwitcher />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-deep-navy hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-100 px-4 pt-3 pb-6 shadow-xl animate-in slide-in-from-top-2 duration-200 text-left">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2.5 text-base font-semibold text-deep-navy hover:text-travel-blue hover:bg-soft-sky rounded-xl transition-colors"
              >
                {link.name}
              </a>
            ))}
            <hr className="my-2 border-slate-100" />
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenPaymentConfirmationModal && onOpenPaymentConfirmationModal();
              }}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-bold text-travel-blue border border-travel-blue/30 bg-travel-blue/5 hover:bg-travel-blue/10 rounded-xl transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              <span>{t('landing.nav.checkPayment', 'Cek Pembayaran')}</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBookingModal && onOpenBookingModal();
              }}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 text-base font-bold text-white bg-travel-blue hover:bg-travel-blue-hover rounded-xl shadow-md transition-colors"
            >
              <Ticket className="w-5 h-5 text-sunset-orange" />
              <span>{t('landing.nav.bookNow', 'Pesan Tiket Online')}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
