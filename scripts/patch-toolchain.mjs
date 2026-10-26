import {readFileSync,writeFileSync,existsSync} from 'node:fs';
const path=new URL('../node_modules/@react-native/gradle-plugin/settings.gradle.kts',import.meta.url);
if(existsSync(path)){
 const original=readFileSync(path,'utf8');
 const patched=original.replace('id("org.gradle.toolchains.foojay-resolver-convention").version("0.5.0")','id("org.gradle.toolchains.foojay-resolver-convention").version("1.0.0")');
 if(patched!==original){writeFileSync(path,patched);console.log('Updated React Native Foojay resolver for Gradle 9 compatibility.');}
}
