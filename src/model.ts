export const categories = ['Food & drinks', 'Shopping', 'Transport', 'Bills', 'Health', 'Entertainment', 'Income', 'Other'] as const;
export const apps = ['Google Pay', 'PhonePe', 'Paytm', 'Bank app', 'Cash', 'Transfer'] as const;
export type Transaction = {
  id: string; revision: string; updatedAt: number; deletionGroup?: string; date: string; amount: number;
  type: 'expense' | 'income'; merchant: string; category: string; account: string;
  app: string; note: string; reference?: string; flow?: 'loan' | 'repayment'; loanId?: string; movementId?: string; deleted?: boolean; source: 'manual' | 'upi' | 'notification' | 'sample';
};
export type Draft = Omit<Transaction, 'id' | 'revision' | 'updatedAt'> & {id?: string};
export type Settings = {name: string; onboarded: boolean; driveEmail?: string; lastSync?: number; detection: boolean; demo: boolean; accounts?: string[]};
export type PendingPayment = {uri: string; merchant: string; amount: number; note: string; payee: string};
export const initialSettings: Settings = {name: '', onboarded: false, detection: false, demo: false};
export function uid() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}-${Math.random().toString(36).slice(2, 8)}`; }
export function localDate(d = new Date()) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
export function validateDraft(d: Draft) {
  if (['merchant','date','category','account','app','note'].some(k=>typeof d[k as keyof Draft] !== 'string') || (d.reference !== undefined && typeof d.reference !== 'string')) throw new Error('Transaction text fields must contain plain text.');
  if (!Number.isSafeInteger(d.amount) || d.amount <= 0 || d.amount > 1e12) throw new Error('Enter an amount between ₹0.01 and ₹10 billion.');
  if (!d.merchant.trim() || d.merchant.length > 160) throw new Error('Add a name, up to 160 characters.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date) || localDate(new Date(d.date+'T12:00:00')) !== d.date) throw new Error('Enter a valid date (YYYY-MM-DD).');
  if (!categories.includes(d.category as any) || (typeof d.account !== 'string' || !d.account.trim() || d.account.length > 60) || !apps.includes(d.app as any) || !['expense','income'].includes(d.type)) throw new Error('Choose a valid category, account and payment method.');
  if (d.note.length > 2000 || (d.reference?.length ?? 0) > 160) throw new Error('Note or reference is too long.');
}
export function validTransaction(x: unknown): x is Transaction {
  try { const t = x as Transaction; validateDraft(t); return typeof t.id === 'string' && t.id.length > 0 && t.id.length < 200 && typeof t.revision === 'string' && /^[a-zA-Z0-9-]{1,160}$/.test(t.revision) && Number.isSafeInteger(t.updatedAt) && t.updatedAt > 0 && ['manual','upi','notification','sample'].includes(t.source) && (t.deletionGroup === undefined || typeof t.deletionGroup === 'string' && t.deletionGroup.length < 200) && (t.flow === undefined || ['loan','repayment'].includes(t.flow)) && (t.loanId === undefined || typeof t.loanId === 'string' && t.loanId.length < 200) && (t.movementId === undefined || typeof t.movementId === 'string' && t.movementId.length < 200) && (t.deleted === undefined || typeof t.deleted === 'boolean'); } catch { return false; }
}
export function parseBackup(raw: string): Transaction[] {
  const x = JSON.parse(raw);
  if (x.schema !== 1 || !Array.isArray(x.revisions) || x.revisions.length > 100000 || !x.revisions.every(validTransaction)) throw new Error('This is not a valid Moni backup. Nothing was changed.');
  return x.revisions.map((t:Transaction)=>({id:t.id,revision:t.revision,updatedAt:t.updatedAt,date:t.date,amount:t.amount,type:t.type,merchant:t.merchant,category:t.category,account:t.account,app:t.app,note:t.note,source:t.source,...(t.reference?{reference:t.reference}:{}),...(t.deletionGroup?{deletionGroup:t.deletionGroup}:{}),...(t.flow?{flow:t.flow}:{}),...(t.loanId?{loanId:t.loanId}:{}),...(t.movementId?{movementId:t.movementId}:{}),...(t.deleted!==undefined?{deleted:t.deleted}:{})}));
}
export function latest(revisions: Transaction[]) {
  const map = new Map<string, Transaction>();
  for (const t of revisions) { const prev = map.get(t.id); if (!prev || t.updatedAt > prev.updatedAt || (t.updatedAt === prev.updatedAt && t.revision > prev.revision)) map.set(t.id, t); }
  return [...map.values()];
}
export function visible(revisions: Transaction[]) {
  // A shared bank reference identifies the same payment across manual/imported IDs.
  // Keep the latest version (including a deletion) while retaining all history.
  const entries = latest(revisions);const references = new Map<string, Transaction>();
  const withoutReference: Transaction[]=[];
  for(const t of entries){
    const ref=t.reference?.trim().toLowerCase();if(!ref){withoutReference.push(t);continue;}
    const key=`${t.type}:${ref}`;const prev=references.get(key);
    if(!prev || t.updatedAt>prev.updatedAt || (t.updatedAt===prev.updatedAt&&t.revision>prev.revision))references.set(key,t);
  }
  return [...withoutReference,...references.values()].filter(t=>!t.deleted).sort((a,b)=>b.date.localeCompare(a.date)||b.updatedAt-a.updatedAt);
}
export function duplicate(d: Draft, all: Transaction[]) {
  return all.find(t => t.id !== d.id && !t.deleted && (d.reference && t.reference ? d.reference.trim().toLowerCase() === t.reference.trim().toLowerCase() : t.amount === d.amount && t.type === d.type && t.date === d.date && t.account.trim().toLowerCase() === d.account.trim().toLowerCase() && (t.merchant.trim().toLowerCase() === d.merchant.trim().toLowerCase() || d.source === 'notification' || t.source === 'notification')));
}
export function totals(ts: Transaction[]) {
  const income = ts.filter(t=>t.type==='income'&&!t.flow).reduce((s,t)=>s+t.amount,0);
  const expense = ts.filter(t=>t.type==='expense'&&!t.flow).reduce((s,t)=>s+t.amount,0);
  return {income, expense, balance:ts.reduce((sum,t)=>sum+(t.type==='income'?t.amount:-t.amount),0)};
}
export function money(paise: number, compact = false) { return new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:compact?0:2,minimumFractionDigits:compact?0:2}).format(paise/100); }
export function parseUPI(raw: string): PendingPayment {
  let u: URL; try { u = new URL(raw.trim()); } catch { throw new Error('This QR code does not contain a UPI payment link.'); }
  if(u.protocol !== 'upi:' || u.hostname.toLowerCase() !== 'pay') throw new Error('Scan a merchant UPI payment QR code.');
  const payee = u.searchParams.get('pa') ?? '';
  if(!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/.test(payee)) throw new Error('The UPI address is invalid.');
  if(u.searchParams.has('cu') && u.searchParams.get('cu') !== 'INR') throw new Error('Only INR payments are supported.');
  const rawAmount = u.searchParams.get('am');
  if(rawAmount && (!/^\d+(\.\d{1,2})?$/.test(rawAmount) || Number(rawAmount)<=0 || Number(rawAmount)>1e10)) throw new Error('The QR code contains an invalid amount.');
  const clean = new URL('upi://pay');
  for(const key of ['pa','pn','am','tn','tr','mc','cu','mode','orgid','sign']) { const value=u.searchParams.get(key); if(value) clean.searchParams.set(key,value); }
  clean.searchParams.set('cu','INR');
  return {uri:clean.toString(), payee, merchant:u.searchParams.get('pn') || payee, amount:Math.round(Number(rawAmount || 0)*100), note:u.searchParams.get('tn') || ''};
}
export type AlertCandidate = {key:string; packageName:string; text:string; timestamp:number};
export function parseAlert(a: AlertCandidate): Draft | null {
  const text = a.text;
  if(/\b(otp|one.time|request|failed|declined|reversed|refund initiated|pending|due|offer)\b/i.test(text)) return null;
  const amount = text.match(/(?:₹|INR|Rs\.?)\s*([\d,]+(?:\.\d{1,2})?)/i);
  const debit = /\b(debited|paid|sent)\b/i.test(text); const credit = /\b(credited|received)\b/i.test(text);
  if(!amount || debit===credit) return null;
  const paise = Math.round(Number(amount[1].replaceAll(',',''))*100);
  if(!Number.isSafeInteger(paise) || paise <=0) return null;
  const merchant=text.match(/\b(?:to|from|at)\s+([\w .@-]{2,50}?)(?:\s+(?:on|using|via|ref|UPI|a\/c)\b|[,.]|$)/i)?.[1]?.trim() || 'Bank transaction';
  return {amount:paise, type:debit?'expense':'income', merchant, category:debit?'Other':'Income', account:'', app:a.packageName.includes('phonepe')?'PhonePe':a.packageName.includes('paytm')?'Paytm':a.packageName.includes('google')?'Google Pay':'Bank app', note:'Suggested from a notification. Check amount, account and payee.', date:localDate(new Date(a.timestamp)), reference:text.match(/(?:UTR|ref(?:erence)?|txn(?:\s*id)?)\s*[:#-]?\s*([a-z0-9]{8,30})\b/i)?.[1], source:'notification'};
}
export function sampleData(): Transaction[] {
  const now = new Date(); const month = localDate(now).slice(0,7);
  const rows: [string, number, string, string, string, number, 'income'|'expense'][] = [
    ['October salary',8500000,'Income','HDFC Bank','Transfer',1,'income'],
    ['Blue Tokai Coffee',34000,'Food & drinks','HDFC Bank','Google Pay',now.getDate(),'expense'],
    ['Amazon',249900,'Shopping','HDFC Bank','PhonePe',now.getDate(),'expense'],
    ['Uber',18500,'Transport','SBI','Google Pay',Math.max(1,now.getDate()-1),'expense'],
    ['Fresh groceries',184000,'Food & drinks','HDFC Bank','PhonePe',Math.max(1,now.getDate()-1),'expense'],
    ['Netflix',64900,'Entertainment','HDFC Bank','Bank app',Math.max(1,now.getDate()-2),'expense'],
    ['Home rent',1800000,'Bills','HDFC Bank','Transfer',3,'expense'],
    ['Weekend dinner',128000,'Food & drinks','SBI','Paytm',Math.max(1,now.getDate()-3),'expense'],
    ['Freelance project',1250000,'Income','SBI','Transfer',12,'income'],
    ['Metro recharge',50000,'Transport','Cash','Cash',Math.max(1,now.getDate()-4),'expense'],
    ['Pharmacy',42000,'Health','HDFC Bank','Google Pay',Math.max(1,now.getDate()-5),'expense']
  ];
  return rows.map(([merchant,amount,category,account,app,day,type],i)=>({id:`sample-${i}`,revision:`sample-${i}`,updatedAt:now.getTime()-i,date:`${month}-${String(day).padStart(2,'0')}`,merchant,amount,category,account,app,type,note:'Sample transaction',source:'sample'}));
}
