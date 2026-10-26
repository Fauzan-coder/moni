import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import {File,Paths} from 'expo-file-system';
import {parseArchive,archive} from '../journal';
import {putDocuments,readDocuments} from './storage';
export async function exportBackup(){const file=new File(Paths.cache,`moni-backup-${Date.now()}.json`);try{file.write(archive(await readDocuments()));await Sharing.shareAsync(file.uri,{mimeType:'application/json',dialogTitle:'Save your Moni backup'});}finally{if(file.exists)file.delete();}}
export async function restoreBackup(){const result=await DocumentPicker.getDocumentAsync({type:['application/json','text/plain'],copyToCacheDirectory:true});if(result.canceled)return false;const file=new File(result.assets[0].uri);try{if(file.size>20000000)throw new Error('Choose a backup smaller than 20 MB.');await putDocuments(parseArchive(await file.text()));return true;}finally{if(file.exists)file.delete();}}
