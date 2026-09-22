import React, { useState, useEffect } from 'react';
import { StyleSheet, SafeAreaView, StatusBar, View, ActivityIndicator } from 'react-native';
import { COLORS } from './src/config/theme';
import { authService } from './src/services/api';
import Navbar from './src/components/Navbar';
import LandingScreen from './src/screens/LandingScreen';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import MasterDataHubScreen from './src/screens/MasterDataHubScreen';
import JadwalPerjalananScreen from './src/screens/JadwalPerjalananScreen';
import BookingTiketScreen from './src/screens/BookingTiketScreen';
import CharterArmadaScreen from './src/screens/CharterArmadaScreen';
import PengirimanPaketScreen from './src/screens/PengirimanPaketScreen';
import PembayaranScreen from './src/screens/PembayaranScreen';
import CheckInPassengerScreen from './src/screens/CheckInPassengerScreen';
import LaporanScreen from './src/screens/LaporanScreen';
import ManajemenUserScreen from './src/screens/ManajemenUserScreen';

export default function App() {
  const [activeScreen, setActiveScreen] = useState('landing'); // 'landing', 'login', 'dashboard', 'master_data', 'jadwal', 'booking', 'charter', 'package', 'pembayaran', 'checkin', 'laporan', 'user'
  const [masterTab, setMasterTab] = useState('kota');
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingApp, setLoadingApp] = useState(true);

  useEffect(() => {
    checkUserSession();
  }, []);

  const checkUserSession = async () => {
    try {
      const savedUser = await authService.getCurrentUser();
      if (savedUser) {
        setCurrentUser(savedUser);
      }
    } catch (err) {
      console.error('Failed to restore user session:', err);
    } finally {
      setLoadingApp(false);
    }
  };

  const handleNavigate = (screen) => {
    setActiveScreen(screen);
  };

  const handleNavigateMasterData = (tab = 'kota') => {
    setMasterTab(tab);
    setActiveScreen('master_data');
  };

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    setActiveScreen('dashboard');
  };

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
    setActiveScreen('landing');
  };

  const [showPaymentCheckTrigger, setShowPaymentCheckTrigger] = useState(false);

  const handleOpenPaymentCheck = () => {
    if (activeScreen !== 'landing') {
      setActiveScreen('landing');
    }
    setShowPaymentCheckTrigger(true);
  };

  if (loadingApp) {
    return (
      <View style={styles.splashContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.cardBg} />

      {/* Global Navbar */}
      <Navbar
        activeScreen={activeScreen}
        onNavigate={handleNavigate}
        user={currentUser}
        onOpenPaymentCheck={handleOpenPaymentCheck}
      />

      {/* Main Screen Switcher */}
      <View style={styles.screenContainer}>
        {activeScreen === 'landing' && (
          <LandingScreen
            onNavigate={handleNavigate}
            showPaymentCheckTrigger={showPaymentCheckTrigger}
            onClosePaymentCheckTrigger={() => setShowPaymentCheckTrigger(false)}
          />
        )}

        {activeScreen === 'login' && (
          <LoginScreen
            onLoginSuccess={handleLoginSuccess}
            onNavigateHome={() => handleNavigate('landing')}
          />
        )}

        {activeScreen === 'dashboard' && (
          <DashboardScreen
            user={currentUser}
            onLogout={handleLogout}
            onNavigateMasterData={handleNavigateMasterData}
            onNavigateJadwal={() => handleNavigate('jadwal')}
            onNavigateBooking={() => handleNavigate('booking')}
            onNavigateCharter={() => handleNavigate('charter')}
            onNavigatePackage={() => handleNavigate('package')}
            onNavigatePembayaran={() => handleNavigate('pembayaran')}
            onNavigateCheckIn={() => handleNavigate('checkin')}
            onNavigateLaporan={() => handleNavigate('laporan')}
            onNavigateUser={() => handleNavigate('user')}
          />
        )}

        {activeScreen === 'master_data' && (
          <MasterDataHubScreen
            initialTab={masterTab}
            onBack={() => setActiveScreen('dashboard')}
          />
        )}

        {activeScreen === 'jadwal' && (
          <JadwalPerjalananScreen
            onBack={() => setActiveScreen('dashboard')}
          />
        )}

        {activeScreen === 'booking' && (
          <BookingTiketScreen
            onBack={() => setActiveScreen('dashboard')}
          />
        )}

        {activeScreen === 'charter' && (
          <CharterArmadaScreen
            onBack={() => setActiveScreen('dashboard')}
          />
        )}

        {activeScreen === 'package' && (
          <PengirimanPaketScreen
            onBack={() => setActiveScreen('dashboard')}
          />
        )}

        {activeScreen === 'pembayaran' && (
          <PembayaranScreen
            onBack={() => setActiveScreen('dashboard')}
          />
        )}

        {activeScreen === 'checkin' && (
          <CheckInPassengerScreen
            onBack={() => setActiveScreen('dashboard')}
          />
        )}

        {activeScreen === 'laporan' && (
          <LaporanScreen
            onBack={() => setActiveScreen('dashboard')}
          />
        )}

        {activeScreen === 'user' && (
          <ManajemenUserScreen
            onBack={() => setActiveScreen('dashboard')}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  splashContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center'
  },
  screenContainer: {
    flex: 1
  }
});
