import {requireOptionalNativeModule} from 'expo-modules-core';
import { AlertCandidate } from '../model';
type Native={pickDate:(initial:string)=>Promise<string|null>;launchUPI:(uri:string)=>Promise<boolean>;notificationAccess:()=>boolean;openNotificationSettings:()=>void;setDetection:(enabled:boolean)=>void;getCandidates:()=>Promise<AlertCandidate[]>;dismissCandidate:(key:string)=>void;clearCandidates:()=>void};
export const native=requireOptionalNativeModule<Native>('MoniAndroid');
