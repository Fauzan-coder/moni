import { initialSettings, Settings, Transaction } from '../model';
import {driveErrorMessage} from './driveErrors';
import {parseArchive} from '../journal';
import { accessToken } from './google';
import { getMeta, putDocuments, readDocuments, setMeta } from './storage';
const BASE='https://www.googleapis.com/drive/v3/files';
let running: Promise<number> | null=null;
type DriveFile={id:string;name:string};
async function request(url:string,token:string,init:RequestInit={}) {
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),30000);
  let response:Response;try{response=await fetch(url,{...init,headers:{Authorization:`Bearer ${token}`,...init.headers},signal:controller.signal});}finally{clearTimeout(timer);}
  if(!response.ok){let detail:unknown;try{detail=await response.json();}catch{}throw new Error(driveErrorMessage(response.status,detail));}
  return response;
}
async function list(token:string) {
  let pageToken:string|undefined; const files:DriveFile[]=[];
  do {const query=new URLSearchParams({spaces:'appDataFolder',q:"trashed = false and name contains 'moni-v1-'",fields:'nextPageToken,files(id,name)',pageSize:'1000',...(pageToken?{pageToken}:{})});const data=await(await request(`${BASE}?${query}`,token)).json();files.push(...data.files);pageToken=data.nextPageToken;}while(pageToken);
  return files;
}
export function syncDrive():Promise<number> {
  if(running)return running;
  running=(async()=>{
    const settings=await getMeta<Settings>('settings',initialSettings);
    if(!settings.driveEmail)throw new Error('Connect Google Drive first.');
    const token=await accessToken(); const files=await list(token); const local=await readDocuments();
    const known=new Set(local.map(t=>`moni-v1-${t.revision}.json`));
    for(const f of files)if(!known.has(f.name)) {
      const response=await request(`${BASE}/${encodeURIComponent(f.id)}?alt=media`,token);
      const raw=await response.text(); if(raw.length>2000000)throw new Error('A Drive document is too large. Sync stopped safely.');
      const revisions=parseArchive(raw);await putDocuments(revisions);known.add(f.name);
    }
    const remote=new Set(files.map(f=>f.name));
    // One immutable file per revision. Concurrent devices never overwrite each other.
    for(const t of await readDocuments()) {
      const name=`moni-v1-${t.revision}.json`;if(remote.has(name) || t.source==='sample') continue;
      const boundary='moni_revision_boundary';
      const body=`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({name,parents:['appDataFolder']})}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify({schema:2,revisions:[t]})}\r\n--${boundary}--`;
      await request('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',token,{method:'POST',headers:{'Content-Type':`multipart/related; boundary=${boundary}`},body});remote.add(name);
    }
    const when=Date.now();const fresh=await getMeta<Settings>('settings',initialSettings);
    if(fresh.driveEmail===settings.driveEmail)await setMeta('settings',{...fresh,lastSync:when});return when;
  })().finally(()=>{running=null;});return running;
}
export async function deleteDriveData(){if(running)await running;const token=await accessToken();for(const file of await list(token))await request(`${BASE}/${encodeURIComponent(file.id)}`,token,{method:'DELETE'});}

export async function waitForSync(){if(running)await running.catch(()=>{});}
