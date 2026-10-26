export const googleConfigured=false;
export async function connectGoogle():Promise<string>{throw new Error('Google sign-in is available in the Android app. This browser preview keeps data on this browser only.');}
export async function accessToken():Promise<string>{throw new Error('Open the Android app to use Google Drive.');}
export async function disconnectGoogle(){}
