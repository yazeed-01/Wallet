package com.wallet.widgets

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context

/**
 * Wallet Widget Provider - Vertical Medium
 * Provides vertical layout for quick actions
 */
class WalletWidgetVerticalMediumProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        // Update all widget instances using the shared update method
        for (appWidgetId in appWidgetIds) {
            WalletWidgetProvider.updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onEnabled(context: Context) {
        android.util.Log.d("WalletWidgetV-Medium", "Widget enabled")
    }

    override fun onDisabled(context: Context) {
        android.util.Log.d("WalletWidgetV-Medium", "Widget disabled")
    }
}
