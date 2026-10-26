import {test} from 'node:test';
import assert from 'node:assert/strict';
import {accountNames,cleanAccountName,sameAccount} from '../src/accounts';
import {sampleData,visible,Transaction,parseAlert} from '../src/model';
test('new users have no preseeded bank or cash accounts',()=>{assert.deepEqual(accountNames({},[]),[]);});
test('user-defined banks and wallets populate account choices without presets',()=>{assert.deepEqual(accountNames({accounts:['Salary account','Travel wallet']},[]),['Salary account','Travel wallet']);assert.equal(cleanAccountName('  My   bank  ',[]),'My bank');});
test('restored transaction accounts are discovered and duplicate labels normalized',()=>{const t={...sampleData()[0],account:'My own credit union'};assert.deepEqual(accountNames({accounts:['my own credit union']},[t]),['my own credit union']);assert.equal(cleanAccountName('MY OWN CREDIT UNION',['My own credit union']),'My own credit union');});
test('deleted sample/test entries cannot leak default banks into the real account list',()=>{const removed=sampleData().map(t=>({...t,deleted:true}));assert.deepEqual(accountNames({},visible(removed)),[]);assert.throws(()=>cleanAccountName('  ',[]));});
test('notification suggestions never assume a user bank account',()=>{assert.equal(parseAlert({key:'one',packageName:'com.phonepe.app',text:'INR 340 paid to Cafe on 24 Oct',timestamp:Date.now()})?.account,'');});

test('account matching keeps restored capitalization differences in the same totals and filters',()=>{assert.equal(sameAccount('My Bank',' my bank '),true);assert.equal(sameAccount('My Bank','Other Bank'),false);});
