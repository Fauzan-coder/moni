package expo.modules.moniandroid

import android.app.DatePickerDialog
import java.util.Calendar
import java.util.Locale
import expo.modules.kotlin.Promise
import expo.modules.kotlin.functions.Queues
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class MoniAndroidModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("MoniAndroid")
    AsyncFunction("pickDate") { initial: String, promise: Promise ->
      val activity = requireNotNull(appContext.currentActivity) { "Open Moni to choose a date." }
      val now = Calendar.getInstance()
      val parts = initial.split("-").mapNotNull { it.toIntOrNull() }
      val year = parts.getOrNull(0) ?: now.get(Calendar.YEAR)
      val month = (parts.getOrNull(1) ?: (now.get(Calendar.MONTH) + 1)) - 1
      val day = parts.getOrNull(2) ?: now.get(Calendar.DAY_OF_MONTH)
      val dialog = DatePickerDialog(activity, { _, y, m, d ->
        promise.resolve(String.format(Locale.US, "%04d-%02d-%02d", y, m + 1, d))
      }, year, month, day)
      dialog.setOnCancelListener { promise.resolve(null) }
      dialog.show()
    }.runOnQueue(Queues.MAIN)
    AsyncFunction("launchUPI") { uri: String ->
      val parsed = Uri.parse(uri)
      require(parsed.scheme == "upi" && parsed.host == "pay") { "Invalid UPI URI" }
      val context = requireNotNull(appContext.reactContext)
      val intent = Intent(Intent.ACTION_VIEW, parsed)
      require(intent.resolveActivity(context.packageManager) != null) { "No UPI payment app installed. Install a trusted UPI app, or add this payment manually." }
      val chooser = Intent.createChooser(intent, "Pay with your UPI app").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(chooser)
      true
    }
    Function("notificationAccess") {
      val context = requireNotNull(appContext.reactContext)
      val enabled = Settings.Secure.getString(context.contentResolver, "enabled_notification_listeners") ?: ""
      enabled.split(":").any { it.startsWith(context.packageName + "/") }
    }
    Function("openNotificationSettings") {
      val context = requireNotNull(appContext.reactContext)
      context.startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }
    Function("setDetection") { enabled: Boolean ->
      val context = requireNotNull(appContext.reactContext)
      context.getSharedPreferences("moni_detection",0).edit().putBoolean("enabled",enabled).apply()
      if (!enabled) CandidateStore.clear(context)
    }
    AsyncFunction("getCandidates") {
      val context = requireNotNull(appContext.reactContext)
      CandidateStore.read(context).let { data ->
        (0 until data.length()).map { i ->
          val item=data.getJSONObject(i)
          mapOf("key" to item.getString("key"),"packageName" to item.getString("packageName"),"text" to item.getString("text"),"timestamp" to item.getLong("timestamp"))
        }
      }
    }
    Function("dismissCandidate") { key: String -> CandidateStore.dismiss(requireNotNull(appContext.reactContext),key) }
    Function("clearCandidates") { CandidateStore.clear(requireNotNull(appContext.reactContext)) }
  }
}
