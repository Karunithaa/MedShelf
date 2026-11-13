import React,{useCallback,useState} from 'react';
import {Pressable,Text,View,Image} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useFocusEffect} from '@react-navigation/native';
import {Screen,Action,Empty} from '../components/UI';
import {C} from '../theme/colors';
import {useAuth} from '../context/AuthContext';
import {listMedicines,getPreferences} from '../database/db';
import {expiryStatus,stockIsLow} from '../utils/medicine';

const statBox=(label,value,icon,foreground,bg)=><View key={label} style={{width:'47%',flexGrow:1,flexDirection:'row',alignItems:'center',gap:11,backgroundColor:C.white,borderWidth:1,borderColor:C.line,borderRadius:18,padding:13,marginBottom:10,shadowColor:C.dark,shadowOpacity:0.035,shadowRadius:8,shadowOffset:{width:0,height:3}}}>
  <View style={{borderRadius:14,backgroundColor:bg,padding:10}}><Ionicons name={icon} color={foreground} size={24}/></View>
  <View style={{flex:1}}><Text style={{color:C.dark,fontSize:24,fontWeight:'900'}}>{value}</Text><Text style={{color:C.muted,fontSize:11,lineHeight:15}}>{label}</Text></View>
</View>;

export default function DashboardScreen({navigation}){
 const {user,profile}=useAuth(),[items,setItems]=useState([]),[warning,setWarning]=useState(30);
 useFocusEffect(useCallback(()=>{let active=true;(async()=>{try{const [m,p]=await Promise.all([listMedicines(user.id,profile?.id),getPreferences(user.id)]);if(active){setItems(m);setWarning(p.warning_days);}}catch(e){console.warn(e);}})();return()=>{active=false;};},[user.id,profile?.id]));
 const expired=items.filter(m=>expiryStatus(m.expiry_date,warning)==='Expired').length;
 const soon=items.filter(m=>['Expiring Today','Expiring Soon'].includes(expiryStatus(m.expiry_date,warning))).length;
 const low=items.filter(stockIsLow).length;
 const now=new Date();
 const upcoming=items.flatMap(m=>(m.schedule_times||'').split(',').filter(Boolean).map(time=>{
   const [h,min]=time.split(':').map(Number);
   if(!Number.isInteger(h)||!Number.isInteger(min))return null;
   const at=new Date(now.getFullYear(),now.getMonth(),now.getDate(),h,min);
   if(at<now)at.setDate(at.getDate()+1);
   return {medicine:m,time,at};
 }).filter(Boolean)).filter(x=>x.medicine.quantity>0 && expiryStatus(x.medicine.expiry_date,warning)!=='Expired').sort((a,b)=>a.at-b.at).slice(0,3);
 const toClock=d=>d.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'});
 return <Screen style={{paddingTop:0}}>
   <View style={{backgroundColor:C.lilac,borderRadius:25,overflow:'hidden',marginTop:12,marginBottom:22,padding:20,minHeight:172}}>
    <View style={{position:'absolute',right:-45,bottom:-75,width:220,height:220,borderRadius:110,backgroundColor:C.lavender}}/>
    <View style={{position:'absolute',right:20,top:38,width:100,height:100,borderRadius:50,backgroundColor:'#DDD3FF'}}/>
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><View style={{flexDirection:'row',alignItems:'center',gap:9}}><View style={{padding:8,borderRadius:12,backgroundColor:C.primary}}><Ionicons name="medical-outline" size={22} color={C.white}/></View><View><Text style={{color:C.dark,fontWeight:'900',fontSize:19}}>MedShelf</Text><Text style={{color:C.muted,fontSize:10}}>Your Home Medicine Inventory</Text></View></View><Pressable accessibilityLabel="Open settings" onPress={()=>navigation.navigate('Settings')} style={{padding:10,borderRadius:13,backgroundColor:C.lavender}}><Ionicons name="settings-outline" size={22} color={C.primary}/></Pressable></View>
    <Text style={{color:C.muted,fontSize:13,marginTop:24}}>Hello, {user.username} 👋</Text>
    <Text style={{color:C.dark,fontSize:27,fontWeight:'900',marginTop:2}}>{profile?.name || "My"} MedShelf</Text>
    <Text style={{color:C.muted,fontSize:11,marginTop:3}}>Your medicines, organized even offline.</Text>
    <Ionicons name="medkit" size={56} color={C.violet} style={{position:'absolute',right:28,bottom:9}}/>
   </View>
   <Pressable onPress={()=>navigation.navigate('FamilyProfiles')} style={{backgroundColor:C.white,borderColor:C.line,borderWidth:1,borderRadius:14,padding:14,marginBottom:16,flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Text style={{color:C.primary,fontWeight:'800'}}>👨‍👩‍👧  Family member: {profile?.name||'Me'}</Text><Ionicons name="chevron-forward" size={20} color={C.primary}/></Pressable>
   <Text style={{color:C.dark,fontSize:19,fontWeight:'900',marginBottom:13}}>Inventory overview</Text>
   <View style={{flexDirection:'row',flexWrap:'wrap',gap:10}}>
    {statBox('Total Medicines',items.length,'medical-outline',C.primary,C.lavender)}
    {statBox('Expired',expired,'alert-circle-outline',C.red,C.lightRed)}
    {statBox('Expiring Soon',soon,'calendar-outline',C.amber,C.lightAmber)}
    {statBox('Low Stock',low,'layers-outline',C.blue,C.lightBlue)}
   </View>
   <View style={{flexDirection:'row',gap:10,marginTop:10}}><View style={{flex:1}}><Action title="Inventory" secondary icon="list-outline" onPress={()=>navigation.navigate('Inventory')}/></View><View style={{flex:1}}><Action title="View Alerts" secondary icon="notifications-outline" onPress={()=>navigation.navigate('Alerts')}/></View></View>
   <Text style={{fontSize:19,fontWeight:'900',color:C.dark,marginTop:24,marginBottom:13}}>Next Medicines to Take</Text>
   {upcoming.length?upcoming.map(({medicine:m,time,at},i)=><Pressable key={`${m.id}-${time}-${i}`} onPress={()=>navigation.navigate('MedicineDetails',{id:m.id})} style={{flexDirection:'row',alignItems:'center',gap:10,padding:13,marginBottom:10,borderRadius:17,backgroundColor:C.white,borderWidth:1,borderColor:C.line}}>
     <View style={{padding:9,borderRadius:12,backgroundColor:C.lavender}}>{m.image_uri?<Image source={{uri:m.image_uri}} style={{width:30,height:30,borderRadius:8}}/>:<Ionicons name="medical-outline" size={30} color={C.primary}/>}</View>
     <View style={{flex:1}}><Text numberOfLines={1} style={{color:C.dark,fontSize:14,fontWeight:'800'}}>{m.name}</Text><Text numberOfLines={1} style={{color:C.muted,fontSize:11,marginTop:4}}>{m.dose_quantity?`${m.dose_quantity} ${m.unit} · `:''}{m.meal_relation&&m.meal_relation!=='Not specified'?`${m.meal_relation}${m.meal_offset_minutes!=null?` (${m.meal_offset_minutes} min)`:''}`:'Schedule saved'}</Text></View>
     <View style={{borderRadius:20,padding:9,backgroundColor:C.lilac}}><Text style={{fontSize:11,fontWeight:'800',color:C.primary}}>{at.toDateString()===now.toDateString()?'Today':'Tomorrow'} {toClock(at)}</Text></View>
   </Pressable>):<Empty title="No scheduled medicines" subtitle="Add optional times in Add/Edit Medicine to see your next three doses here."/>}
   <Action title="+ Add Medicine" icon="add-outline" onPress={()=>navigation.navigate('AddEditMedicine')} style={{marginTop:16,marginBottom:18}}/>
 </Screen>;
}
