import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../config/theme';
import MasterKotaScreen from './MasterKotaScreen';
import MasterRuteScreen from './MasterRuteScreen';
import MasterArmadaScreen from './MasterArmadaScreen';
import MasterDriverScreen from './MasterDriverScreen';

export default function MasterDataHubScreen({ onBack, initialTab = 'kota' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'kota', 'rute', 'armada', 'driver'

  const tabs = [
    { id: 'kota', title: 'Master Kota', icon: 'location-outline' },
    { id: 'rute', title: 'Master Rute', icon: 'map-outline' },
    { id: 'armada', title: 'Master Armada', icon: 'bus-outline' },
    { id: 'driver', title: 'Master Driver', icon: 'person-outline' }
  ];

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.btnBack} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color={COLORS.secondary} />
          <Text style={styles.btnBackText}>Dashboard</Text>
        </TouchableOpacity>

        <View style={styles.titleWrapper}>
          <Text style={styles.headerTitle}>Modul Master Data</Text>
          <Text style={styles.headerSubtitle}>Kelola Kota, Rute, Armada, dan Driver</Text>
        </View>
      </View>

      {/* Horizontal Tab Bar Switcher */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
          {tabs.map((t) => {
            const isActive = activeTab === t.id;

            return (
              <TouchableOpacity
                key={t.id}
                style={[styles.tabChip, isActive && styles.tabChipActive]}
                onPress={() => setActiveTab(t.id)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={t.icon}
                  size={16}
                  color={isActive ? '#ffffff' : COLORS.primary}
                />
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {t.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Active Tab Screen Content */}
      <View style={styles.screenBody}>
        {activeTab === 'kota' && <MasterKotaScreen onBack={onBack} />}
        {activeTab === 'rute' && <MasterRuteScreen />}
        {activeTab === 'armada' && <MasterArmadaScreen />}
        {activeTab === 'driver' && <MasterDriverScreen />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  header: {
    backgroundColor: COLORS.cardBg,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 8
  },
  btnBack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start'
  },
  btnBackText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondary
  },
  titleWrapper: {
    gap: 2
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.secondary
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted
  },
  tabsContainer: {
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe'
  },
  tabChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary
  },
  tabTextActive: {
    color: '#ffffff'
  },
  screenBody: {
    flex: 1
  }
});
