import * as SQLite from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Transaction } from '../model';
import {JournalDocument,isTransaction} from '../journal';
let database: Promise<SQLite.SQLiteDatabase> | undefined;
async function db() {
  return database ??= (async()=> {
    let key = await SecureStore.getItemAsync('moni-db-key');
    if (!key) { key = Array.from(await Crypto.getRandomBytesAsync(32)).map(b=>b.toString(16).padStart(2,'0')).join(''); await SecureStore.setItemAsync('moni-db-key',key); }
    const d = await SQLite.openDatabaseAsync('moni.db');
    await d.execAsync(`PRAGMA key = '${key}';`);
    const cipher=await d.getFirstAsync<Record<string,string>>('PRAGMA cipher_version;');
    if(!cipher || !Object.values(cipher).some(Boolean))throw new Error('Encrypted storage is unavailable. Install the native Android build with SQLCipher enabled.');
    await d.execAsync(`PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000; CREATE TABLE IF NOT EXISTS revisions (id TEXT PRIMARY KEY NOT NULL, json TEXT NOT NULL); CREATE TABLE IF NOT EXISTS metadata (id TEXT PRIMARY KEY NOT NULL, json TEXT NOT NULL);`);
    return d;
  })();
}
export async function readDocuments(): Promise<JournalDocument[]> { return (await (await db()).getAllAsync<{json:string}>('SELECT json FROM revisions')).map(r=>JSON.parse(r.json)); }
let writes=Promise.resolve();
export function putDocuments(ts:JournalDocument[]){const work=writes.then(async()=>{const d=await db();await d.withTransactionAsync(async()=>{for(const t of ts)await d.runAsync('INSERT OR IGNORE INTO revisions (id,json) VALUES (?,?)',t.revision,JSON.stringify(t));});});writes=work.catch(()=>{});return work;}
export async function readRevisions():Promise<Transaction[]>{return (await readDocuments()).filter(isTransaction);}
export function putRevisions(ts:Transaction[]){return putDocuments(ts);}
export async function getMeta<T>(key:string, fallback:T):Promise<T> { const r=await (await db()).getFirstAsync<{json:string}>('SELECT json FROM metadata WHERE id=?',key); return r?JSON.parse(r.json):fallback; }
export async function setMeta(key:string, value:unknown) { await (await db()).runAsync('INSERT OR REPLACE INTO metadata (id,json) VALUES (?,?)',key,JSON.stringify(value)); }
export async function clearStorage() { await (await db()).execAsync('DELETE FROM revisions; DELETE FROM metadata; PRAGMA wal_checkpoint(TRUNCATE); VACUUM;'); }
