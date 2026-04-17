/**
 * Purpose: Provides biometric authentication and device capability detection
 *
 * Features:
 * - Check device biometric capabilities
 * - Authenticate with fingerprint/FaceID
 * - Fallback to PIN if biometric unavailable
 * - Handle authentication errors
 */

import ReactNativeBiometrics from 'react-native-biometrics';
import { Platform } from 'react-native';

// Disable device credentials fallback - require biometric only
const rnBiometrics = new ReactNativeBiometrics({
  allowDeviceCredentials: false,
});

export interface BiometricCapabilities {
  isAvailable: boolean;
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: string[];
  biometricType: 'fingerprint' | 'faceId' | 'iris' | 'none';
}

export interface AuthenticationResult {
  success: boolean;
  error?: string;
  biometricType?: string;
}

/**
 * Check device biometric capabilities
 */
export async function checkBiometricCapabilities(): Promise<BiometricCapabilities> {
  try {
    // Check if biometric sensor is available and enrolled
    const { available, biometryType } = await rnBiometrics.isSensorAvailable();

    // Determine the biometric type based on platform and sensor
    let detectedType: 'fingerprint' | 'faceId' | 'iris' | 'none' = 'none';

    if (available && biometryType) {
      // On iOS: 'TouchID', 'FaceID'
      // On Android: 'Biometrics'
      if (biometryType === 'FaceID') {
        detectedType = 'faceId';
      } else if (biometryType === 'TouchID' || biometryType === 'Biometrics') {
        detectedType = 'fingerprint';
      } else {
        // Default to fingerprint for other types
        detectedType = 'fingerprint';
      }
    }

    return {
      isAvailable: available,
      hasHardware: available,
      isEnrolled: available,
      supportedTypes: biometryType ? [biometryType] : [],
      biometricType: detectedType,
    };
  } catch (error) {
    console.error('[BiometricAuth] Error checking capabilities:', error);
    return {
      isAvailable: false,
      hasHardware: false,
      isEnrolled: false,
      supportedTypes: [],
      biometricType: 'none',
    };
  }
}

/**
 * Authenticate using biometrics
 */
export async function authenticateWithBiometrics(): Promise<AuthenticationResult> {
  try {
    const capabilities = await checkBiometricCapabilities();

    if (!capabilities.isAvailable) {
      return {
        success: false,
        error: 'Biometric authentication is not available',
      };
    }

    // Determine prompt message based on biometric type
    let promptMessage = 'Authenticate to access Wallet';
    if (capabilities.biometricType === 'faceId') {
      promptMessage = 'Use Face ID to unlock Wallet';
    } else if (capabilities.biometricType === 'fingerprint') {
      promptMessage = 'Use fingerprint to unlock Wallet';
    }

    // Authenticate with biometrics
    const { success } = await rnBiometrics.simplePrompt({
      promptMessage,
      cancelButtonText: 'Cancel',
    });

    if (success) {
      return {
        success: true,
        biometricType: capabilities.biometricType,
      };
    } else {
      return {
        success: false,
        error: 'Authentication failed',
      };
    }
  } catch (error: any) {
    console.error('[BiometricAuth] Authentication error:', error);

    // Parse error message
    let errorMessage = 'Authentication failed';
    if (error.message?.includes('cancel') || error.message?.includes('Cancel')) {
      errorMessage = 'Authentication cancelled';
    } else if (error.message?.includes('locked')) {
      errorMessage = 'Too many attempts, device locked';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get friendly name for biometric type
 */
export function getBiometricTypeName(type: 'fingerprint' | 'faceId' | 'iris' | 'none'): string {
  switch (type) {
    case 'fingerprint':
      return 'Fingerprint';
    case 'faceId':
      return 'Face ID';
    case 'iris':
      return 'Iris';
    default:
      return 'Biometric';
  }
}

/**
 * Get icon name for biometric type (MaterialCommunityIcons)
 */
export function getBiometricIcon(type: 'fingerprint' | 'faceId' | 'iris' | 'none'): string {
  switch (type) {
    case 'fingerprint':
      return 'fingerprint';
    case 'faceId':
      return 'face-recognition';
    case 'iris':
      return 'eye-outline';
    default:
      return 'shield-lock-outline';
  }
}
