import React,{useState} from 'react';
import {View,Text,TextInput,Platform} from 'react-native';
import {S} from '../theme';
import {IconButton} from './UI';
import {native} from '../services/native';
import {localDate} from '../model';
import {isCalendarDate,normalizeDateInput} from '../dates';
export function DateField({label,value,onChange,placeholder='YYYY-MM-DD'}:{label:string;value:string;onChange:(value:string)=>void;placeholder?:string}){
 const [error,setError]=useState('');
 const pick=async()=>{setError('');try{const initial=normalizeDateInput(value);const date=await native?.pickDate(isCalendarDate(initial)?initial:localDate());if(date)onChange(date);}catch(e){setError((e as Error).message);}};
 return <View><View style={{flexDirection:'row',alignItems:'center',gap:8}}><TextInput accessibilityLabel={label} value={value} onChangeText={onChange} onBlur={()=>onChange(normalizeDateInput(value))} placeholder={placeholder} maxLength={10} autoCorrect={false} style={[S.input,{flex:1}]}/>{Platform.OS==='android'&&native&&<IconButton name="calendar-outline" label={`Choose ${label.toLowerCase()}`} onPress={pick}/>}</View>{error&&<Text accessibilityRole="alert" style={[S.muted,{color:'#A3412B',marginTop:6}]}>{error}</Text>}</View>;
}
