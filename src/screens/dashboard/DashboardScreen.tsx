import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Animated,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { spacing } from '../../theme/spacing';
import { MainStackParamList } from '../../types/navigation';
import { useAuthStore } from '../../store/authStore';
import { useAccountStore } from '../../store/accountStore';
import { useSettingsStore } from '../../store/settingsStore';
import { TransactionRepository } from '../../database/repositories/TransactionRepository';
import { CategoryRepository } from '../../database/repositories/CategoryRepository';
import { GoalRepository } from '../../database/repositories/GoalRepository';
import { DebtRepository } from '../../database/repositories/DebtRepository';
import { SubscriptionRepository } from '../../database/repositories/SubscriptionRepository';
import { RecurringExpenseRepository } from '../../database/repositories/RecurringExpenseRepository';
import type { Transaction, Category, Goal, Debt } from '../../types/models';
import { startOfDay, endOfDay, subDays, subMonths, startOfMonth, endOfMonth, format } from 'date-fns';
import { calculateGoalProgress } from '../../utils/goalUtils';
import { useThemeColors } from '../../hooks/useThemeColors';

// New Components
import { DashboardHeader } from '../../components/dashboard/DashboardHeader';
import { GradientBalanceCard } from '../../components/dashboard/GradientBalanceCard';
import { ActionButtons } from '../../components/dashboard/ActionButtons';
import { WealthAnalyticsCard } from '../../components/dashboard/WealthAnalyticsCard';
import { MovementsList } from '../../components/dashboard/MovementsList';
import { BottomNavigation } from '../../components/navigation/BottomNavigation';
import { DashboardCardsGrid } from '../../components/dashboard/DashboardCardsGrid';
import { IncomeExpenseChart } from '../../components/dashboard/IncomeExpenseChart';
import { SpendingDonutChart } from '../../components/dashboard/SpendingDonutChart';
import { GoalsProgressCard } from '../../components/dashboard/GoalsProgressCard';

type DashboardScreenNavigationProp = StackNavigationProp<
  MainStackParamList,
  'Dashboard'
>;

interface TransactionWithCategory extends Transaction {
  category: Category;
}

interface ChartDataPoint {
  day: string;
  income: number;
  expense: number;
}

interface MonthDataPoint {
  month: string;
  income: number;
  expense: number;
}

