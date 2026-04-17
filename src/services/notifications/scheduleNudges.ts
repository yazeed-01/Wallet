/**
 * Purpose: Schedule and manage smart daily nudge notifications
 * 
 * Inputs:
 *   - None (uses settings from store)
 * 
 * Outputs:
 *   - Returns (Promise<void>): Completes when nudge is scheduled
 * 
 * Side effects:
 *   - Schedules daily notification at configured time
 *   - Generates dynamic nudge messages
 */

import notifee, { TimestampTrigger, TriggerType, RepeatFrequency } from '@notifee/react-native';
import { useSettingsStore } from '../../store/settingsStore';
import { CHANNEL_IDS, checkNotificationPermission } from './notificationService';

// ============================================
// Nudge Messages Pool
// ============================================

const NUDGE_MESSAGES = [
  "Don't forget to track your spending today! 💰",
  'Time to check your expenses and stay on budget 📊',
  'Quick reminder: Log any transactions you made today 📝',
  'Keep your wallet organized - add transactions now 🎯',
  'Stay on top of your finances! Review your spending 💪',
  'A few minutes today keeps the money worries away 🌟',
  "Your future self will thank you for tracking expenses now 🚀",
  'Financial discipline starts with daily tracking 💡',
  'Take control of your money - log your expenses ✨',
  "Consistency is key! Don't skip today's update 🔑",
];

// ============================================
// Get Random Nudge Message
// ============================================

/**
 * Purpose: Select a random motivational nudge message
 * 
 * Inputs: None
 * 
 * Outputs:
 *   - Returns (string): Random nudge message
 * 
 * Side effects: None
 */
function getRandomNudgeMessage(): string {
  const randomIndex = Math.floor(Math.random() * NUDGE_MESSAGES.length);
  return NUDGE_MESSAGES[randomIndex];
}

// ============================================
// Schedule Daily Nudge
// ============================================

/**
 * Purpose: Schedule a daily notification at configured time
 * 
 * Inputs: None
 * 
 * Outputs:
 *   - Returns (Promise<void>): Completes when nudge is scheduled
 * 
 * Side effects:
 *   - Creates daily repeating notification trigger
 *   - Uses time from settings store
 */
export async function scheduleDailyNudge(): Promise<void> {
  try {
    const hasPermission = await checkNotificationPermission();
    if (!hasPermission) {
      console.log('[ScheduleNudges] No notification permission');
      return;
    }

    const settingsStore = useSettingsStore.getState();
    const { notificationSettings } = settingsStore;

    // Check if nudges are enabled
    if (!notificationSettings.nudgesEnabled) {
      console.log('[ScheduleNudges] Nudges are disabled');
      await cancelDailyNudge();
      return;
    }

    // Parse nudge time (format: "HH:MM")
    const [hours, minutes] = notificationSettings.nudgeTime.split(':').map(Number);

    // Create trigger for daily notification
    const now = new Date();
    const triggerDate = new Date();
    triggerDate.setHours(hours, minutes, 0, 0);

    // If time has passed today, schedule for tomorrow
    if (triggerDate <= now) {
      triggerDate.setDate(triggerDate.getDate() + 1);
    }

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: triggerDate.getTime(),
      repeatFrequency: RepeatFrequency.DAILY,
    };

    // Schedule notification with random message
    await notifee.createTriggerNotification(
      {
        id: 'daily-nudge',
        title: '💡 Daily Reminder',
        body: getRandomNudgeMessage(),
        android: {
          channelId: CHANNEL_IDS.REMINDERS,
          pressAction: {
            id: 'default',
          },
        },
        ios: {
          sound: 'default',
        },
      },
      trigger
    );

    console.log(
      `[ScheduleNudges] Daily nudge scheduled for ${notificationSettings.nudgeTime}`
    );
  } catch (error) {
    console.error('[ScheduleNudges] Failed to schedule daily nudge:', error);
  }
}

// ============================================
// Cancel Daily Nudge
// ============================================

/**
 * Purpose: Cancel the scheduled daily nudge notification
 * 
 * Inputs: None
 * 
 * Outputs:
 *   - Returns (Promise<void>): Completes when nudge is cancelled
 * 
 * Side effects:
 *   - Removes daily nudge notification trigger
 */
export async function cancelDailyNudge(): Promise<void> {
  try {
    await notifee.cancelNotification('daily-nudge');
    console.log('[ScheduleNudges] Daily nudge cancelled');
  } catch (error) {
    console.error('[ScheduleNudges] Failed to cancel daily nudge:', error);
  }
}

// ============================================
// Reschedule Daily Nudge
// ============================================

/**
 * Purpose: Update the scheduled nudge with new time or message
 * 
 * Inputs: None
 * 
 * Outputs:
 *   - Returns (Promise<void>): Completes when nudge is rescheduled
 * 
 * Side effects:
 *   - Cancels existing nudge and creates new one
 */
export async function rescheduleDailyNudge(): Promise<void> {
  await cancelDailyNudge();
  await scheduleDailyNudge();
  console.log('[ScheduleNudges] Daily nudge rescheduled');
}

// ============================================
// Schedule Periodic Nudges (every 4 hours)
// ============================================

const PERIODIC_NUDGE_IDS = [
  'periodic-nudge-0',
  'periodic-nudge-4',
  'periodic-nudge-8',
  'periodic-nudge-12',
  'periodic-nudge-16',
  'periodic-nudge-20',
];

const PERIODIC_NUDGE_HOURS = [0, 4, 8, 12, 16, 20];

