package com.wallet.widgets

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context

/**
 * Wallet Widget Provider - Horizontal Small
 * Provides horizontal layout for quick actions
 */
class WalletWidgetHorizontalSmallProvider : AppWidgetProvider() {

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
        android.util.Log.d("WalletWidgetH-Small", "Widget enabled")
    }

    override fun onDisabled(context: Context) {
        android.util.Log.d("WalletWidgetH-Small", "Widget disabled")
    }
}
