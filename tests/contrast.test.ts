import {test} from 'node:test';
import assert from 'node:assert/strict';
function luminance(hex:string){const values=hex.replace('#','').match(/../g)!.map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*values[0]+.7152*values[1]+.0722*values[2];}
function ratio(a:string,b:string){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
test('normal body/secondary text and primary actions meet 4.5:1 on the matte surfaces',()=>{
 for(const bg of ['#FCFDFB','#F2EFF5','#F9E9D2','#F9E7E2','#EEE7F7','#DBECE4','#DDEDE2','#F5DED6']){
  assert.ok(ratio('#555F70',bg)>=4.5,`secondary on ${bg}: ${ratio('#555F70',bg)}`);
  assert.ok(ratio('#202A31',bg)>=4.5);
 }
 assert.ok(ratio('#FFFFFF','#3D61CA')>=4.5);assert.ok(ratio('#246E58','#F9E9D2')>=4.5);
});
