import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';
const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
export const googleConfigured = !!webClientId;
let configured=false;
function configure(){if(!googleConfigured) throw new Error('Google Drive is not configured in this build. Your data stays safely on this device. See the setup guide for the publisher’s one-time OAuth setup.');if(!configured){GoogleSignin.configure({webClientId,scopes:['https://www.googleapis.com/auth/drive.appdata'],offlineAccess:false}); configured=true;}}
export async function connectGoogle(){configure();await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog:true});const result=await GoogleSignin.signIn();if(!isSuccessResponse(result)) throw new Error('Sign-in cancelled. You can continue offline.');return result.data.user.email;}
export async function accessToken(){configure();const result=await GoogleSignin.signInSilently();if(result.type !== 'success')throw new Error('Reconnect Google Drive to continue syncing.');return (await GoogleSignin.getTokens()).accessToken;}
export async function disconnectGoogle(){configure();await GoogleSignin.signOut();}
