package expo.modules.moniandroid

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import org.json.JSONArray
import org.json.JSONObject

// Small, Keystore-encrypted review queue. No notification body leaves the device.
object CandidateStore {
  private fun key(): SecretKey {
    val store=KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
    (store.getKey("moni-alert-key",null) as? SecretKey)?.let { return it }
    return KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES,"AndroidKeyStore").apply {
      init(KeyGenParameterSpec.Builder("moni-alert-key",KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT).setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build())
    }.generateKey()
  }
  @Synchronized fun read(context: Context): JSONArray {
    val prefs=context.getSharedPreferences("moni_alerts",0)
    val raw=prefs.getString("queue",null) ?: return JSONArray()
    return try {
      val data=Base64.decode(raw,Base64.NO_WRAP)
      val cipher=Cipher.getInstance("AES/GCM/NoPadding")
      cipher.init(Cipher.DECRYPT_MODE,key(),GCMParameterSpec(128,data.copyOfRange(0,12)))
      val all=JSONArray(String(cipher.doFinal(data.copyOfRange(12,data.size)),Charsets.UTF_8))
      JSONArray().apply { for(i in 0 until all.length()) { val item=all.getJSONObject(i); if(System.currentTimeMillis()-item.getLong("timestamp") < 7L*24*60*60*1000) put(item) } }
    } catch (_: Exception) { prefs.edit().remove("queue").apply(); JSONArray() }
  }
  private fun write(context:Context, data:JSONArray) {
    val cipher=Cipher.getInstance("AES/GCM/NoPadding");cipher.init(Cipher.ENCRYPT_MODE,key())
    val encrypted=cipher.iv + cipher.doFinal(data.toString().toByteArray(Charsets.UTF_8))
    context.getSharedPreferences("moni_alerts",0).edit().putString("queue",Base64.encodeToString(encrypted,Base64.NO_WRAP)).apply()
  }
  @Synchronized fun add(context:Context,item:JSONObject) {
    val data=read(context);for(i in 0 until data.length())if(data.getJSONObject(i).getString("key")==item.getString("key"))return
    val trimmed=JSONArray();for(i in maxOf(0,data.length()-49) until data.length())trimmed.put(data.getJSONObject(i))
    trimmed.put(item);write(context,trimmed)
  }
  @Synchronized fun dismiss(context:Context,key:String) {
    val data=read(context);val kept=JSONArray();for(i in 0 until data.length())if(data.getJSONObject(i).getString("key")!=key)kept.put(data.getJSONObject(i));write(context,kept)
  }
  @Synchronized fun clear(context:Context) {context.getSharedPreferences("moni_alerts",0).edit().clear().apply()}
}
