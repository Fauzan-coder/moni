export default {
  expo: {
    name: 'Moni', icon: './assets/icon.png', slug: 'moni', version: '1.0.0', orientation: 'portrait',
    userInterfaceStyle: 'light', scheme: 'moni',
    android: {package: 'in.moni.expenses', permissions: ['android.permission.CAMERA'], blockedPermissions: ['android.permission.RECORD_AUDIO','android.permission.READ_SMS','android.permission.RECEIVE_SMS','android.permission.READ_EXTERNAL_STORAGE','android.permission.WRITE_EXTERNAL_STORAGE','android.permission.SYSTEM_ALERT_WINDOW','android.permission.USE_BIOMETRIC','android.permission.USE_FINGERPRINT'], allowBackup: false},
    plugins: [
      ['expo-camera', {cameraPermission:'Allow Moni to scan a merchant UPI QR code.',recordAudioAndroid:false}],
      ['expo-sqlite',{useSQLCipher:true}], 'expo-secure-store',
      '@react-native-google-signin/google-signin',
    ],
    web: {favicon:'./assets/icon.png',name:'Moni — a little clarity for your money', bundler:'metro'},
    experiments: {autolinkingModuleResolution:true}
  }
};
