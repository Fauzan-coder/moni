/** Show actionable reasons without displaying tokens, request URLs or raw server data. */
export function driveErrorMessage(status:number,payload:unknown):string {
 const error=(payload as any)?.error;
 const reasons=new Set<string>([
  ...(Array.isArray(error?.errors)?error.errors.map((e:any)=>e?.reason):[]),
  ...(Array.isArray(error?.details)?error.details.map((e:any)=>e?.reason):[]),
 ].filter((r:unknown):r is string=>typeof r==='string'));
 const safe=' Your local data is safe.';
 if(status===401)return 'Google session expired. Disconnect and reconnect Google Drive.'+safe;
 if(reasons.has('accessNotConfigured')||reasons.has('SERVICE_DISABLED'))return 'Google Drive API is disabled or has not been used in this Google Cloud project. Enable Google Drive API in the project that owns Moni’s OAuth clients, wait a few minutes, then tap Sync now.'+safe;
 if(reasons.has('insufficientPermissions')||reasons.has('ACCESS_TOKEN_SCOPE_INSUFFICIENT'))return 'Google Drive permission is missing. Disconnect and reconnect Drive, and allow Moni’s private app storage permission (drive.appdata).'+safe;
 if(reasons.has('domainPolicy'))return 'Your Google Workspace administrator blocks Drive apps. Ask your administrator or connect a personal Google account.'+safe;
 if(reasons.has('storageQuotaExceeded'))return 'Your Google Drive storage is full. Free space in Drive and tap Sync now.'+safe;
 if(status===429||reasons.has('rateLimitExceeded')||reasons.has('userRateLimitExceeded')||reasons.has('dailyLimitExceeded'))return 'Google Drive’s request limit was reached. Wait and try Sync now later.'+safe;
 if(status===403){const known=['insufficientFilePermissions','appNotAuthorizedToFile','notSupportedForAppDataFolderFiles'].find(r=>reasons.has(r));return `Google Drive denied access (403${known?': '+known:''}). Check that Drive API is enabled in the OAuth project and reconnect with private app storage permission.`+safe;}
 return `Drive could not sync (${status}). Try Sync now later.`+safe;
}
