# Crowd React Native - Project Structure

**Generated:** Sun, Feb  1, 2026  7:40:24 PM
**Framework:** React Native 0.79.0 with Expo SDK 53

## Project Overview

- **Language:** JavaScript (components) + TypeScript (data structures, services)
- **State Management:** Redux Toolkit + React Context API
- **Navigation:** React Navigation v6
- **Backend:** Firebase (Auth, Database, Messaging)
- **Video Processing:** FFmpeg, expo-av, Vision Camera, VLC

## File Statistics

```
Total JavaScript files: 8
Total TypeScript files: 16114
Total Components: 0
Total Screens: 0
Total Services: 0
Total Hooks: 0
```

## Main Directory Structure

```
.
.bundle
.claude
.git
__tests__
android
assets
assets/fonts
assets/icons
docs
ios
node_modules
scripts
src
src/components
src/constants
src/contexts
src/database
src/hooks
src/modules
src/navigation
src/screens
src/services
src/store
src/theme
src/types
src/utils
```

## Key Directories

### Core Application
- **src/screens/**: Feature screens (Dashboard, Transactions, Goals, Vault, etc.)
  - Each screen handles specific user flows
  - Contains both JavaScript and React Native components

- **src/components/**: Reusable UI components
  - Organized by feature area (transactions, goals, debts, vault)
  - Common components shared across features

- **src/services/**: Business logic, API calls, utilities
  - TypeScript for type safety
  - Currency service, widget management
  - Background tasks, biometric auth, haptics

### State & Navigation
- **src/hooks/**: Custom React hooks
  - Naming convention: `use[HookName].ts`

- **src/contexts/**: React Context providers
  - Global state management (ThemeContext, etc.)

- **src/navigation/**: Navigation configuration
  - React Navigation v6 setup
  - Auth, Main, and Root navigators

- **src/store/**: Redux Toolkit store and slices
  - Global app state (accounts, auth, settings, vault)
  - Feature-based stores

### Data & Configuration
- **src/types/**: TypeScript types, interfaces, models
  - Type definitions for data models
  - Shared interfaces across the app

- **src/constants/**: App-wide constants
  - Currency definitions
  - Configuration values

- **src/utils/**: Utility functions
  - Helper functions (calculator, validators, etc.)
  - Common operations

- **src/database/**: Database layer
  - Schema definitions
  - Queries and repositories
  - Migration scripts

### Styling
- **src/theme/**: Theme configuration
  - Colors, typography, spacing
  - Animations and shared styles

## Detailed Structure

### src/screens/
```
accounts/AccountSettingsScreen.tsx
accounts/AccountsListScreen.tsx
accounts/CreateAccountScreen.tsx
auth/LoginScreen.tsx
auth/SignupScreen.tsx
categories/CategoriesScreen.tsx
categories/CreateCategoryScreen.tsx
dashboard/DashboardScreen.tsx
debts/AddDebtScreen.tsx
debts/DebtDetailsScreen.tsx
debts/DebtsScreen.tsx
goals/CreateGoalScreen.tsx
goals/GoalsScreen.tsx
recurring/AddRecurringExpenseScreen.tsx
recurring/RecurringExpensesScreen.tsx
security/BiometricLockScreen.tsx
security/SecuritySettingsScreen.tsx
settings/SalarySettingsScreen.tsx
settings/SettingsScreen.tsx
SplashScreen.tsx
subscriptions/AddSubscriptionScreen.tsx
subscriptions/SubscriptionsScreen.tsx
transactions/AddTransactionScreen.tsx
transactions/TransactionDetailsScreen.tsx
transactions/TransactionHistoryScreen.tsx
vault/VaultManagementScreen.tsx
```

### src/components/
```
bento/BalanceCard.tsx
bento/BentoCard.tsx
bento/GoalsOverviewCard.tsx
bento/QuickStats.tsx
bento/RecentTransactions.tsx
bento/SpendingChart.tsx
bento/VaultCard.tsx
common/EmptyState.tsx
common/ErrorBoundary.tsx
common/ErrorState.tsx
common/ImageViewer.tsx
common/LoadingOverlay.tsx
common/SkeletonLoader.tsx
common/SplashScreen.tsx
common/ThemePickerModal.tsx
debts/DebtCard.tsx
debts/DebtStatusBadge.tsx
debts/DebtSummaryCard.tsx
forms/AmountInput.tsx
forms/Button.tsx
forms/CalculatorModal.tsx
forms/CategoryPicker.tsx
forms/CurrencyPicker.tsx
forms/DatePicker.tsx
forms/ImagePickerButton.tsx
forms/Input.tsx
goals/GoalCard.tsx
goals/GoalCompletionModal.tsx
transactions/CategoryIcon.tsx
transactions/CurrencyConversionModal.tsx
transactions/TransactionItem.tsx
ui/FAB.tsx
vault/TransferModal.tsx
```

### src/services/
```
backgroundTasks/autoSalaryTask.ts
backgroundTasks/index.ts
backgroundTasks/recurringExpenseTask.ts
backgroundTasks/subscriptionTask.ts
biometric/biometricAuth.ts
biometric/pinUtils.ts
currencyService.ts
haptics/hapticFeedback.ts
notifications/notificationService.ts
notifications/scheduleNudges.ts
widgetDataManager.ts
```

### src/store/
```
accountStore.ts
authStore.ts
index.ts
middleware/mmkvStorage.ts
settingsStore.ts
uiStore.ts
vaultStore.ts
```

### src/types/
```
ai.ts
index.ts
models.ts
navigation.ts
store.ts
```

### src/hooks/
```
useThemeColors.ts
```

### src/database/
```
index.ts
migrations.ts
repositories/AccountRepository.ts
repositories/CategoryRepository.ts
repositories/DebtRepository.ts
repositories/GoalRepository.ts
repositories/RecurringExpenseRepository.ts
repositories/SubscriptionRepository.ts
repositories/TransactionRepository.ts
repositories/UserRepository.ts
schema.ts
```

## Important Configuration Files

```
app.json
babel.config.js
babel.config.js
index.js
jest.config.js
jest.config.js
metro.config.js
metro.config.js
package.json
package-lock.json
react-native.config.js
react-native.config.js
tsconfig.json
```

## Code Conventions

### Naming Conventions
- **Components/Screens**: PascalCase (e.g., `TransactionList.tsx`)
- **Hooks**: use prefix (e.g., `useThemeColors.ts`)
- **Functions/Variables**: camelCase (e.g., `handlePress`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_AMOUNT`)

### Performance Rules
- ✓ Always use **FlatList** for lists (never ScrollView with .map())
- ✓ Use **React.memo** on list item components
- ✓ Use **useCallback** for functions passed to children
- ✓ Use **useMemo** for expensive calculations
- ✓ Set `removeClippedSubviews={true}` on FlatLists
- ✓ Clean up useEffect hooks (subscriptions, timers)

### State Management
- Use **Redux Toolkit** for global state (accounts, auth, settings)
- Use **React Context** for theme and UI state
- Keep component state local when possible

### Navigation
- Pass small data via route params (IDs, flags)
- Pass large data via Redux/Context
- Always add back button for iOS screens
- Handle Android hardware back button with BackHandler
- Use modal animation for create/edit screens

---

**Note**: This structure file helps LLM models understand the codebase without reading all files.
Update this file when adding new major features or restructuring directories.

**Regenerate**: `bash generate-structure.sh` or `npm run structure`