export async function schedulePeriodicNudges(): Promise<void> {
  try {
    const hasPermission = await checkNotificationPermission();
    if (!hasPermission) return;

    const settingsStore = useSettingsStore.getState();
    if (!settingsStore.notificationSettings.periodicNudgesEnabled) {
      await cancelPeriodicNudges();
      return;
    }

    const now = new Date();

    for (let i = 0; i < PERIODIC_NUDGE_HOURS.length; i++) {
      const hour = PERIODIC_NUDGE_HOURS[i];
      const triggerDate = new Date();
      triggerDate.setHours(hour, 0, 0, 0);

      if (triggerDate <= now) {
        triggerDate.setDate(triggerDate.getDate() + 1);
      }

      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: triggerDate.getTime(),
        repeatFrequency: RepeatFrequency.DAILY,
      };

      await notifee.createTriggerNotification(
        {
          id: PERIODIC_NUDGE_IDS[i],
          title: '💡 Finance Reminder',
          body: getRandomNudgeMessage(),
          android: {
            channelId: CHANNEL_IDS.REMINDERS,
            pressAction: { id: 'default' },
          },
          ios: { sound: 'default' },
        },
        trigger
      );
    }

    console.log('[ScheduleNudges] Periodic nudges scheduled every 4 hours');
  } catch (error) {
    console.error('[ScheduleNudges] Failed to schedule periodic nudges:', error);
  }
}

export async function cancelPeriodicNudges(): Promise<void> {
  try {
    for (const id of PERIODIC_NUDGE_IDS) {
      await notifee.cancelNotification(id);
    }
    console.log('[ScheduleNudges] Periodic nudges cancelled');
  } catch (error) {
    console.error('[ScheduleNudges] Failed to cancel periodic nudges:', error);
  }
}

// ============================================
// Schedule Subscription Reminder
// ============================================

/**
 * Purpose: Schedule reminder for upcoming subscription charge
 * 
 * Inputs:
 *   - subscriptionId (string): ID of subscription
 *   - name (string): Subscription name
 *   - amount (number): Amount to be charged
 *   - daysUntil (number): Days until charge (1-3)
 * 
 * Outputs:
 *   - Returns (Promise<void>): Completes when reminder is scheduled
 * 
 * Side effects:
 *   - Creates notification trigger for future date
 */
export async function scheduleSubscriptionReminder(
  subscriptionId: string,
  name: string,
  amount: number,
  daysUntil: number
): Promise<void> {
  try {
    const hasPermission = await checkNotificationPermission();
    if (!hasPermission) return;

    const settingsStore = useSettingsStore.getState();
    const { notificationSettings } = settingsStore;

    if (!notificationSettings.subscriptionReminders) {
      console.log('[ScheduleNudges] Subscription reminders disabled');
      return;
    }

    // Calculate trigger time
    const triggerDate = new Date();
    triggerDate.setDate(triggerDate.getDate() + daysUntil);
    triggerDate.setHours(9, 0, 0, 0); // 9 AM reminder

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: triggerDate.getTime(),
    };

    const dayText = daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`;

    await notifee.createTriggerNotification(
      {
        id: `subscription-reminder-${subscriptionId}`,
        title: '📅 Upcoming Subscription',
        body: `${name} ($${amount.toFixed(2)}) will be charged ${dayText}`,
        android: {
          channelId: CHANNEL_IDS.REMINDERS,
          color: '#118AB2',
          pressAction: {
            id: 'default',
          },
        },
        ios: {
          sound: 'default',
        },
      },
      trigger
    );

    console.log(
      `[ScheduleNudges] Subscription reminder scheduled for ${name} - ${daysUntil} days`
    );
  } catch (error) {
    console.error('[ScheduleNudges] Failed to schedule subscription reminder:', error);
  }
}

// ============================================
// Schedule Recurring Expense Reminder
// ============================================

/**
 * Purpose: Schedule reminder for upcoming recurring expense
 * 
 * Inputs:
 *   - recurringId (string): ID of recurring expense
 *   - name (string): Expense name
 *   - amount (number): Amount to be deducted
 *   - daysUntil (number): Days until charge
 * 
 * Outputs:
 *   - Returns (Promise<void>): Completes when reminder is scheduled
 * 
 * Side effects:
 *   - Creates notification trigger for future date
 */
export async function scheduleRecurringReminder(
  recurringId: string,
  name: string,
  amount: number,
  daysUntil: number
): Promise<void> {
  try {
    const hasPermission = await checkNotificationPermission();
    if (!hasPermission) return;

    const settingsStore = useSettingsStore.getState();
    const { notificationSettings } = settingsStore;

    if (!notificationSettings.recurringReminders) {
      console.log('[ScheduleNudges] Recurring reminders disabled');
      return;
    }

    // Calculate trigger time
    const triggerDate = new Date();
    triggerDate.setDate(triggerDate.getDate() + daysUntil);
    triggerDate.setHours(9, 0, 0, 0); // 9 AM reminder

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: triggerDate.getTime(),
    };

    const dayText = daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`;

    await notifee.createTriggerNotification(
      {
        id: `recurring-reminder-${recurringId}`,
        title: '⏰ Upcoming Recurring Expense',
        body: `${name} ($${amount.toFixed(2)}) will be charged ${dayText}`,
        android: {
          channelId: CHANNEL_IDS.REMINDERS,
          color: '#FF8B94',
          pressAction: {
            id: 'default',
          },
        },
        ios: {
          sound: 'default',
        },
      },
      trigger
    );

    console.log(
      `[ScheduleNudges] Recurring reminder scheduled for ${name} - ${daysUntil} days`
    );
  } catch (error) {
    console.error('[ScheduleNudges] Failed to schedule recurring reminder:', error);
  }
}