interface CategorySpend {
  name: string;
  amount: number;
  color: string;
}

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const currentUser = useAuthStore((state) => state.currentUser);
  const currentAccountId = useAuthStore((state) => state.currentAccountId);
  const { balances } = useAccountStore();
  const aiSettings = useSettingsStore((state) => state.aiSettings) || { isConfigured: false };
  const themeColors = useThemeColors();

  const [refreshing, setRefreshing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const fadeAnim = useState(() => new Animated.Value(1))[0];
  const [currentBalance, setCurrentBalance] = useState({
    mainBalance: 0,
    savingsBalance: 0,
    heldBalance: 0,
    totalBalance: 0,
    availableBalance: 0,
  });
  const [accountCurrency, setAccountCurrency] = useState<string>('USD');

  // Header animation for scroll
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const headerTranslateY = useRef(new Animated.Value(0)).current;

  const [recentTransactions, setRecentTransactions] = useState<TransactionWithCategory[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [analyticsTab, setAnalyticsTab] = useState<'income' | 'expense' | 'combined'>('combined');

  const [monthlyData, setMonthlyData] = useState<MonthDataPoint[]>([]);
  const [categorySpend, setCategorySpend] = useState<CategorySpend[]>([]);
  const [totalMonthSpend, setTotalMonthSpend] = useState(0);
  const [activeGoals, setActiveGoals] = useState<Goal[]>([]);
  const [activeDebts, setActiveDebts] = useState<Debt[]>([]);
  const [goalsCount, setGoalsCount] = useState({ total: 0, active: 0, completed: 0 });
  const [debtsStats, setDebtsStats] = useState({ totalLent: 0, totalBorrowed: 0 });
  const [subscriptionsCount, setSubscriptionsCount] = useState(0);
  const [categoriesCount, setCategoriesCount] = useState(0);
  const [recurringCount, setRecurringCount] = useState(0);

  const transactionRepo = new TransactionRepository();
  const categoryRepo = new CategoryRepository();
  const goalRepo = new GoalRepository();
  const debtRepo = new DebtRepository();

  const styles = useMemo(() => createStyles(themeColors), [themeColors]);

  // Fire on every focus — reload all dashboard data immediately, background tasks run in parallel
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (currentAccountId) {
        fadeAnim.setValue(0.3);
        // Load data and background tasks in parallel; don't block data on background tasks
        loadDashboardData(true);
        checkBackgroundTasks();
      }
    });
    return unsubscribe;
  }, [navigation, currentAccountId]);

  /**
   * Purpose: Check and process any pending auto-salary payments
   * 
   * Side effects:
   *   - Creates salary transactions if due
   *   - Shows alert to user if salary was processed
   */
  const checkAutoSalary = async () => {
    try {
      const { checkAndProcessAutoSalary } = await import('../../services/backgroundTasks/autoSalaryTask');
      const result = await checkAndProcessAutoSalary();
      
      if (result.processed && result.count > 0) {
        // Show notification to user
        const monthText = result.count === 1 ? '1 month' : `${result.count} months`;
        Alert.alert(
          '💰 Salary Added!',
          `Auto-salary has been processed for ${monthText}.\n\nTotal added: ${result.totalAmount.toFixed(2)}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('[Dashboard] Auto-salary check error:', error);
    }
  };

  /**
   * Purpose: Check and process all background tasks on app open
   * 
   * Side effects:
   *   - Processes auto-salary, subscriptions, recurring expenses
   *   - Checks goal completions
   *   - Shows alerts for any processed items
   */
  const checkBackgroundTasks = async () => {
    if (!currentAccountId) {
      console.log('[Dashboard] No currentAccountId, skipping background tasks');
      return;
    }

    const notifications: string[] = [];
    
    try {
      // 1. Check auto-salary
      const { checkAndProcessAutoSalary } = await import('../../services/backgroundTasks/autoSalaryTask');
      const salaryResult = await checkAndProcessAutoSalary();
      
      if (salaryResult.processed && salaryResult.count > 0) {
        const monthText = salaryResult.count === 1 ? '1 month' : `${salaryResult.count} months`;
        notifications.push(`💰 Salary: ${monthText} added (${salaryResult.totalAmount.toFixed(2)})`);
      }
      
      // 2. Check subscriptions
      const { checkAndProcessSubscriptions } = await import('../../services/backgroundTasks/subscriptionTask');
      const subscriptionResult = await checkAndProcessSubscriptions(currentAccountId);
      
      if (subscriptionResult.processed > 0) {
        notifications.push(`📱 Subscriptions: ${subscriptionResult.processed} processed (-${subscriptionResult.totalAmount.toFixed(2)})`);
      }
      
      // 3. Check recurring expenses
      const { checkAndProcessRecurringExpenses } = await import('../../services/backgroundTasks/recurringExpenseTask');
      const recurringResult = await checkAndProcessRecurringExpenses(currentAccountId);
      
      if (recurringResult.processed > 0) {
        notifications.push(`🔄 Recurring: ${recurringResult.processed} processed (-${recurringResult.totalAmount.toFixed(2)})`);
      }
      
      // 4. Check goals
      const { checkAndCompleteGoals } = await import('../../services/backgroundTasks/goalTask');
      const goalResult = await checkAndCompleteGoals(currentAccountId);
      
      if (goalResult.completed.length > 0) {
        const goalNames = goalResult.completed.map(g => g.name).join(', ');
        notifications.push(`🎯 Goals Completed: ${goalNames}`);
      }
      
      // Show combined notification if any updates
      if (notifications.length > 0) {
        Alert.alert(
          '🔔 Updates',
          notifications.join('\n\n'),
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('[Dashboard] Background tasks check error:', error);
    }
  };

  const loadDashboardData = async (silent = false) => {
    if (!currentAccountId) {
      console.log('[Dashboard] No currentAccountId, skipping load');
      return;
    }

    if (!silent) {
      // Only show refreshing indicator for manual refresh
      setRefreshing(true);
    }

    console.log('[Dashboard] Loading dashboard data for account:', currentAccountId);

    // Recalculate balance from actual transactions
    await recalculateBalance();

    // Get fresh balance from store after recalculation
    const { balances: freshBalances } = useAccountStore.getState();
    const balance = freshBalances[currentAccountId] || {
      mainBalance: 0,
      savingsBalance: 0,
      heldBalance: 0,
      totalBalance: 0,
      availableBalance: 0,
    };
    setCurrentBalance(balance);
    console.log('[Dashboard] Current balance set:', balance);

    // Get account currency
    try {
      const { AccountRepository } = await import('../../database/repositories/AccountRepository');
      const accountRepo = new AccountRepository();
      const account = await accountRepo.findById(currentAccountId);
      if (account) {
        setAccountCurrency(account.currency);
        console.log('[Dashboard] Account currency:', account.currency);
      }
    } catch (error) {
      console.error('[Dashboard] Failed to load account currency:', error);
    }

    // Load all data
    await Promise.all([
      loadRecentTransactions(),
      loadChartData(),
      loadMonthlyData(),
      loadCategorySpend(),
      loadGoalsAndDebts(),
      loadDashboardStats(),
    ]);

    console.log('[Dashboard] Dashboard data loading complete');

    if (isInitialLoad) {
      setIsInitialLoad(false);
    }

    // Fade back in smoothly after data loads
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    if (!silent) {
      setRefreshing(false);
    }
  };

  const recalculateBalance = async () => {
    if (!currentAccountId) return;

    try {
      console.log('[Dashboard] Recalculating balance from transactions...');

      // Get all transactions for this account
      const allTransactions = await transactionRepo.findByAccount(currentAccountId);

      // Calculate balances by vault type
      let mainBalance = 0;
      let savingsBalance = 0;
      let heldBalance = 0;

      allTransactions.forEach((transaction) => {
        // Use converted amount if available, otherwise use regular amount
        const amount = transaction.convertedAmount || transaction.amount;
        const multiplier = transaction.type === 'income' ? 1 : -1;
        const calculatedAmount = amount * multiplier;

        if (transaction.vaultType === 'main') {
          mainBalance += calculatedAmount;
        } else if (transaction.vaultType === 'savings') {
          savingsBalance += calculatedAmount;
        } else if (transaction.vaultType === 'held') {
          heldBalance += calculatedAmount;
        }
      });

      const totalBalance = mainBalance + savingsBalance + heldBalance;
      const availableBalance = mainBalance + savingsBalance;

      console.log('[Dashboard] Calculated balances:', {
        main: mainBalance,
        savings: savingsBalance,
        held: heldBalance,
        total: totalBalance,
      });

      // Update the account store with recalculated balances
      const { updateBalance } = useAccountStore.getState();
      updateBalance(currentAccountId, {
        mainBalance,
        savingsBalance,
        heldBalance,
        totalBalance,
        availableBalance,
      });

      console.log('[Dashboard] Balance updated in store');
    } catch (error) {
      console.error('[Dashboard] Error recalculating balance:', error);
    }
  };

  const loadRecentTransactions = async () => {
    if (!currentAccountId || !currentUser) return;

    try {
      const transactions = await transactionRepo.findByAccount(currentAccountId, 5);
      console.log('[Dashboard] Loaded transactions count:', transactions.length);

      const categories = await categoryRepo.findByUser(currentUser.id);
      console.log('[Dashboard] Loaded categories count:', categories.length);

      const categoryMap = new Map(categories.map(cat => [cat.id, cat]));

      const transactionsWithCategories: TransactionWithCategory[] = transactions
        .map(transaction => ({
          ...transaction,
          category: categoryMap.get(transaction.categoryId)!,
        }))
        .filter(t => t.category);

      console.log('[Dashboard] Transactions with categories:', transactionsWithCategories.length);
      setRecentTransactions(transactionsWithCategories);
    } catch (error) {
      console.error('[Dashboard] Error loading recent transactions:', error);
    }
  };

  const loadChartData = async () => {
    if (!currentAccountId) return;

    try {
      const today = endOfDay(new Date());
      const sevenDaysAgo = startOfDay(subDays(new Date(), 6));

      console.log('[Dashboard] Loading chart data from', format(sevenDaysAgo, 'MMM d'), 'to', format(today, 'MMM d HH:mm'));

      const transactions = await transactionRepo.findByDateRange(
        currentAccountId,
        sevenDaysAgo.getTime(),
        today.getTime()
      );

      console.log('[Dashboard] Found', transactions.length, 'transactions in date range');

      // Initialize all 7 days with zero values
      const dataByDay = new Map<string, { income: number; expense: number }>();
      for (let i = 0; i < 7; i++) {
        const day = startOfDay(subDays(new Date(), 6 - i));
        const dayKey = format(day, 'MMM d');
        dataByDay.set(dayKey, { income: 0, expense: 0 });
      }

      // Aggregate transactions by type
      transactions.forEach(transaction => {
        const dayKey = format(new Date(transaction.date), 'MMM d');
        const current = dataByDay.get(dayKey);
        // Use converted amount if available
        const amount = transaction.convertedAmount || transaction.amount;

        if (current) {
          if (transaction.type === 'income') {
            current.income += amount;
          } else if (transaction.type === 'expense') {
            current.expense += amount;
          }
        }
      });

      // Convert to array format
      const chartDataArray: ChartDataPoint[] = Array.from(dataByDay.entries()).map(
        ([day, amounts]) => ({
          day,
          income: amounts.income,
          expense: amounts.expense,
        })
      );

      console.log('[Dashboard] Chart data:', chartDataArray);
      setChartData(chartDataArray);
    } catch (error) {
      console.error('[Dashboard] Error loading chart data:', error);
    }
  };

  const loadMonthlyData = async () => {
    if (!currentAccountId) return;
    try {
      const result: MonthDataPoint[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(new Date(), i);
        const start = startOfMonth(monthDate).getTime();
        const end = endOfMonth(monthDate).getTime();
        const txns = await transactionRepo.findByDateRange(currentAccountId, start, end);
        let income = 0, expense = 0;
        txns.forEach(t => {
          const amt = t.convertedAmount || t.amount;
          if (t.type === 'income') income += amt;
          else expense += amt;
        });
        result.push({ month: format(monthDate, 'MMM'), income, expense });
      }
      setMonthlyData(result);
    } catch (e) {
      console.error('[Dashboard] loadMonthlyData error:', e);
    }
  };

  const loadCategorySpend = async () => {
    if (!currentAccountId || !currentUser) return;
    try {
      const start = startOfMonth(new Date()).getTime();
      const end = endOfMonth(new Date()).getTime();
      const txns = await transactionRepo.findByDateRange(currentAccountId, start, end);
      const categories = await categoryRepo.findByUser(currentUser.id);
      const catMap = new Map(categories.map(c => [c.id, c]));
      const spendMap = new Map<string, { name: string; amount: number; color: string }>();
      let total = 0;
      txns.filter(t => t.type === 'expense').forEach(t => {
        const amt = t.convertedAmount || t.amount;
        const cat = catMap.get(t.categoryId);
        if (!cat) return;
        const existing = spendMap.get(cat.id);
        if (existing) existing.amount += amt;
        else spendMap.set(cat.id, { name: cat.name, amount: amt, color: cat.color });
        total += amt;
      });
      const sorted = Array.from(spendMap.values()).sort((a, b) => b.amount - a.amount);
      setCategorySpend(sorted);
      setTotalMonthSpend(total);
    } catch (e) {
      console.error('[Dashboard] loadCategorySpend error:', e);
    }
  };

  const loadGoalsAndDebts = async () => {
    if (!currentAccountId) return;

    try {
      const goals = await goalRepo.getActiveGoals(currentAccountId);

      // Recalculate each goal's progress from current balance (same logic as GoalsScreen)
      const { balances: freshBalances } = useAccountStore.getState();
      const balance = freshBalances[currentAccountId] || {
        mainBalance: 0, savingsBalance: 0, heldBalance: 0,
        totalBalance: 0, availableBalance: 0,
      };
      for (const goal of goals) {
        const newProgress = calculateGoalProgress(goal, balance);
        if (newProgress !== goal.currentAmount) {
          await goalRepo.updateProgress(goal.id, newProgress);
          goal.currentAmount = newProgress;
        }
      }

      const allDebts = await debtRepo.findByAccount(currentAccountId);
      const debts = allDebts.filter(debt => (debt.amountPaid || 0) < debt.amount);

      setActiveGoals(goals);
      setActiveDebts(debts);
    } catch (error) {
      console.error('[Dashboard] Error loading goals and debts:', error);
    }
  };

  const loadDashboardStats = async () => {
    if (!currentAccountId || !currentUser) return;

    try {
      // Get goals count
      const goalsData = await goalRepo.getGoalsCount(currentAccountId);
      setGoalsCount(goalsData);

      // Get debts stats
      const debtsData = await debtRepo.getDebtStats(currentAccountId);
      setDebtsStats(debtsData);

      // Get subscriptions count
      const subscriptionRepo = new SubscriptionRepository();
      const subscriptions = await subscriptionRepo.findActiveByAccount(currentAccountId);
      setSubscriptionsCount(subscriptions.length);

      // Get categories count
      const categories = await categoryRepo.findByUser(currentUser.id);
      setCategoriesCount(categories.length);

      // Get recurring expenses count
      const recurringRepo = new RecurringExpenseRepository();
      const recurringExpenses = await recurringRepo.findActiveByAccount(currentAccountId);
      setRecurringCount(recurringExpenses.length);
    } catch (error) {
      console.error('[Dashboard] Error loading dashboard stats:', error);
    }
  };

  const handleRefresh = async () => {
    await loadDashboardData(false);
  };

  const handleNotificationsPress = () => {
    // TODO: Navigate to notifications screen or show notifications
    Alert.alert('Notifications', 'No new notifications');
  };

  const handleScroll = (event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const scrollDiff = currentScrollY - lastScrollY.current;

    // Hide header when scrolling down, show when scrolling up
    if (scrollDiff > 5 && currentScrollY > 50) {
      // Scrolling down - hide header
      Animated.timing(headerTranslateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else if (scrollDiff < -5 || currentScrollY <= 50) {
      // Scrolling up or at top - show header
      Animated.timing(headerTranslateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    lastScrollY.current = currentScrollY;
  };

  return (
    <View style={styles.container}>
      {/* Animated Header */}
      <Animated.View
        style={[
          styles.headerContainer,
          {
            transform: [{ translateY: headerTranslateY }],
          },
        ]}
      >
        <DashboardHeader
          onNotificationsPress={handleNotificationsPress}
        />
      </Animated.View>

      {/* Main Content */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={themeColors.primary}
            />
          }
        >
          {/* Gradient Balance Card */}
          <GradientBalanceCard
            totalBalance={currentBalance.totalBalance}
            mainBalance={currentBalance.mainBalance}
            savingsBalance={currentBalance.savingsBalance}
            heldBalance={currentBalance.heldBalance}
            accountCurrency={accountCurrency}
          />

          {/* Action Buttons */}
          <ActionButtons />

          {/* Wealth Analytics */}
          <WealthAnalyticsCard
            data={chartData}
            activeTab={analyticsTab}
            onTabChange={setAnalyticsTab}
          />

          {/* Income vs Expense monthly bar chart */}
          <IncomeExpenseChart data={monthlyData} />

          {/* Spending donut + Goals progress side by side */}
          <View style={styles.chartsRow}>
            <SpendingDonutChart data={categorySpend} totalSpend={totalMonthSpend} />
            <GoalsProgressCard goals={activeGoals} />
          </View>

          {/* Dashboard Cards Grid */}
          <DashboardCardsGrid
            goalsCount={goalsCount}
            debtsStats={debtsStats}
            subscriptionsCount={subscriptionsCount}
            categoriesCount={categoriesCount}
            recurringCount={recurringCount}
            accountCurrency={accountCurrency}
          />

          {/* Recent Movements */}
          <MovementsList
            transactions={recentTransactions}
            accountCurrency={accountCurrency}
            onViewAll={() => navigation.navigate('TransactionHistory')}
            onTransactionPress={(transaction) =>
              navigation.navigate('TransactionDetails', { transactionId: transaction.id })
            }
          />
        </ScrollView>
      </Animated.View>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </View>
  );
};

const createStyles = (themeColors: ReturnType<typeof useThemeColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: themeColors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 80,
    paddingBottom: 100,
  },
  chartsRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    gap: 12,
    marginBottom: spacing.md,
  },
});
