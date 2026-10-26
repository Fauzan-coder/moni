import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseUPI,latest,visible,totals,duplicate,parseAlert,parseBackup,validateDraft,sampleData,localDate,Transaction} from '../src/model';
const base:Transaction={id:'one',revision:'a',updatedAt:100,date:'2026-10-24',amount:34000,type:'expense',merchant:'Cafe',category:'Food & drinks',account:'HDFC Bank',app:'Google Pay',note:'',source:'manual'};
test('UPI validation strips unrelated parameters, keeps merchant and exact amount',()=>{
 const p=parseUPI('upi://pay?pa=cafe@hdfc&pn=My%20Cafe&am=340.25&cu=INR&url=https://evil.test');
 assert.equal(p.amount,34025);assert.equal(p.merchant,'My Cafe');assert.equal(new URL(p.uri).searchParams.has('url'),false);
 for(const uri of ['https://example.com','upi://collect?pa=cafe@hdfc','upi://pay?pa=invalid','upi://pay?pa=a@b&am=-2','upi://pay?pa=a@b&cu=USD','upi://pay?pa=a@b&am=2.001'])assert.throws(()=>parseUPI(uri));
});
test('concurrent versions converge in either order and preserve the original history',()=>{
 const a={...base,revision:'b',updatedAt:200,note:'Device A'};const b={...base,revision:'c',updatedAt:200,note:'Device B'};
 assert.deepEqual(latest([base,a,b]),latest([b,a,base]));assert.equal(latest([base,a,b])[0].note,'Device B');assert.equal([base,a,b].length,3);
});
test('deletion tombstones prevent resurrection and restore creates a newer version',()=>{
 const deleted={...base,revision:'b',updatedAt:200,deleted:true};assert.equal(visible([base,deleted]).length,0);
 assert.equal(visible([deleted,base,{...base,revision:'c',updatedAt:201}]).length,1);
});
test('amounts and totals use integer paise',()=>{assert.deepEqual(totals([base,{...base,id:'two',type:'income',amount:50000}]),{expense:34000,income:50000,balance:16000});assert.throws(()=>validateDraft({...base,amount:1.5}));assert.throws(()=>validateDraft({...base,date:'2026-02-31'}));});
test('duplicate references and notification/manual overlap trigger review; editing own entry does not',()=>{
 assert.ok(duplicate({...base,id:undefined},[base]));assert.equal(duplicate(base,[base]),undefined);
 assert.ok(duplicate({...base,id:'other',merchant:'BANK ALERT',source:'notification'},[base]));
 assert.ok(duplicate({...base,id:'other',reference:'123456789012'},[{...base,reference:'123456789012',merchant:'Different merchant'}]));
});
test('notification parser rejects OTPs, failed, pending and ambiguous alerts',()=>{
 const c={key:'x',packageName:'com.phonepe.app',timestamp:Date.now()};
 for(const text of ['OTP is 123456 for INR 340 paid','INR 340 payment failed','INR 340 sent pending','INR 340 credited and debited','INR 340 offer'])assert.equal(parseAlert({...c,text}),null);
 const d=parseAlert({...c,text:'Rs. 1,250.50 debited to Cafe on 24 Oct ref 123456789012'});assert.equal(d?.amount,125050);assert.equal(d?.type,'expense');assert.equal(d?.reference,'123456789012');
});
test('restore rejects malformed financial documents without returning partial data',()=>{
 assert.equal(parseBackup(JSON.stringify({schema:1,revisions:[base]})).length,1);
 for(const value of [{schema:2,revisions:[base]},{schema:1,revisions:[{...base,amount:-1}]},{schema:1,revisions:[base,{...base,revision:'../escape'}]},{schema:1,revisions:[{...base,note:{unsafe:'object'}}]},{schema:1,revisions:[{...base,reference:123}]},{schema:1,revisions:[{...base,id:''}]}])assert.throws(()=>parseBackup(JSON.stringify(value)));
});
test('sample data is labeled and month-relative',()=>{const ts=sampleData();assert.ok(ts.every(t=>t.source==='sample'));assert.ok(ts.every(t=>t.date.startsWith(localDate().slice(0,7))));ts.forEach(validateDraft);});

test('same bank reference imported under a different ID is counted only once, including deletion',()=>{
 const a={...base,reference:'123456789012'};const b={...a,id:'imported',revision:'b',updatedAt:200};
 assert.equal(visible([a,b]).length,1);assert.equal(totals(visible([a,b])).expense,34000);
 assert.equal(visible([a,{...b,deleted:true}]).length,0);
});
