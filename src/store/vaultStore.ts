// Vault Store - Helper methods for vault operations (uses accountStore internally)
import { create } from 'zustand';
import type { VaultState } from '../types/store';
import type { VaultType } from '../types/models';
import { useAccountStore } from './accountStore';
import { useAuthStore } from './authStore';

// ============================================
// Vault Store
// ============================================

export const useVaultStore = create<VaultState>()((set, get) => ({
  // Add amount to specific vault
  addToVault: (vault, amount) => {
    const accountStore = useAccountStore.getState();
    const authStore = useAuthStore.getState();
    const currentAccountId = authStore.currentAccountId;

    if (!currentAccountId) {
      console.error('[VaultStore] No current account selected');
      return;
    }

    const currentBalance = accountStore.getCurrentBalance();

    if (!currentBalance) {
      console.error('[VaultStore] Current balance not found');
      return;
    }

    const updates: any = {};

    if (vault === 'main') {
      updates.mainBalance = currentBalance.mainBalance + amount;
    } else if (vault === 'savings') {
      updates.savingsBalance = currentBalance.savingsBalance + amount;
    } else {
      updates.heldBalance = currentBalance.heldBalance + amount;
    }

    accountStore.updateBalance(currentAccountId, updates);

    console.log(`[VaultStore] Added ${amount} to ${vault} vault`);
  },

  // Subtract amount from specific vault
  subtractFromVault: (vault, amount) => {
    const accountStore = useAccountStore.getState();
    const authStore = useAuthStore.getState();
    const currentAccountId = authStore.currentAccountId;

    if (!currentAccountId) {
      console.error('[VaultStore] No current account selected');
      return;
    }

    const currentBalance = accountStore.getCurrentBalance();

    if (!currentBalance) {
      console.error('[VaultStore] Current balance not found');
      return;
    }

    const updates: any = {};

    if (vault === 'main') {
      updates.mainBalance = currentBalance.mainBalance - amount;
    } else if (vault === 'savings') {
      updates.savingsBalance = currentBalance.savingsBalance - amount;
    } else {
      updates.heldBalance = currentBalance.heldBalance - amount;
    }

    accountStore.updateBalance(currentAccountId, updates);

    console.log(`[VaultStore] Subtracted ${amount} from ${vault} vault`);
  },

  // Get balance of specific vault
  getVaultBalance: (vault) => {
    const accountStore = useAccountStore.getState();
    const currentBalance = accountStore.getCurrentBalance();

    if (!currentBalance) {
      return 0;
    }

    switch (vault) {
      case 'main':
        return currentBalance.mainBalance;
      case 'savings':
        return currentBalance.savingsBalance;
      case 'held':
        return currentBalance.heldBalance;
      default:
        return 0;
    }
  },

  // Get available balance (main + savings, excluding held)
  getAvailableToSpend: () => {
    const accountStore = useAccountStore.getState();
    const currentBalance = accountStore.getCurrentBalance();

    if (!currentBalance) {
      return 0;
    }

    return currentBalance.availableBalance;
  },
}));
