import {StyleSheet} from 'react-native';
export const C={bg:'#F2EFF5',card:'#FCFDFB',ink:'#202A31',muted:'#555F70',line:'#E4E0EB',blue:'#3D61CA',blueDark:'#304FAF',pale:'#E7ECFF',green:'#246E58',orange:'#ED9B76'};
export const S=StyleSheet.create({
  screen:{flex:1,backgroundColor:C.bg},row:{flexDirection:'row',alignItems:'center'},between:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  title:{fontFamily:'Manrope_700Bold',fontSize:26,color:C.ink,letterSpacing:-.9},heading:{fontFamily:'Manrope_700Bold',fontSize:18,color:C.ink,letterSpacing:-.5},body:{fontFamily:'DMSans_400Regular',fontSize:14,color:C.ink,lineHeight:22},muted:{fontFamily:'DMSans_400Regular',fontSize:12,color:C.muted,lineHeight:19},label:{fontFamily:'DMSans_500Medium',fontSize:11,color:C.muted,letterSpacing:1.3,textTransform:'uppercase'},
  card:{backgroundColor:C.card,borderRadius:20,padding:16,borderWidth:1,borderColor:'#FFFFFF'},
  button:{backgroundColor:C.blue,borderRadius:14,paddingHorizontal:16,paddingVertical:12,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:9,minHeight:48},buttonText:{flexShrink:1,textAlign:'center',fontFamily:'DMSans_700Bold',fontSize:14,color:'#fff'},
  input:{backgroundColor:'#F2F4F1',borderWidth:1,borderColor:C.line,borderRadius:14,paddingHorizontal:12,paddingVertical:11,fontFamily:'DMSans_400Regular',fontSize:15,color:C.ink,minHeight:48},
  chip:{paddingHorizontal:14,paddingVertical:10,borderRadius:12,backgroundColor:'#F0F2EE',borderWidth:1,borderColor:'transparent'},chipActive:{backgroundColor:C.pale,borderColor:'#CBDBF8'},chipText:{fontFamily:'DMSans_500Medium',fontSize:12,color:'#535F6A'},chipActiveText:{color:C.blueDark},
  iconButton:{height:42,width:42,borderRadius:15,backgroundColor:C.card,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:C.line},
  divider:{height:1,backgroundColor:C.line,marginVertical:18},section:{marginBottom:22},
});
