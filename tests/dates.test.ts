import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeDateInput,isCalendarDate,enteredDate} from '../src/dates';
test('the reported loan date accepts unpadded month/day and stores canonical dates',()=>{
 assert.equal(enteredDate('2026-3-25','Loan date'),'2026-03-25');
 assert.equal(enteredDate(' 2026-3-5 '),'2026-03-05');
 assert.equal(normalizeDateInput('2026-03-25'),'2026-03-25');
 assert.equal(enteredDate('','Due date',true),'');
});
test('date entry rejects impossible dates without JavaScript calendar rollover',()=>{
 for(const date of ['2026-2-29','2026-4-31','2026-13-1','2026-0-1','25-03-2026','2026-3',''])assert.throws(()=>enteredDate(date,'Loan date'),/Loan date/);
 assert.equal(enteredDate('2024-2-29'),'2024-02-29');
 assert.equal(isCalendarDate('1900-02-29'),false);
 assert.equal(isCalendarDate('2000-02-29'),true);
});
