// Color Palette with nested structure
export const colors = {
  // Primary Colors
  primary: {
    main: '#13ecec',
    dark: '#0FC5C5',
    light: '#4DF0F0',
  },

  // Secondary Colors
  secondary: {
    main: '#FFE66D',
    dark: '#F5C644',
    light: '#FFF095',
  },

  // Accent Colors
  accent: {
    main: '#FF6B6B',
    dark: '#E55555',
    light: '#FF9494',
  },

  // Semantic Colors
  semantic: {
    success: '#06D6A0',
    successDark: '#05B886',
    successLight: '#35E0B4',
    error: '#EF476F',
    errorDark: '#D63459',
    errorLight: '#F37091',
    warning: '#FFD166',
    warningDark: '#F5BB4D',
    warningLight: '#FFDC8F',
    info: '#118AB2',
    infoDark: '#0D6E8C',
    infoLight: '#3FA3C4',
    goalGreen: '#10b981',
    debtRed: '#ff4d4d',
  },

  // Neutral Colors
  neutral: {
    white: '#FFFFFF',
    black: '#000000',
    gray50: '#FAFAFA',
    gray100: '#F5F5F5',
    gray200: '#EEEEEE',
    gray300: '#E0E0E0',
    gray400: '#BDBDBD',
    gray500: '#9E9E9E',
    gray600: '#757575',
    gray700: '#616161',
    gray800: '#424242',
    gray900: '#212121',
  },

  // Vault Colors
  vault: {
    main: '#13ecec',
    savings: '#FFD166',
    held: '#FF6B6B',
  },

  // Glass Morphism Colors
  glass: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: 'rgba(255, 255, 255, 0.05)',
    borderLight: 'rgba(255, 255, 255, 0.1)',
  },

  // Background
  background: '#fdf5e6',
  backgroundDark: '#1f201f',
  surface: '#FFFFFF',
  surfaceDark: '#2a2b2a',

  // Text
  text: '#212121',
  textSecondary: '#757575',
  textDisabled: '#BDBDBD',
  textDark: '#FFFFFF',
  textSecondaryDark: '#BDBDBD',

  // Category Default Colors
  category: {
    red: '#FF6B6B',
    blue: '#4ECDC4',
    yellow: '#FFE66D',
    green: '#A8E6CF',
    pink: '#FF8B94',
    purple: '#B4A7D6',
    skyBlue: '#89CFF0',
    lavender: '#C7CEEA',
    teal: '#06D6A0',
    navy: '#118AB2',
    orange: '#FFD166',
    fuchsia: '#EF476F',
    indigo: '#26547C',
  },

  // Borders
  border: '#E0E0E0',
  borderDark: '#3a3b3a',

  // Shadows
  shadow: 'rgba(0, 0, 0, 0.2)',
  shadowLight: 'rgba(0, 0, 0, 0.1)',
  shadowMedium: 'rgba(0, 0, 0, 0.2)',
  shadowDark: 'rgba(0, 0, 0, 0.3)',
};

// Light Theme
export const lightTheme = {
  primary: colors.primary.main,
  background: colors.background,
  surface: colors.surface,
  text: colors.text,
  textSecondary: colors.textSecondary,
  border: colors.border,
  success: colors.semantic.success,
  error: colors.semantic.error,
  warning: colors.semantic.warning,
  info: colors.semantic.info,
};

// Dark Theme
export const darkTheme = {
  primary: colors.primary.main,
  background: colors.backgroundDark,
  surface: colors.surfaceDark,
  text: colors.textDark,
  textSecondary: colors.textSecondaryDark,
  border: colors.borderDark,
  success: colors.semantic.success,
  error: colors.semantic.error,
  warning: colors.semantic.warning,
  info: colors.semantic.info,
};

// Compatibility helper - adds .main property to semantic colors
export const compatColors = {
  ...colors,
  success: {
    main: colors.semantic.success,
    dark: colors.semantic.successDark,
    light: colors.semantic.successLight,
  },
  error: {
    main: colors.semantic.error,
    dark: colors.semantic.errorDark,
    light: colors.semantic.errorLight,
  },
  warning: {
    main: colors.semantic.warning,
    dark: colors.semantic.warningDark,
    light: colors.semantic.warningLight,
  },
  info: {
    main: colors.semantic.info,
    dark: colors.semantic.infoDark,
    light: colors.semantic.infoLight,
  },
};
