// MMKV Storage Adapter for Zustand Persistence
import { createMMKV } from 'react-native-mmkv';
import { createJSONStorage, StateStorage } from 'zustand/middleware';

// ============================================
// Initialize MMKV Instance
// ============================================

export const mmkv = createMMKV({
  id: 'wallet-storage',
  // Optional: Enable encryption for sensitive data
  // encryptionKey: 'your-encryption-key-here'
});

// ============================================
// MMKV Storage Adapter for Zustand
// ============================================

const mmkvStateStorage: StateStorage = {
  setItem: (name, value) => {
    try {
      mmkv.set(name, value);
    } catch (error) {
      console.error('[MMKV] Failed to set item:', name, error);
      throw error;
    }
  },

  getItem: (name) => {
    try {
      const value = mmkv.getString(name);
      return value ?? null;
    } catch (error) {
      console.error('[MMKV] Failed to get item:', name, error);
      return null;
    }
  },

  removeItem: (name) => {
    try {
      mmkv.remove(name);
    } catch (error) {
      console.error('[MMKV] Failed to remove item:', name, error);
      throw error;
    }
  },
};

// Create JSON storage wrapper for Zustand
export const mmkvStorage = createJSONStorage(() => mmkvStateStorage);

// Clear all MMKV data
export const clearAllMMKVData = () => {
  try {
    mmkv.clearAll();
    console.log('[MMKV] All data cleared');
  } catch (error) {
    console.error('[MMKV] Failed to clear all data:', error);
    throw error;
  }
};

// ============================================
// MMKV Helper Functions
// ============================================

// Get a value from MMKV (with type)
export function getMMKVItem<T>(key: string, defaultValue: T): T {
  try {
    const value = mmkv.getString(key);
    if (value) {
      return JSON.parse(value) as T;
    }
    return defaultValue;
  } catch (error) {
    console.error('[MMKV] Failed to parse item:', key, error);
    return defaultValue;
  }
}

// Set a value to MMKV (with JSON serialization)
export function setMMKVItem<T>(key: string, value: T): void {
  try {
    mmkv.set(key, JSON.stringify(value));
  } catch (error) {
    console.error('[MMKV] Failed to set item:', key, error);
    throw error;
  }
}

// Remove a value from MMKV
export function removeMMKVItem(key: string): void {
  try {
    mmkv.remove(key);
  } catch (error) {
    console.error('[MMKV] Failed to remove item:', key, error);
    throw error;
  }
}

// Clear all MMKV data (useful for logout)
export function clearMMKV(): void {
  try {
    mmkv.clearAll();
    console.log('[MMKV] All data cleared');
  } catch (error) {
    console.error('[MMKV] Failed to clear all data:', error);
    throw error;
  }
}

// Get all MMKV keys
export function getAllMMKVKeys(): string[] {
  try {
    return mmkv.getAllKeys();
  } catch (error) {
    console.error('[MMKV] Failed to get all keys:', error);
    return [];
  }
}

// Check if a key exists
export function hasMMKVKey(key: string): boolean {
  try {
    return mmkv.contains(key);
  } catch (error) {
    console.error('[MMKV] Failed to check key:', key, error);
    return false;
  }
}
