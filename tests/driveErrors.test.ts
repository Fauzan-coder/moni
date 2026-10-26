import test from 'node:test';
import assert from 'node:assert/strict';
import {driveErrorMessage} from '../src/services/driveErrors';
test('disabled API is identified from both Drive and Google RPC error formats',()=>{
 for(const payload of [{error:{errors:[{reason:'accessNotConfigured'}]}},{error:{details:[{reason:'SERVICE_DISABLED'}]}}])assert.match(driveErrorMessage(403,payload),/Enable Google Drive API/);
});
test('missing scope, blocked domain and request limits get distinct remedies',()=>{
 const payload=(reason:string)=>({error:{errors:[{reason}]}});
 assert.match(driveErrorMessage(403,payload('insufficientPermissions')),/Disconnect and reconnect/);
 assert.match(driveErrorMessage(403,payload('domainPolicy')),/administrator/);
 assert.match(driveErrorMessage(403,payload('userRateLimitExceeded')),/request limit/);
});
test('unknown/malformed errors never echo arbitrary server messages or request secrets',()=>{
 for(const payload of [undefined,null,{}, {error:{message:'SECRET TOKEN',errors:[{reason:'SECRET TOKEN'}]}}]){
  const message=driveErrorMessage(403,payload);assert.match(message,/local data is safe/);assert.doesNotMatch(message,/SECRET TOKEN/);
 }
 assert.match(driveErrorMessage(401,{}),/session expired/);
});
