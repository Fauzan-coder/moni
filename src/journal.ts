import {Transaction,validTransaction,parseBackup,uid,localDate,apps,validateDraft} from './model';
export type Versioned={id:string;revision:string;updatedAt:number;deleted?:boolean;deletionGroup?:string};
export type Loan=Versioned&{kind:'loan';person:string;direction:'lent'|'borrowed';principal:number;date:string;dueDate:string;note:string;trackCash:boolean;account:string;app:string;source:'manual'|'sample'};
export type Repayment=Versioned&{kind:'repayment';loanId:string;amount:number;date:string;note:string;trackCash:boolean;account:string;app:string;source:'manual'|'sample'};
export type FinancialNote=Versioned&{kind:'note';title:string;body:string;tag:string;pinned:boolean;loanId:string;date:string;source:'manual'|'sample'};
export type JournalDocument=Transaction|Loan|Repayment|FinancialNote;
export const noteTags=['General','Plan','Reminder','Loan'] as const;
export function isTransaction(d:JournalDocument):d is Transaction{return !('kind' in d);}
export function latestDocs<T extends Versioned>(docs:T[]):T[]{const map=new Map<string,T>();for(const d of docs){const prev=map.get(d.id);if(!prev||d.updatedAt>prev.updatedAt||(d.updatedAt===prev.updatedAt&&d.revision>prev.revision))map.set(d.id,d);}return [...map.values()];}
export function activeDocuments(docs:JournalDocument[]){return latestDocs(docs).filter(d=>!d.deleted);}
export function validDate(value:unknown){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&localDate(new Date(value+'T12:00:00'))===value;}
function text(x:unknown,max:number,required=false):x is string{return typeof x==='string'&&x.length<=max&&(!required||!!x.trim());}
function amount(x:unknown):x is number{return Number.isSafeInteger(x)&&Number(x)>0&&Number(x)<=1e12;}
export function validDocument(x:unknown):x is JournalDocument{
 if(!x||typeof x!=='object')return false;const d=x as any;
 if(!('kind' in d))return validTransaction(d);
 if(!text(d.id,199,true)||!text(d.revision,160,true)||!/^[a-zA-Z0-9-]+$/.test(d.revision)||!Number.isSafeInteger(d.updatedAt)||d.updatedAt<=0||(d.deleted!==undefined&&typeof d.deleted!=='boolean')||(d.deletionGroup!==undefined&&!text(d.deletionGroup,199))||!['manual','sample'].includes(d.source)||!validDate(d.date))return false;
 if(d.kind==='note')return text(d.title,160,true)&&text(d.body,10000)&&noteTags.includes(d.tag)&&typeof d.pinned==='boolean'&&text(d.loanId,199);
 if(!text(d.note,4000)||typeof d.trackCash!=='boolean'||!text(d.account,60)||!apps.includes(d.app))return false;
 if(d.trackCash&&!d.account.trim())return false;
 if(d.kind==='loan')return text(d.person,100,true)&&['lent','borrowed'].includes(d.direction)&&amount(d.principal)&&text(d.dueDate,10)&&(!d.dueDate||validDate(d.dueDate)&&d.dueDate>=d.date);
 if(d.kind==='repayment')return text(d.loanId,199,true)&&amount(d.amount);
 return false;
}
export function parseArchive(raw:string):JournalDocument[]{
 const data=JSON.parse(raw);if(data.schema===1)return parseBackup(raw);
 if(data.schema!==2||!Array.isArray(data.revisions)||data.revisions.length>100000||!data.revisions.every(validDocument))throw new Error('This is not a valid Moni backup. Nothing was changed.');
 return data.revisions.map((d:JournalDocument)=>{
  if(isTransaction(d))return parseBackup(JSON.stringify({schema:1,revisions:[d]}))[0];
  const base={id:d.id,revision:d.revision,updatedAt:d.updatedAt,deleted:d.deleted,deletionGroup:d.deletionGroup,date:d.date,source:d.source};
  if(d.kind==='note')return {...base,kind:d.kind,title:d.title,body:d.body,tag:d.tag,pinned:d.pinned,loanId:d.loanId};
  const shared={...base,kind:d.kind,note:d.note,trackCash:d.trackCash,account:d.account,app:d.app};
  return d.kind==='loan'?{...shared,person:d.person,direction:d.direction,principal:d.principal,dueDate:d.dueDate}:{...shared,loanId:d.loanId,amount:d.amount};
 });
}
export function archive(docs:JournalDocument[]){return JSON.stringify({schema:2,exportedAt:new Date().toISOString(),revisions:docs},null,2);}
export function loanBalance(loan:Loan,docs:JournalDocument[]){const payments=activeDocuments(docs).filter((d):d is Repayment=>!isTransaction(d)&&d.kind==='repayment'&&d.loanId===loan.id).sort((a,b)=>a.date.localeCompare(b.date)||a.updatedAt-b.updatedAt);const repaid=payments.reduce((sum,p)=>sum+p.amount,0);return {payments,repaid,remaining:Math.max(0,loan.principal-repaid),overpaid:Math.max(0,repaid-loan.principal),settled:repaid>=loan.principal};}
export function loanStatus(loan:Loan,docs:JournalDocument[]){const b=loanBalance(loan,docs);return b.overpaid?'Review repayments':b.settled?'Settled':loan.dueDate&&loan.dueDate<localDate()?'Overdue':b.repaid?'Partly repaid':'Open';}
export function revision<T extends Versioned>(value:T,docs:JournalDocument[]):T{const prev=latestDocs(docs).find(d=>d.id===value.id);return {...value,revision:uid(),updatedAt:Math.max(Date.now(),(prev?.updatedAt||0)+1)};}
export function movementId(record:Loan|Repayment){return `cash-${record.kind}-${record.id}`;}
export function cashMovement(record:Loan|Repayment,loan:Loan,docs:JournalDocument[]):Transaction{
 const outgoing=record.kind==='loan'?loan.direction==='lent':loan.direction==='borrowed';
 const tx:Transaction={id:movementId(record),revision:uid(),updatedAt:Date.now(),date:record.date,amount:record.kind==='loan'?record.principal:record.amount,type:outgoing?'expense':'income',merchant:`${record.kind==='loan'?(loan.direction==='lent'?'Lent to':'Borrowed from'):'Repayment ·'} ${loan.person}`,category:'Other',account:record.account,app:record.app,note:record.note.slice(0,2000),source:record.source==='sample'?'sample':'manual',flow:record.kind==='loan'?'loan':'repayment',loanId:loan.id,movementId:record.id};
 validateDraft(tx);return revision(tx,docs);
}
export function withMovement(record:Loan|Repayment,loan:Loan,docs:JournalDocument[]):JournalDocument[]{
 const out:JournalDocument[]=[revision(record,docs)];const existing=latestDocs(docs).find(d=>d.id===movementId(record));
 if(record.trackCash)out.push(cashMovement(record,loan,docs));else if(existing)out.push(revision({...existing,deleted:true},docs));return out;
}
export function cancelRepayment(payment:Repayment,docs:JournalDocument[]):JournalDocument[]{const out:JournalDocument[]=[revision({...payment,deleted:true},docs)];const cash=latestDocs(docs).find(d=>d.id===movementId(payment));if(cash)out.push(revision({...cash,deleted:true},docs));return out;}
export type CashLedgerRow={transaction:Transaction;before:number;balance:number};
export function cashLedger(transactions:Transaction[]):CashLedgerRow[]{let balance=0;return [...transactions].sort((a,b)=>a.date.localeCompare(b.date)||a.updatedAt-b.updatedAt||a.id.localeCompare(b.id)).map(transaction=>{const before=balance;balance+=transaction.type==='income'?transaction.amount:-transaction.amount;return {transaction,before,balance};});}
export function personLedger(person:string,loans:Loan[],docs:JournalDocument[]){
 const rows=loans.filter(l=>l.person.trim().toLowerCase()===person.trim().toLowerCase()).flatMap(l=>[{id:l.id,date:l.date,updatedAt:l.updatedAt,label:l.direction==='lent'?'Lent':'Borrowed',note:l.note,change:l.direction==='lent'?l.principal:-l.principal,loanId:l.id},...loanBalance(l,docs).payments.map(p=>({id:p.id,date:p.date,updatedAt:p.updatedAt,label:l.direction==='lent'?'Received repayment':'Repaid',note:p.note,change:l.direction==='lent'?-p.amount:p.amount,loanId:l.id}))]).sort((a,b)=>a.date.localeCompare(b.date)||a.updatedAt-b.updatedAt||a.id.localeCompare(b.id));
 let balance=0;return rows.map(r=>({...r,balance:balance+=r.change}));
}

export function deleteLoan(loan:Loan,docs:JournalDocument[]):JournalDocument[]{const group=uid();return activeDocuments(docs).filter(d=>d.id===loan.id||(!isTransaction(d)&&d.kind==='repayment'&&d.loanId===loan.id)||(isTransaction(d)&&d.loanId===loan.id)).map(d=>revision({...d,deleted:true,deletionGroup:group},docs));}
export function restoreLoan(loan:Loan,docs:JournalDocument[]):JournalDocument[]{return latestDocs(docs).filter(d=>d.id===loan.id||loan.deletionGroup&&d.deleted&&d.deletionGroup===loan.deletionGroup).map(d=>revision({...d,deleted:false,deletionGroup:undefined},docs));}
