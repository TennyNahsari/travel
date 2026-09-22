import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../config/theme';

export default function Navbar({ activeScreen, onNavigate, user, onOpenPaymentCheck }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.brandContainer} onPress={() => onNavigate('landing')}>
        <View style={styles.logoBadge}>
          <Ionicons name="bus-outline" size={20} color="#ffffff" />
        </View>
        <View>
          <Text style={styles.brandTitle}>
            Travel<Text style={styles.brandHighlight}>Express</Text>
          </Text>
          <Text style={styles.brandTagline}>Intercity Shuttle</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.navActions}>
        <TouchableOpacity
          style={styles.btnNavCheck}
          onPress={onOpenPaymentCheck}
          activeOpacity={0.8}
        >
          <Ionicons name="card-outline" size={15} color={COLORS.primary} />
          <Text style={styles.btnNavCheckText}>Cek Bayar</Text>
        </TouchableOpacity>

        {user ? (
          <TouchableOpacity
            style={[styles.btnNav, activeScreen === 'dashboard' && styles.btnActive]}
            onPress={() => onNavigate('dashboard')}
          >
            <Ionicons name="grid-outline" size={16} color={activeScreen === 'dashboard' ? '#ffffff' : COLORS.primary} />
            <Text style={[styles.btnNavText, activeScreen === 'dashboard' && styles.btnActiveText]}>
              Dashboard
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.btnNav, activeScreen === 'login' && styles.btnActive]}
            onPress={() => onNavigate(activeScreen === 'login' ? 'landing' : 'login')}
          >
            <Ionicons
              name={activeScreen === 'login' ? 'home-outline' : 'log-in-outline'}
              size={16}
              color={activeScreen === 'login' ? '#ffffff' : COLORS.primary}
            />
            <Text style={[styles.btnNavText, activeScreen === 'login' && styles.btnActiveText]}>
              {activeScreen === 'login' ? 'Home' : 'Masuk'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 64,
    backgroundColor: COLORS.cardBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.small
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.secondary
  },
  brandHighlight: {
    color: COLORS.primary
  },
  brandTagline: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '500'
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  btnNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe'
  },
  btnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  btnNavText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary
  },
  btnActiveText: {
    color: '#ffffff'
  },
  btnNavCheck: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  btnNavCheckText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary
  }
});
