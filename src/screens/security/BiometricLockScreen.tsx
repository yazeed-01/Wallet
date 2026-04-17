/**
 * Purpose: Full-screen biometric/PIN authentication overlay
 *
 * Features:
 * - Shows on app open when security enabled
 * - Biometric auth (fingerprint/FaceID) as primary
 * - PIN entry as fallback
 * - Failed attempt tracking
 * - Lockout after max attempts
 * - Beautiful UI with animations
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSettingsStore } from '../../store/settingsStore';
import {
  authenticateWithBiometrics,
  checkBiometricCapabilities,
  getBiometricIcon,
  getBiometricTypeName,
} from '../../services/biometric/biometricAuth';
import { verifyPin, validatePinFormat } from '../../services/biometric/pinUtils';
import { lightHaptic, mediumHaptic, errorHaptic } from '../../services/haptics/hapticFeedback';
import { useThemeColors } from '../../hooks/useThemeColors';
import { colors } from '../../theme/colors';

interface BiometricLockScreenProps {
  onAuthenticated: () => void;
}

const BiometricLockScreen: React.FC<BiometricLockScreenProps> = ({ onAuthenticated }) => {
  const themeColors = useThemeColors();
  const { securitySettings, updateSecuritySettings } = useSettingsStore();

  const [showPinInput, setShowPinInput] = useState(false);
  const [pin, setPin] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [biometricType, setBiometricType] = useState<'fingerprint' | 'faceId' | 'iris' | 'none'>('none');
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const [hasAuthenticated, setHasAuthenticated] = useState(false);

  // Check biometric capabilities on mount
  useEffect(() => {
    if (!hasAuthenticated) {
      checkCapabilities();
      checkLockout();
    }
  }, [hasAuthenticated]);

  // Check if device has biometric capabilities
  const checkCapabilities = async () => {
    const capabilities = await checkBiometricCapabilities();
    setBiometricType(capabilities.biometricType);

    // Auto-trigger biometric if available and not in PIN mode
    if (capabilities.isAvailable && securitySettings.authType === 'biometric') {
      setTimeout(() => handleBiometricAuth(), 500);
    }
  };

  // Check if user is locked out
  const checkLockout = () => {
    if (securitySettings.lockoutUntil) {
      const now = Date.now();
      if (now < securitySettings.lockoutUntil) {
        setIsLocked(true);
        const remaining = Math.ceil((securitySettings.lockoutUntil - now) / 1000);
        setLockoutRemaining(remaining);

        // Countdown timer
        const interval = setInterval(() => {
          const newRemaining = Math.ceil((securitySettings.lockoutUntil! - Date.now()) / 1000);
          if (newRemaining <= 0) {
            setIsLocked(false);
            clearInterval(interval);
            updateSecuritySettings({ lockoutUntil: null, failedAttempts: 0 });
          } else {
            setLockoutRemaining(newRemaining);
          }
        }, 1000);

        return () => clearInterval(interval);
      } else {
        // Lockout expired
        updateSecuritySettings({ lockoutUntil: null, failedAttempts: 0 });
      }
    }
  };

  // Handle biometric authentication
  const handleBiometricAuth = async () => {
    if (hasAuthenticated || isAuthenticating) {
      return; // Prevent multiple simultaneous auth attempts
    }

    setIsAuthenticating(true);
    lightHaptic();

    const result = await authenticateWithBiometrics();

    if (result.success) {
      setHasAuthenticated(true); // Mark as authenticated to prevent re-trigger
      mediumHaptic();
      updateSecuritySettings({
        lastAuthTime: Date.now(),
        failedAttempts: 0,
      });
      onAuthenticated();
    } else {
      errorHaptic();
      // Show PIN fallback
      setShowPinInput(true);
    }

    setIsAuthenticating(false);
  };

  // Handle PIN submission
  const handlePinSubmit = () => {
    lightHaptic();

    if (isLocked) {
      errorHaptic();
      Alert.alert(
        'Account Locked',
        `Too many failed attempts. Try again in ${lockoutRemaining} seconds.`
      );
      return;
    }

    const validation = validatePinFormat(pin);
    if (!validation.valid) {
      errorHaptic();
      Alert.alert('Invalid PIN', validation.error);
      return;
    }

    setIsAuthenticating(true);

    // Verify PIN
    if (securitySettings.pinHash && verifyPin(pin, securitySettings.pinHash)) {
      setHasAuthenticated(true); // Mark as authenticated to prevent re-trigger
      mediumHaptic();
      updateSecuritySettings({
        lastAuthTime: Date.now(),
        failedAttempts: 0,
      });
      setPin('');
      onAuthenticated();
    } else {
      errorHaptic();
      const newFailedAttempts = securitySettings.failedAttempts + 1;

      if (newFailedAttempts >= securitySettings.maxFailedAttempts) {
        // Lock out for 5 minutes
        const lockoutUntil = Date.now() + (5 * 60 * 1000);
        updateSecuritySettings({
          failedAttempts: newFailedAttempts,
          lockoutUntil,
        });
        setIsLocked(true);
        setLockoutRemaining(300);
        Alert.alert(
          'Too Many Attempts',
          'Account locked for 5 minutes due to too many failed attempts.'
        );
      } else {
        updateSecuritySettings({ failedAttempts: newFailedAttempts });
        Alert.alert(
          'Incorrect PIN',
          `${securitySettings.maxFailedAttempts - newFailedAttempts} attempts remaining`
        );
      }
      setPin('');
    }

    setIsAuthenticating(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* App Logo/Icon */}
      <View style={styles.logoContainer}>
        <MaterialCommunityIcons
          name="wallet"
          size={80}
          color={colors.primary.main}
        />
        <Text style={[styles.appName, { color: themeColors.text }]}>Wallet</Text>
      </View>

      {/* Lock Icon */}
      <View style={styles.lockIconContainer}>
        <MaterialCommunityIcons
          name={isLocked ? 'lock' : 'lock-open-variant'}
          size={60}
          color={isLocked ? colors.semantic.error : colors.primary.main}
        />
      </View>

      {/* Lockout Message */}
      {isLocked ? (
        <View style={styles.messageContainer}>
          <Text style={[styles.title, { color: colors.semantic.error }]}>
            Account Locked
          </Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            Try again in {lockoutRemaining} seconds
          </Text>
        </View>
      ) : (
        <>
          {/* Biometric Auth Section */}
          {!showPinInput && securitySettings.authType === 'biometric' ? (
            <View style={styles.messageContainer}>
              <Text style={[styles.title, { color: themeColors.text }]}>
                Unlock Wallet
              </Text>
              <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
                Use {getBiometricTypeName(biometricType)} to continue
              </Text>

              <TouchableOpacity
                style={[styles.biometricButton, { backgroundColor: colors.primary.main }]}
                onPress={handleBiometricAuth}
                disabled={isAuthenticating}
              >
                {isAuthenticating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name={getBiometricIcon(biometricType)}
                      size={32}
                      color="#fff"
                    />
                    <Text style={styles.buttonText}>
                      Unlock with {getBiometricTypeName(biometricType)}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Fallback to PIN - always show when using biometric */}
              <TouchableOpacity
                style={styles.fallbackButton}
                onPress={() => {
                  lightHaptic();
                  setShowPinInput(true);
                }}
              >
                <Text style={[styles.fallbackText, { color: colors.primary.main }]}>
                  Use PIN instead
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            // PIN Entry Section
            <View style={styles.messageContainer}>
              <Text style={[styles.title, { color: themeColors.text }]}>
                Enter PIN
              </Text>
              <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
                Enter your 4-6 digit PIN to unlock
              </Text>

              <TextInput
                style={[styles.pinInput, {
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                  color: themeColors.text,
                }]}
                value={pin}
                onChangeText={setPin}
                keyboardType="numeric"
                secureTextEntry
                maxLength={6}
                placeholder="Enter PIN"
                placeholderTextColor={themeColors.textSecondary}
                onSubmitEditing={handlePinSubmit}
                autoFocus
              />

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.primary.main }]}
                onPress={handlePinSubmit}
                disabled={isAuthenticating || pin.length < 4}
              >
                {isAuthenticating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Unlock</Text>
                )}
              </TouchableOpacity>

              {/* Back to biometric (if available) */}
              {securitySettings.authType === 'biometric' && (
                <TouchableOpacity
                  style={styles.fallbackButton}
                  onPress={() => {
                    lightHaptic();
                    setShowPinInput(false);
                    setPin('');
                  }}
                >
                  <Text style={[styles.fallbackText, { color: colors.primary.main }]}>
                    Use {getBiometricTypeName(biometricType)} instead
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 12,
  },
  lockIconContainer: {
    marginBottom: 32,
  },
  messageContainer: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 16,
  },
  submitButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pinInput: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 4,
  },
  fallbackButton: {
    marginTop: 16,
    padding: 12,
  },
  fallbackText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default BiometricLockScreen;
