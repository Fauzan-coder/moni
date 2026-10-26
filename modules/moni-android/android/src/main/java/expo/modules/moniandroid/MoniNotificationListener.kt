package expo.modules.moniandroid

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import org.json.JSONObject

class MoniNotificationListener : NotificationListenerService() {
  private val supported = setOf("com.google.android.apps.nbu.paisa.user", "com.phonepe.app", "net.one97.paytm", "com.snapwork.hdfc", "com.sbi.lotusintouch")
  override fun onNotificationPosted(sbn: StatusBarNotification) {
    if (!getSharedPreferences("moni_detection",0).getBoolean("enabled",false) || sbn.packageName !in supported) return
    val extras=sbn.notification.extras
    val text=listOf(extras.getCharSequence(Notification.EXTRA_TITLE), extras.getCharSequence(Notification.EXTRA_BIG_TEXT) ?: extras.getCharSequence(Notification.EXTRA_TEXT)).filterNotNull().joinToString(" ").take(1500)
    if (Regex("(?i)\\b(otp|one.time|verification|password|pin)\\b").containsMatchIn(text)) return
    if (!Regex("(?i)(₹|INR|Rs\\.?)\\s*[0-9]").containsMatchIn(text) || !Regex("(?i)\\b(debited|credited|paid|received|sent)\\b").containsMatchIn(text)) return
    CandidateStore.add(this,JSONObject().put("key",sbn.key + ":" + text.hashCode()).put("packageName",sbn.packageName).put("text",text).put("timestamp",sbn.postTime))
  }
}
