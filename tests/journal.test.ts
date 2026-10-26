import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Loan,Repayment,FinancialNote,JournalDocument,loanBalance,loanStatus,withMovement,activeDocuments,isTransaction,cancelRepayment,deleteLoan,restoreLoan,personLedger,cashLedger,parseArchive,archive,validDocument,latestDocs} from '../src/journal';
import {totals,localDate,Transaction} from '../src/model';
const loan:Loan={kind:'loan',id:'loan-one',revision:'loan-v1',updatedAt:100,date:'2026-10-01',dueDate:'2026-10-10',person:'Aman',direction:'lent',principal:500000,note:'For a trip',trackCash:true,account:'My bank',app:'Google Pay',source:'manual'};
const payment:Repayment={kind:'repayment',id:'payment-one',revision:'pay-v1',updatedAt:200,date:'2026-10-05',loanId:loan.id,amount:150000,note:'First part',trackCash:true,account:'My bank',app:'Google Pay',source:'manual'};
const note:FinancialNote={kind:'note',id:'note-one',revision:'note-v1',updatedAt:300,date:'2026-10-05',title:'Repayment agreement',body:'Aman will repay in two parts.',tag:'Loan',pinned:true,loanId:loan.id,source:'manual'};
const cash=(docs:JournalDocument[])=>activeDocuments(docs).filter(isTransaction);
test('partial payments, full settlement and overdue status use exact paise',()=>{
 assert.equal(loanBalance(loan,[loan,payment]).remaining,350000);
 assert.equal(loanStatus(loan,[loan,payment]),'Overdue');
 const final={...payment,id:'payment-two',revision:'pay-v2',amount:350000};
 assert.equal(loanBalance(loan,[loan,payment,final]).settled,true);assert.equal(loanStatus(loan,[loan,payment,final]),'Settled');
});
test('lending and collecting change cash, without counting as spending or income',()=>{
 let docs=withMovement(loan,loan,[]);docs.push(...withMovement(payment,loan,docs));
 assert.deepEqual(totals(cash(docs)),{income:0,expense:0,balance:-350000});
 const ordinary:Transaction={id:'salary',revision:'salary-v1',updatedAt:50,date:'2026-10-01',amount:900000,type:'income',merchant:'Salary',category:'Income',account:'My bank',app:'Transfer',note:'',source:'manual'};
 assert.deepEqual(totals([...cash(docs),ordinary]),{income:900000,expense:0,balance:550000});
});
test('borrowed principal comes in, and repaying it goes out',()=>{
 const borrowed={...loan,direction:'borrowed' as const};let docs=withMovement(borrowed,borrowed,[]);assert.equal(totals(cash(docs)).balance,500000);
 docs.push(...withMovement(payment,borrowed,docs));assert.equal(totals(cash(docs)).balance,350000);assert.equal(totals(cash(docs)).income,0);
});
test('tracking-only loans and repayments never create cash entries',()=>{const l={...loan,trackCash:false,account:''};let docs=withMovement(l,l,[]);docs.push(...withMovement({...payment,trackCash:false,account:''},l,docs));assert.equal(cash(docs).length,0);assert.equal(loanBalance(l,docs).remaining,350000);});
test('cash movement IDs are stable across edits and turning tracking off removes the linked entry',()=>{
 let docs=withMovement(loan,loan,[]);docs.push(...withMovement({...loan,principal:600000},loan,docs));assert.equal(cash(docs).length,1);assert.equal(cash(docs)[0].amount,600000);
 docs.push(...withMovement({...loan,trackCash:false},loan,docs));assert.equal(cash(docs).length,0);
});
test('undoing a repayment atomically removes its cash entry and restores outstanding balance',()=>{
 let docs=withMovement(loan,loan,[]);docs.push(...withMovement(payment,loan,docs));docs.push(...cancelRepayment(payment,docs));
 assert.equal(loanBalance(loan,docs).remaining,500000);assert.equal(totals(cash(docs)).balance,-500000);
});
test('deleting and restoring a loan preserves linked entries without reviving previously undone payments',()=>{
 let docs=withMovement(loan,loan,[]);docs.push(...withMovement(payment,loan,docs));docs.push(...cancelRepayment(payment,docs));
 const second={...payment,id:'payment-two',revision:'pay-2',amount:100000};docs.push(...withMovement(second,loan,docs));
 docs.push(note,...deleteLoan(loan,docs));assert.equal(cash(docs).length,0);assert.equal(activeDocuments(docs).some(d=>d.id===note.id),true);
 const removed=latestDocs(docs).find(d=>d.id===loan.id) as Loan;docs.push(...restoreLoan(removed,docs));
 assert.equal(loanBalance(loan,docs).repaid,100000);assert.equal(loanBalance(loan,docs).payments.length,1);assert.equal(totals(cash(docs)).balance,-400000);
});
test('concurrent over-repayments remain visible for review rather than losing financial history',()=>{const a={...payment,amount:300000};const b={...a,id:'payment-two',revision:'pay-other'};const b1=loanBalance(loan,[loan,a,b]);assert.equal(b1.remaining,0);assert.equal(b1.overpaid,100000);assert.equal(b1.payments.length,2);assert.equal(loanStatus(loan,[loan,a,b]),'Review repayments');});
test('person ledger combines loans, borrowing and repayments with a chronological signed balance',()=>{
 const borrowed={...loan,id:'loan-two',revision:'loan-2',direction:'borrowed' as const,principal:100000,date:'2026-10-02'};
 const rows=personLedger('aman',[loan,borrowed],[loan,borrowed,payment]);assert.deepEqual(rows.map(r=>r.balance),[500000,400000,250000]);
});
test('money ledger sorts movements and carries each prior balance forward',()=>{let docs=withMovement(loan,loan,[]);docs.push(...withMovement(payment,loan,docs));const rows=cashLedger(cash(docs).reverse());assert.equal(rows[0].before,0);assert.equal(rows[0].balance,-500000);assert.equal(rows[1].before,-500000);assert.equal(rows[1].balance,-350000);});
test('new backups restore transactions, loans, repayments, financial notes and tombstones; old backups remain supported',()=>{
 const docs=[...withMovement(loan,loan,[]),payment,note];const restored=parseArchive(archive(docs));assert.equal(restored.length,docs.length);assert.equal(restored.some(d=>!isTransaction(d)&&d.kind==='note'),true);
 const tx=cash(docs)[0];assert.equal(parseArchive(JSON.stringify({schema:1,revisions:[tx]})).length,1);
 assert.throws(()=>parseArchive(JSON.stringify({schema:2,revisions:[loan,{...note,body:{bad:true}}]})));
 assert.throws(()=>parseArchive(JSON.stringify({schema:2,revisions:[{...payment,amount:-1}]})));
});
test('financial document validation rejects invalid dates and requires an account only when recording cash',()=>{
 assert.equal(validDocument({...loan,dueDate:'2026-02-31'}),false);assert.equal(validDocument({...loan,dueDate:'2026-09-30'}),false);
 assert.equal(validDocument({...loan,trackCash:true,account:''}),false);assert.equal(validDocument({...loan,trackCash:false,account:''}),true);
});
