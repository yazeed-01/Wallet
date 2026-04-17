import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { VaultCard } from '../../components/bento/VaultCard';
import { TransferModal } from '../../components/vault/TransferModal';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { VaultType } from '../../types/models';
import { useAuthStore } from '../../store/authStore';
import { useAccountStore } from '../../store/accountStore';
import { useThemeColors } from '../../hooks/useThemeColors';

export const VaultManagementScreen: React.FC = () => {
  const { currentAccountId } = useAuthStore();
  const { balances, transferBetweenVaults } = useAccountStore();
  const themeColors = useThemeColors();

  const styles = useMemo(() => createStyles(themeColors), [themeColors]);

  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [currentBalance, setCurrentBalance] = useState({
    mainBalance: 0,
    savingsBalance: 0,
    heldBalance: 0,
    totalBalance: 0,
    availableBalance: 0,
  });

  useFocusEffect(
    useCallback(() => {
      loadBalance();
    }, [currentAccountId, balances])
  );

  const loadBalance = () => {
    if (!currentAccountId) return;

    const balance = balances[currentAccountId] || {
      mainBalance: 0,
      savingsBalance: 0,
      heldBalance: 0,
      totalBalance: 0,
      availableBalance: 0,
    };

    setCurrentBalance(balance);
  };

  const handleTransfer = async (from: VaultType, to: VaultType, amount: number) => {
    if (!currentAccountId) {
      throw new Error('No account selected');
    }

    try {
      transferBetweenVaults(currentAccountId, from, to, amount);
      loadBalance();
    } catch (error: any) {
      throw error;
    }
  };

  const vaultDetails = [
    {
      name: 'Main Vault',
      description: 'Your primary spending money',
      icon: 'wallet',
      color: colors.primary.main,
      balance: currentBalance.mainBalance,
      features: [
        'Use for daily expenses',
        'Included in available balance',
        'Quick access for transactions',
      ],
    },
    {
      name: 'Savings Vault',
      description: 'Money set aside for future goals',
      icon: 'piggy-bank',
      color: colors.semantic.success,
      balance: currentBalance.savingsBalance,
      features: [
        'Save for future purchases',
        'Included in available balance',
        'Transfer to main when needed',
      ],
    },
    {
      name: 'Held Vault',
      description: 'Reserved money not available to spend',
      icon: 'lock',
      color: colors.semantic.warning,
      balance: currentBalance.heldBalance,
      features: [
        'Excluded from available balance',
        'For bills and commitments',
        'Prevents accidental spending',
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Vault Summary Card */}
        <VaultCard
          mainBalance={currentBalance.mainBalance}
          savingsBalance={currentBalance.savingsBalance}
          heldBalance={currentBalance.heldBalance}
          totalBalance={currentBalance.totalBalance}
          availableBalance={currentBalance.availableBalance}
        />

        {/* Transfer Button */}
        <TouchableOpacity
          style={styles.transferButton}
          onPress={() => setTransferModalVisible(true)}
        >
          <MaterialCommunityIcons
            name="swap-horizontal"
            size={24}
            color={colors.neutral.white}
          />
          <Text style={styles.transferButtonText}>Transfer Between Vaults</Text>
        </TouchableOpacity>

        {/* Vault Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.sectionTitle}>About Your Vaults</Text>

          {vaultDetails.map((vault, index) => (
            <View key={vault.name} style={styles.vaultDetailCard}>
              <View style={styles.vaultDetailHeader}>
                <View
                  style={[
                    styles.vaultDetailIcon,
                    { backgroundColor: vault.color },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={vault.icon as any}
                    size={24}
                    color={colors.neutral.white}
                  />
                </View>
                <View style={styles.vaultDetailInfo}>
                  <Text style={styles.vaultDetailName}>{vault.name}</Text>
                  <Text style={styles.vaultDetailDescription}>
                    {vault.description}
                  </Text>
                </View>
                <Text style={styles.vaultDetailBalance}>
                  ${vault.balance.toFixed(2)}
                </Text>
              </View>

              <View style={styles.featuresContainer}>
                {vault.features.map((feature, idx) => (
                  <View key={idx} style={styles.featureRow}>
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={16}
                      color={vault.color}
                    />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Info Section */}
        <View style={styles.infoCard}>
          <MaterialCommunityIcons
            name="information"
            size={20}
            color={colors.primary.main}
          />
          <Text style={styles.infoText}>
            <Text style={styles.infoTextBold}>Available to Spend</Text> includes
            money from Main and Savings vaults, but excludes money in the Held
            vault to prevent overspending.
          </Text>
        </View>
      </ScrollView>

      {/* Transfer Modal */}
      <TransferModal
        visible={transferModalVisible}
        onClose={() => setTransferModalVisible(false)}
        onTransfer={handleTransfer}
        mainBalance={currentBalance.mainBalance}
        savingsBalance={currentBalance.savingsBalance}
        heldBalance={currentBalance.heldBalance}
      />
    </View>
  );
};

const createStyles = (themeColors: ReturnType<typeof useThemeColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  scrollView: {
    flex: 1,
    padding: spacing.lg,
  },
  transferButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.main,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  transferButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.neutral.white,
  },
  detailsContainer: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: themeColors.text,
    marginBottom: spacing.md,
  },
  vaultDetailCard: {
    backgroundColor: themeColors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  vaultDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  vaultDetailIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaultDetailInfo: {
    flex: 1,
  },
  vaultDetailName: {
    ...typography.body,
    fontWeight: '600',
    color: themeColors.text,
    marginBottom: 2,
  },
  vaultDetailDescription: {
    ...typography.caption,
    color: themeColors.textSecondary,
  },
  vaultDetailBalance: {
    ...typography.h3,
    fontWeight: '700',
    color: themeColors.text,
  },
  featuresContainer: {
    gap: spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    ...typography.caption,
    color: themeColors.textSecondary,
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.primary.light,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  infoText: {
    ...typography.caption,
    color: themeColors.textSecondary,
    flex: 1,
  },
  infoTextBold: {
    fontWeight: '600',
    color: colors.primary.main,
  },
});
