import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS } from '../config/theme';
import { authService } from '../services/api';

export default function LoginScreen({ onLoginSuccess, onNavigateHome }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    if (!email.trim()) {
      setError('Masukkan alamat email.');
      return;
    }
    if (!password) {
      setError('Masukkan password.');
      return;
    }

    try {
      setLoading(true);
      const res = await authService.login(email.trim(), password);
      setLoading(false);
      onLoginSuccess(res.user);
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.error || 'Login gagal. Periksa kembali email dan password Anda.';
      setError(errMsg);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* TOP BRAND HEADER */}
        <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.headerBanner}>
          <TouchableOpacity style={styles.btnBack} onPress={onNavigateHome}>
            <Ionicons name="arrow-back" size={20} color="#ffffff" />
            <Text style={styles.btnBackText}>Landing Page</Text>
          </TouchableOpacity>

          <View style={styles.logoBadge}>
            <Ionicons name="bus-outline" size={32} color="#ffffff" />
          </View>
          <Text style={styles.headerTitle}>
            Travel<Text style={styles.headerHighlight}>Express</Text>
          </Text>
          <Text style={styles.headerSubtitle}>Masuk ke Akun Portal Sistem Travel</Text>
        </LinearGradient>

        {/* LOGIN FORM CARD */}
        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Login Pengguna</Text>
          <Text style={styles.cardSubtitle}>Masukan kredensial akun Admin, Operator, Driver, atau Customer Anda.</Text>

          {/* Error Message */}
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={18} color={COLORS.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Email Field */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Alamat Email</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="nama@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                placeholderTextColor={COLORS.textLight}
              />
            </View>
          </View>

          {/* Password Field */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Masukkan password akun"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                placeholderTextColor={COLORS.textLight}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={COLORS.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.btnLogin, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Ionicons name="log-in-outline" size={20} color="#ffffff" />
                <Text style={styles.btnLoginText}>Masuk ke Sistem</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Demo Login Credentials Hint */}
          <View style={styles.demoBox}>
            <Text style={styles.demoTitle}>💡 Akun Demo (Password: password123):</Text>
            <Text style={styles.demoText}>• Admin: admin@travel.com</Text>
            <Text style={styles.demoText}>• Operator: operator@travel.com</Text>
            <Text style={styles.demoText}>• Driver: driver@travel.com</Text>
            <Text style={styles.demoText}>• Customer: customer@travel.com</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  scrollContent: {
    flexGrow: 1
  },
  headerBanner: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28
  },
  btnBack: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20
  },
  btnBackText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600'
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 12,
    ...SHADOWS.medium
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff'
  },
  headerHighlight: {
    color: '#60a5fa'
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4
  },
  formCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 20,
    marginTop: -20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.secondary
  },
  cardSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 18
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16
  },
  errorText: {
    fontSize: 12,
    color: COLORS.danger,
    fontWeight: '500',
    flex: 1
  },
  formGroup: {
    marginBottom: 16
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: 6
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48
  },
  inputIcon: {
    marginRight: 8
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textMain
  },
  eyeBtn: {
    padding: 6
  },
  btnLogin: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8
  },
  btnDisabled: {
    opacity: 0.6
  },
  btnLoginText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700'
  },
  demoBox: {
    backgroundColor: '#f8fafc',
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 20,
    gap: 2
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: 4
  },
  demoText: {
    fontSize: 11,
    color: COLORS.textMuted
  }
});
