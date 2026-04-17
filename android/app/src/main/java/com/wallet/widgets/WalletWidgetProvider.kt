package com.wallet.widgets

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews
import com.wallet.R

/**
 * Wallet Widget Provider - Displays quick action buttons
 * Provides buttons to add income/expense
 */
class WalletWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        // Update all widget instances
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onEnabled(context: Context) {
        // Widget first added to home screen
        android.util.Log.d(TAG, "Widget enabled")
    }

    override fun onDisabled(context: Context) {
        // Last widget removed from home screen
        android.util.Log.d(TAG, "Widget disabled")
    }

    companion object {
        private const val TAG = "WalletWidgetProvider"

        /**
         * Update a single widget instance
         */
        internal fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            try {
                // Create RemoteViews for widget layout
                val views = RemoteViews(context.packageName, R.layout.wallet_widget)

                // Set button click intents
                views.setOnClickPendingIntent(
                    R.id.btn_income,
                    createDeepLinkIntent(context, "income")
                )
                views.setOnClickPendingIntent(
                    R.id.btn_expense,
                    createDeepLinkIntent(context, "expense")
                )

                // Update widget
                appWidgetManager.updateAppWidget(appWidgetId, views)
                android.util.Log.d(TAG, "Widget updated")

            } catch (e: Exception) {
                android.util.Log.e(TAG, "Failed to update widget", e)
            }
        }

        /**
         * Create PendingIntent for deep link navigation
         */
        private fun createDeepLinkIntent(context: Context, type: String): PendingIntent {
            val intent = Intent(Intent.ACTION_VIEW).apply {
                data = Uri.parse("wallet://add-transaction?type=$type")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }

            return PendingIntent.getActivity(
                context,
                type.hashCode(), // Use type as request code to differentiate intents
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
        }
    }
}
