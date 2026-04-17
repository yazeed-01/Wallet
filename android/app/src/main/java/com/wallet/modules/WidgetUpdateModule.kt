package com.wallet.modules

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.wallet.widgets.WalletWidgetProvider

/**
 * Native module to trigger Android widget updates from JavaScript
 * This allows immediate widget refresh after balance changes
 */
class WidgetUpdateModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return NAME
    }

    /**
     * Trigger update for all wallet widgets
     * Called from JavaScript after balance changes
     */
    @ReactMethod
    fun updateWidgets() {
        try {
            val context = reactApplicationContext
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val widgetIds = appWidgetManager.getAppWidgetIds(
                ComponentName(context, WalletWidgetProvider::class.java)
            )

            if (widgetIds.isNotEmpty()) {
                // Create broadcast intent to update widgets
                val intent = Intent(context, WalletWidgetProvider::class.java)
                intent.action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, widgetIds)

                context.sendBroadcast(intent)
                android.util.Log.d(TAG, "Widget update broadcast sent for ${widgetIds.size} widgets")
            } else {
                android.util.Log.d(TAG, "No widgets to update")
            }
        } catch (e: Exception) {
            android.util.Log.e(TAG, "Failed to trigger widget update", e)
        }
    }

    companion object {
        const val NAME = "WidgetUpdate"
        private const val TAG = "WidgetUpdateModule"
    }
}
