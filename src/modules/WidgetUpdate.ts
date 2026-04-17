// JavaScript bridge for Widget Update native module
import { NativeModules, Platform } from 'react-native';

interface WidgetUpdateModule {
  updateWidgets: () => void;
}

const { WidgetUpdate } = NativeModules;

/**
 * Trigger update for all Android home screen widgets
 * This should be called after any balance changes to keep widgets in sync
 *
 * @example
 * import { updateWidgets } from './modules/WidgetUpdate';
 *
 * // After updating balance
 * useAccountStore.getState().updateBalance(accountId, { mainBalance: 1000 });
 * updateWidgets(); // Refresh widgets immediately
 */
export function updateWidgets(): void {
  if (Platform.OS !== 'android') {
    return;
  }

  if (!WidgetUpdate) {
    console.warn('[WidgetUpdate] Native module not available');
    return;
  }

  try {
    WidgetUpdate.updateWidgets();
  } catch (error) {
    console.error('[WidgetUpdate] Failed to update widgets:', error);
  }
}

export default {
  updateWidgets,
};
