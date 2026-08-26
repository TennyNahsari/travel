import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { authService, qrisService } from '../services/api';
import Navbar from '../components/landing/Navbar';
import HeroSection from '../components/landing/HeroSection';
import DestinationDiscovery from '../components/landing/DestinationDiscovery';
import FeaturesSection from '../components/landing/FeaturesSection';
import PopularDestinations from '../components/landing/PopularDestinations';
import TravelInspiration from '../components/landing/TravelInspiration';
import BenefitsSection from '../components/landing/BenefitsSection';
import TestimonialSection from '../components/landing/TestimonialSection';
import DownloadCtaSection from '../components/landing/DownloadCtaSection';
import Footer from '../components/landing/Footer';
import DownloadModal from '../components/landing/DownloadModal';
import TicketBookingModal from '../components/landing/TicketBookingModal';
import PaymentConfirmationModal from '../components/landing/PaymentConfirmationModal';

const cleanWaNumber = (num) => {
  if (!num) return '6281234567890';
  let cleaned = num.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  }
  return cleaned || '6281234567890';
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isPaymentConfirmationModalOpen, setIsPaymentConfirmationModalOpen] = useState(false);
  const [bookingOrigin, setBookingOrigin] = useState('Jakarta (Pool Semanggi / Lebak Bulus)');
  const [bookingDestination, setBookingDestination] = useState('Bandung (Pool Pasteur / Dipatiukur)');
  const [selectedScheduleId, setSelectedScheduleId] = useState(null);
  const [waNumber, setWaNumber] = useState('6281234567890');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await qrisService.getQris();
        if (res.success && res.data && res.data.waNumber) {
          setWaNumber(res.data.waNumber);
        }
      } catch (e) {
        console.error('Failed to load WA setting:', e);
      }
    };
    fetchSettings();
  }, []);

  const handleOpenBookingModal = (originCity, destCity, scheduleId = null) => {
    if (originCity) setBookingOrigin(originCity);
    if (destCity) setBookingDestination(destCity);
    setSelectedScheduleId(scheduleId || null);
    setIsBookingModalOpen(true);
  };

  const targetWaNumber = cleanWaNumber(waNumber);
  const waLink = `https://wa.me/${targetWaNumber}?text=${encodeURIComponent('Halo Admin Travel, saya ingin bertanya mengenai pemesanan tiket shuttle.')}`;

  return (
    <div className="min-h-screen bg-soft-sky text-deep-navy font-sans selection:bg-travel-blue selection:text-white relative">
      {/* 01. Navigation */}
      <Navbar
        onOpenBookingModal={handleOpenBookingModal}
        onOpenPaymentConfirmationModal={() => setIsPaymentConfirmationModalOpen(true)}
        onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
      />

      {/* 02. Hero Section */}
      <HeroSection
        onOpenBookingModal={handleOpenBookingModal}
      />

      {/* 03. Rute Populer Antar Kota */}
      <DestinationDiscovery
        onOpenBookingModal={handleOpenBookingModal}
      />

      {/* 04. Keunggulan Layanan Travel */}
      <FeaturesSection />

      {/* 05. Showcase Armada Eksekutif */}
      <PopularDestinations
        onOpenBookingModal={handleOpenBookingModal}
      />

      {/* 08. Informasi & Panduan Shuttle */}
      <TravelInspiration />

      {/* 09. Komitmen & Garansi Perjalanan */}
      <BenefitsSection />

      {/* 10. Testimoni & Statistik Penumpang */}
      <TestimonialSection />

      {/* 11. CTA Pemesanan Tiket */}
      <DownloadCtaSection
        onOpenBookingModal={handleOpenBookingModal}
        onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
      />

      {/* 12. Footer */}
      <Footer
        onOpenBookingModal={handleOpenBookingModal}
      />

      {/* Floating WhatsApp Button */}
      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat WhatsApp CS"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-3 rounded-full shadow-2xl hover:scale-105 transition-all duration-300 group border-2 border-white/30"
      >
        <div className="relative">
          <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.099 4.018 4.018-1.099z" />
          </svg>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-200"></span>
          </span>
        </div>
        <span className="text-xs sm:text-sm font-semibold tracking-wide hidden sm:inline-block">Chat CS WhatsApp</span>
      </a>

      {/* Interactive Modals */}
      <TicketBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        initialOrigin={bookingOrigin}
        initialDestination={bookingDestination}
        initialScheduleId={selectedScheduleId}
      />

      <PaymentConfirmationModal
        isOpen={isPaymentConfirmationModalOpen}
        onClose={() => setIsPaymentConfirmationModalOpen(false)}
      />

      <DownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />
    </div>
  );
};

export default LandingPage;
