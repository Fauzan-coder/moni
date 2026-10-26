import {Settings,Transaction} from './model';
/** No seeded banks: saved user labels and actual, visible transaction accounts only. */
export function accountNames(settings:Pick<Settings,'accounts'>,transactions:Transaction[]):string[]{
 const names=new Map<string,string>();
 for(const raw of [...(settings.accounts||[]),...transactions.map(t=>t.account)]){
  const name=raw.trim();if(name&&!names.has(name.toLocaleLowerCase('en-IN')))names.set(name.toLocaleLowerCase('en-IN'),name);
 }
 return [...names.values()];
}
export function cleanAccountName(raw:string,existing:string[]):string{
 const name=raw.trim().replace(/\s+/g,' ');
 if(!name)throw new Error('Enter a name for your account.');
 if(name.length>60)throw new Error('Use an account name up to 60 characters.');
 return existing.find(n=>n.toLocaleLowerCase('en-IN')===name.toLocaleLowerCase('en-IN'))||name;
}

export function sameAccount(a:string,b:string){return a.trim().toLocaleLowerCase('en-IN')===b.trim().toLocaleLowerCase('en-IN');}
