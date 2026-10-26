/** Canonical local-calendar dates; no locale-dependent parsing or rollover. */
export function normalizeDateInput(value:string):string {
 const input=value.trim();
 const match=/^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(input);
 if(!match)return input;
 return `${match[1]}-${match[2].padStart(2,'0')}-${match[3].padStart(2,'0')}`;
}
export function isCalendarDate(value:unknown):value is string {
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const [year,month,day]=value.split('-').map(Number);
 if(year<1||month<1||month>12||day<1)return false;
 const leap=year%4===0&&(year%100!==0||year%400===0);
 return day<=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31][month-1];
}
export function enteredDate(value:string,label='Date',optional=false):string {
 const result=normalizeDateInput(value);
 if(optional&&!result)return '';
 if(!isCalendarDate(result))throw new Error(`${label}: choose a valid calendar date, for example 2026-03-25.`);
 return result;
}
