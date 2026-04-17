/**
 * Purpose: Secure PIN handling utilities
 *
 * Features:
 * - Hash PIN using CryptoJS (same as password hashing)
 * - Verify PIN against stored hash
 * - Generate secure PIN hash
 */

import CryptoJS from 'crypto-js';

/**
 * Hash a PIN using SHA256 (consistent with password hashing in authStore)
 */
export function hashPin(pin: string): string {
  return CryptoJS.SHA256(pin).toString();
}

/**
 * Verify PIN against stored hash
 */
export function verifyPin(pin: string, storedHash: string): boolean {
  const inputHash = hashPin(pin);
  return inputHash === storedHash;
}

/**
 * Validate PIN format (4-6 digits)
 */
export function validatePinFormat(pin: string): { valid: boolean; error?: string } {
  if (!pin || pin.length < 4) {
    return { valid: false, error: 'PIN must be at least 4 digits' };
  }
  if (pin.length > 6) {
    return { valid: false, error: 'PIN must be at most 6 digits' };
  }
  if (!/^\d+$/.test(pin)) {
    return { valid: false, error: 'PIN must contain only numbers' };
  }
  return { valid: true };
}

/**
 * Check if PIN is too simple (e.g., 1234, 0000)
 */
export function isPinTooSimple(pin: string): boolean {
  // Check for sequential numbers
  const sequential = ['0123', '1234', '2345', '3456', '4567', '5678', '6789'];
  const reverseSequential = ['9876', '8765', '7654', '6543', '5432', '4321', '3210'];

  // Check for repeating digits
  const repeating = /^(\d)\1+$/.test(pin);

  return sequential.includes(pin) || reverseSequential.includes(pin) || repeating;
}
