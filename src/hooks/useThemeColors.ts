/**
 * Purpose: Provides dynamic theme colors based on current theme mode
 *
 * Inputs: None
 *
 * Outputs:
 *   - Returns object with theme-appropriate colors
 *
 * Side effects: None
 */

import { useTheme } from '../contexts/ThemeContext';
import { colors, lightTheme, darkTheme } from '../theme/colors';

export const useThemeColors = () => {
  const { isDark } = useTheme();

  return {
    // Background colors
    background: isDark ? colors.backgroundDark : colors.background,
    surface: isDark ? colors.surfaceDark : colors.surface,

    // Text colors
    text: isDark ? colors.textDark : colors.text,
    textSecondary: isDark ? colors.textSecondaryDark : colors.textSecondary,
    textDisabled: colors.textDisabled,

    // Border colors
    border: isDark ? colors.borderDark : colors.border,

    // Primary colors
    primary: colors.primary.main,
    primaryDark: colors.primary.dark,
    primaryLight: colors.primary.light,

    // Secondary colors
    secondary: colors.secondary.main,
    secondaryDark: colors.secondary.dark,
    secondaryLight: colors.secondary.light,

    // Accent colors
    accent: colors.accent.main,
    accentDark: colors.accent.dark,
    accentLight: colors.accent.light,

    // Semantic colors
    success: colors.semantic.success,
    error: colors.semantic.error,
    warning: colors.semantic.warning,
    info: colors.semantic.info,

    // Vault colors
    vault: colors.vault,

    // Category colors
    category: colors.category,

    // Neutral colors
    neutral: colors.neutral,

    // Shadow colors
    shadow: colors.shadow,
    shadowLight: colors.shadowLight,
    shadowMedium: colors.shadowMedium,
    shadowDark: colors.shadowDark,

    // Glass morphism colors
    glass: colors.glass,

    // Goal/Debt colors
    goalGreen: colors.semantic.goalGreen,
    debtRed: colors.semantic.debtRed,

    // Income/Expense colors (for transaction amounts)
    incomeGreen: colors.semantic.success, // Bright green that works in both light and dark
    expenseRed: colors.semantic.error, // Bright red that works in both light and dark

    // Theme object (for compatibility)
    theme: isDark ? darkTheme : lightTheme,

    // Helper flag
    isDark,
  };
};
