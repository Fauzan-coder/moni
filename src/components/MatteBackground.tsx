import React from 'react';
import {View,StyleSheet} from 'react-native';
import Svg,{Defs,Pattern,Rect,Circle,Path} from 'react-native-svg';
// Deterministic vector grain: works offline, scales cleanly and adds no image download.
const grain=Array.from({length:240},(_,i)=>{
 const n=Math.sin(i*127.1+311.7)*43758.5453;const r=n-Math.floor(n);
 const m=Math.sin(i*269.5+183.3)*29467.184;const q=m-Math.floor(m);
 return {x:r*180,y:q*180,r:i%4===0?.65:.35,light:i%3===0};
});
export const MatteBackground=React.memo(function MatteBackground(){return <View pointerEvents="none" style={StyleSheet.absoluteFill}><Svg width="100%" height="100%"><Defs><Pattern id="matte-grain" patternUnits="userSpaceOnUse" width={180} height={180}>{grain.map((p,i)=><Circle key={i} cx={p.x} cy={p.y} r={p.r} fill={p.light?'#FFFFFF':'#6D5980'} opacity={p.light?.48:.15}/>)}</Pattern></Defs><Rect width="100%" height="100%" fill="#F2EFF5"/><Circle cx="95%" cy="8%" r={360} fill="#E6E0F3" opacity={.35}/><Circle cx="4%" cy="75%" r={300} fill="#F4E0D6" opacity={.25}/><Rect width="100%" height="100%" fill="url(#matte-grain)"/></Svg></View>;});
export function CardGrain(){return <View pointerEvents="none" style={[StyleSheet.absoluteFill,{overflow:'hidden',borderRadius:28}]}><Svg width="100%" height="100%"><Defs><Pattern id="card-grain" patternUnits="userSpaceOnUse" width={180} height={180}>{grain.map((p,i)=><Circle key={i} cx={p.x} cy={p.y} r={p.r} fill="#fff" opacity={.25}/>)}</Pattern></Defs><Rect width="100%" height="100%" fill="url(#card-grain)"/></Svg></View>;}
