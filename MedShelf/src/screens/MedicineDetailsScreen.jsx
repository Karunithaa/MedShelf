import React,{useCallback,useState} from 'react';
import {Alert,Image,Text,View} from 'react-native';
import {removeMedicineImage} from '../utils/medicineImages';
import {useFocusEffect} from '@react-navigation/native';
import {Screen,Heading,Panel,StatusPill,Action,Empty} from '../components/UI';
import QuantityDialog from '../components/QuantityDialog';
import {C} from '../theme/colors';
import {refreshNotifications} from '../utils/notifications';
import {useAuth} from '../context/AuthContext';
import {getMedicine,deleteMedicine,getPreferences} from '../database/db';
import {expiryStatus,stockIsLow} from '../utils/medicine';
const Row=({label,value})=><View style={{flexDirection:'row',paddingVertical:12,borderBottomWidth:1,borderColor:C.line}}><Text style={{color:C.muted,flex:1}}>{label}</Text><Text style={{color:C.text,fontWeight:'700',flex:1,textAlign:'right'}}>{value||'—'}</Text></View>;
export default function MedicineDetailsScreen({navigation,route}){
 const {user,profile}=useAuth(),id=route.params?.id,[medicine,setMedicine]=useState(null),[warning,setWarning]=useState(30),[modal,setModal]=useState(null);
 const reload=useCallback(async()=>{const [m,p]=await Promise.all([getMedicine(user.id,id,profile?.id),getPreferences(user.id)]);setMedicine(m);setWarning(p.warning_days);},[user.id,profile?.id,id]);
 useFocusEffect(useCallback(()=>{reload().catch(console.warn);},[reload]));
 function confirmDelete(){Alert.alert('Delete medicine?',`Permanently remove ${medicine.name} from your inventory?`,[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:async()=>{try{await deleteMedicine(user.id,medicine.id,profile?.id);await refreshNotifications(user.id).catch(console.warn);await removeMedicineImage(medicine.image_uri);navigation.goBack();}catch(e){Alert.alert('Error',e.message);}}}]);}
 if(!medicine)return <Screen><Empty title="Medicine not found" subtitle="This item may have been deleted, or it belongs to another account."/><Action title="Back" onPress={()=>navigation.goBack()}/></Screen>;
 return <Screen><Heading title={medicine.name} subtitle={`${medicine.category} · ${medicine.form}`}/><Panel>{!!medicine.image_uri&&<Image source={{uri:medicine.image_uri}} resizeMode="contain" style={{width:"100%",height:190,borderRadius:15,backgroundColor:C.lilac,marginBottom:14}}/>}<View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:8}}><Text style={{fontSize:25,fontWeight:'900',color:C.text}}>{medicine.quantity} <Text style={{fontSize:15,fontWeight:'400'}}>{medicine.unit}</Text></Text><StatusPill status={expiryStatus(medicine.expiry_date,warning)}/></View>{stockIsLow(medicine)&&<Text style={{color:C.amber,fontWeight:'700'}}>⚠ Low stock: at or below {medicine.low_stock_threshold} {medicine.unit}</Text>}</Panel>
 <Panel><Row label="Medicine" value={medicine.name}/><Row label="Category" value={medicine.category}/><Row label="Form" value={medicine.form}/><Row label="Strength label" value={medicine.strength_label}/><Row label="Quantity" value={`${medicine.quantity} ${medicine.unit}`}/><Row label="Expiry date" value={medicine.expiry_date}/><Row label="Storage location" value={medicine.storage_location}/><Row label="Low-stock threshold" value={String(medicine.low_stock_threshold)}/><Row label="Scheduled times" value={medicine.schedule_times?.split(',').join(', ')}/><Row label="Quantity per time" value={medicine.dose_quantity==null?'':String(medicine.dose_quantity)}/><Row label="Meal timing" value={medicine.meal_relation==='Not specified'?'':medicine.meal_relation}/><Row label="Meal interval" value={medicine.meal_offset_minutes==null?'':`${medicine.meal_offset_minutes} minutes`}/><Row label="Notes" value={medicine.notes}/><Row label="Date added" value={medicine.created_at?.slice(0,10)}/></Panel>
 <Action title="Mark as Used" icon="remove-circle-outline" onPress={()=>setModal('used')} style={{marginBottom:10}}/><View style={{flexDirection:'row',gap:10,marginBottom:10}}><View style={{flex:1}}><Action title="+ Add Stock" secondary onPress={()=>setModal('add')}/></View><View style={{flex:1}}><Action title="Edit Medicine" secondary onPress={()=>navigation.navigate('AddEditMedicine',{id:medicine.id})}/></View></View><Action title="Delete Medicine" danger icon="trash-outline" onPress={confirmDelete}/><Text style={{color:C.muted,textAlign:'center',marginTop:16,fontSize:12}}>Inventory tracking only. No dosage advice is provided.</Text>
 <QuantityDialog visible={!!modal} medicine={medicine} mode={modal==='add'?'add':'used'} onClose={()=>setModal(null)} onSuccess={reload}/>
 </Screen>;
}
