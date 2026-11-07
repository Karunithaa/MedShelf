import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Modal, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../theme/colors';
import { expiryStatus, stockIsLow } from '../utils/medicine';
export function Screen({ children, scroll = true, style }) {
  const body = { flex: 1, backgroundColor: C.background };
  if (!scroll) return <View style={[body,style]}>{children}</View>;
  return <ScrollView style={body} contentContainerStyle={[{padding:18,paddingBottom:40},style]} keyboardShouldPersistTaps="handled">{children}</ScrollView>;
}
export function Heading({title,subtitle}) { return <View style={{marginBottom:18}}><Text style={s.heading}>{title}</Text>{!!subtitle && <Text style={s.muted}>{subtitle}</Text>}</View>; }
export function Panel({children,style}) { return <View style={[s.panel,style]}>{children}</View>; }
export function Action({title,onPress,secondary=false,danger=false,disabled=false,icon,style}) {
  return <Pressable disabled={disabled} onPress={onPress} style={[s.btn,secondary&&s.outline,danger&&{backgroundColor:C.red},disabled&&{opacity:.55},style]}>
   {!!icon&&<Ionicons name={icon} color={secondary?C.primary:C.white} size={19} style={{marginRight:8}}/>}
   <Text style={[s.btnText,secondary&&{color:C.primary}]}>{title}</Text>
  </Pressable>;
}
export function Field({label,value,onChangeText,placeholder,keyboardType='default',secureTextEntry=false,multiline=false, right}) {
  return <View style={{marginBottom:14}}><Text style={s.label}>{label}</Text><View style={s.inputWrap}>
    <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={C.muted} keyboardType={keyboardType} secureTextEntry={secureTextEntry} multiline={multiline} style={[s.input,multiline&&{height:90,textAlignVertical:'top'}]} autoCapitalize={secureTextEntry?'none':'sentences'} />{right}
  </View></View>;
}
export function PickerRow({label,options,value,onChange}) {
  const [open,setOpen] = useState(false);
  return <View style={{marginBottom:14}}><Text style={s.label}>{label}</Text>
    <Pressable style={s.pick} onPress={()=>setOpen(true)}><Text style={{color:value?C.text:C.muted}}>{value||'Select an option'}</Text><Ionicons name="chevron-down" size={17} color={C.muted}/></Pressable>
    <Modal transparent visible={open} animationType="fade" onRequestClose={()=>setOpen(false)}><Pressable style={s.backdrop} onPress={()=>setOpen(false)}><View style={s.sheet}><Text style={[s.heading,{fontSize:19,marginBottom:10}]}>{label}</Text><ScrollView style={{maxHeight:360}}>{options.map(o=><Pressable key={o} style={s.option} onPress={()=>{onChange(o);setOpen(false);}}><Text style={{fontSize:15,color:C.text}}>{o}</Text>{value===o&&<Ionicons name="checkmark" color={C.primary} size={20}/>}</Pressable>)}</ScrollView></View></Pressable></Modal>
  </View>;
}
export function Empty({title='No records found',subtitle='Try another filter or add a medicine.'}) {return <View style={{alignItems:'center',padding:40}}><Ionicons name="file-tray-outline" size={42} color={C.muted}/><Text style={{fontSize:17,fontWeight:'700',color:C.text,marginTop:12}}>{title}</Text><Text style={{color:C.muted,textAlign:'center',marginTop:6}}>{subtitle}</Text></View>;}
export function Spinner() {return <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:C.background}}><ActivityIndicator color={C.primary} size="large"/><Text style={{color:C.muted,marginTop:12}}>Loading MedShelf...</Text></View>;}
export function StatusPill({status}) {
 const bad=status==='Expired', warn=status!=='Not Expired'; const bg=bad?C.lightRed:warn?C.lightAmber:C.mint; const fg=bad?C.red:warn?C.amber:C.primary;
 return <View style={{alignSelf:'flex-start',paddingVertical:5,paddingHorizontal:9,borderRadius:30,backgroundColor:bg}}><Text style={{color:fg,fontSize:11,fontWeight:'800'}}>{status}</Text></View>;
}
export function MedicineCard({medicine,warningDays=30,onPress,onUsed}) {
 const status=expiryStatus(medicine.expiry_date,warningDays);
 return <Pressable onPress={onPress} style={s.card}><View style={{flexDirection:'row',justifyContent:'space-between',gap:10}}><View style={{flex:1}}><Text style={{fontSize:17,fontWeight:'800',color:C.text}}>{medicine.name}</Text><Text style={{color:C.muted,marginTop:3,fontSize:12}}>{medicine.category} · {medicine.form} · {medicine.storage_location}</Text></View><View style={{backgroundColor:C.mint,borderRadius:12,padding:10,alignSelf:'flex-start'}}>{medicine.image_uri?<Image source={{uri:medicine.image_uri}} style={{width:37,height:37,borderRadius:9}}/>:<Ionicons name="medkit-outline" size={21} color={C.primary}/>}</View></View>
 <View style={{flexDirection:'row',justifyContent:'space-between',marginTop:13,alignItems:'center'}}><View><Text style={{color:C.text,fontWeight:'800'}}>{medicine.quantity} <Text style={{fontWeight:'400'}}>{medicine.unit}</Text></Text><Text style={{color:C.muted,fontSize:12,marginTop:3}}>Expiry: {medicine.expiry_date}</Text></View><View style={{alignItems:'flex-end',gap:5}}><StatusPill status={status}/>{stockIsLow(medicine)&&<Text style={{color:C.amber,fontSize:11,fontWeight:'700'}}>Low stock</Text>}</View></View>
 {!!onUsed&&<Pressable onPress={onUsed} style={{paddingTop:12,marginTop:10,borderTopWidth:1,borderColor:C.line,alignItems:'center'}}><Text style={{color:C.primary,fontWeight:'700'}}>− Mark as Used</Text></Pressable>}
 </Pressable>;
}
export const s = StyleSheet.create({
 heading:{fontSize:27,fontWeight:'900',color:C.text,letterSpacing:-.6},muted:{color:C.muted,marginTop:5,lineHeight:21},panel:{padding:17,backgroundColor:C.white,borderRadius:18,borderWidth:1,borderColor:C.line,marginBottom:14},
 card:{padding:16,backgroundColor:C.white,borderRadius:17,borderWidth:1,borderColor:C.line,marginBottom:12},
 label:{fontWeight:'700',color:C.text,marginBottom:8,fontSize:13},inputWrap:{flexDirection:'row',alignItems:'center',backgroundColor:C.white,borderColor:C.line,borderWidth:1,borderRadius:13},input:{padding:13,fontSize:15,color:C.text,flex:1,minHeight:47},
 pick:{padding:14,borderWidth:1,borderColor:C.line,borderRadius:13,backgroundColor:C.white,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
 btn:{paddingVertical:15,paddingHorizontal:14,backgroundColor:C.primary,alignItems:'center',justifyContent:'center',borderRadius:13,flexDirection:'row',minHeight:50},outline:{backgroundColor:C.white,borderWidth:1,borderColor:C.primary},btnText:{color:C.white,fontWeight:'800',fontSize:15},
 backdrop:{flex:1,backgroundColor:'#0007',justifyContent:'center',padding:25},sheet:{backgroundColor:C.white,borderRadius:18,padding:18},option:{paddingVertical:13,borderBottomWidth:1,borderColor:C.line,flexDirection:'row',justifyContent:'space-between',alignItems:'center'}
});
