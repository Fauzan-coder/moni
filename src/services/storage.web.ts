import {Transaction} from '../model';
import {JournalDocument,isTransaction} from '../journal';
const prefix = 'moni-preview:';
// Browser preview only. Android uses SQLCipher and a Keystore-backed key.
export async function readDocuments():Promise<JournalDocument[]> {return JSON.parse(localStorage.getItem(prefix+'revisions')||'[]');}
let writes=Promise.resolve();
export function putDocuments(ts:JournalDocument[]){const work=writes.then(async()=>{const all=await readDocuments();const ids=new Set(all.map(t=>t.revision));localStorage.setItem(prefix+'revisions',JSON.stringify([...all,...ts.filter(t=>!ids.has(t.revision))]));});writes=work.catch(()=>{});return work;}
export async function readRevisions():Promise<Transaction[]>{return (await readDocuments()).filter(isTransaction);}
export function putRevisions(ts:Transaction[]){return putDocuments(ts);}
export async function getMeta<T>(key:string,fallback:T):Promise<T> {const v=localStorage.getItem(prefix+key);return v?JSON.parse(v):fallback;}
export async function setMeta(key:string,value:unknown){localStorage.setItem(prefix+key,JSON.stringify(value));}
export async function clearStorage(){Object.keys(localStorage).filter(k=>k.startsWith(prefix)).forEach(k=>localStorage.removeItem(k));}
