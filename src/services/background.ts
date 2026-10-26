import * as TaskManager from 'expo-task-manager';
import * as BackgroundTask from 'expo-background-task';
import { initialSettings, Settings } from '../model';
import { getMeta } from './storage';
import {syncDrive} from './drive';
const TASK='moni-hourly-drive-sync';
TaskManager.defineTask(TASK,async()=>{try{const s=await getMeta<Settings>('settings',initialSettings);if(s.driveEmail)await syncDrive();return BackgroundTask.BackgroundTaskResult.Success;}catch{return BackgroundTask.BackgroundTaskResult.Failed;}});
export async function scheduleSync(enabled:boolean){if(enabled)await BackgroundTask.registerTaskAsync(TASK,{minimumInterval:60});else if(await TaskManager.isTaskRegisteredAsync(TASK))await BackgroundTask.unregisterTaskAsync(TASK);}
