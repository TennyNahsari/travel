import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { authService } from '../services/api';
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

const LandingPage = () => {
  const navigate = useNavigate();
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingOrigin, setBookingOrigin] = useState('Jakarta (Pool Semanggi / Lebak Bulus)');
  const [bookingDestination, setBookingDestination] = useState('Bandung (Pool Pasteur / Dipatiukur)');
  const [selectedScheduleId, setSelectedScheduleId] = useState(null);

  const handleOpenBookingModal = (originCity, destCity, scheduleId = null) => {
    if (originCity) setBookingOrigin(originCity);
    if (destCity) setBookingDestination(destCity);
    setSelectedScheduleId(scheduleId || null);
    setIsBookingModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-soft-sky text-deep-navy font-sans selection:bg-travel-blue selection:text-white">
      {/* 01. Navigation */}
      <Navbar
        onOpenBookingModal={handleOpenBookingModal}
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

      {/* Interactive Modals */}
      <TicketBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        initialOrigin={bookingOrigin}
        initialDestination={bookingDestination}
        initialScheduleId={selectedScheduleId}
      />

      <DownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />
    </div>
  );
};

export default LandingPage;
