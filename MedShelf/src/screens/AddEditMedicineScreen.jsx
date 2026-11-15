import React,{useCallback,useState} from 'react';
import {Alert,Image,Platform,Pressable,Text,View} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {Ionicons} from '@expo/vector-icons';
import {persistMedicineImage,removeMedicineImage} from '../utils/medicineImages';
import DateTimePicker from '@react-native-community/datetimepicker';
import {useFocusEffect} from '@react-navigation/native';
import {Screen,Heading,Field,PickerRow,Action} from '../components/UI';
import {C} from '../theme/colors';
import {refreshNotifications,showLowStockNotification} from '../utils/notifications';
import {useAuth} from '../context/AuthContext';
import {getMedicine,addMedicine,updateMedicine,getPreferences} from '../database/db';
import {CATEGORIES,FORMS,UNITS,todayString,validateMedicine,validDate} from '../utils/medicine';
const blank=threshold=>({name:'',category:'Tablets',form:'Tablet',strength_label:'',quantity:'0',unit:'tablets',expiry_date:todayString(),storage_location:'',low_stock_threshold:String(threshold),notes:'',schedule_times:'',meal_relation:'Not specified',meal_offset_minutes:'',dose_quantity:'',image_uri:null});
const formatDate = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export default function AddEditMedicineScreen({navigation,route}){
 const {user,profile}=useAuth(),id=route.params?.id,[m,setM]=useState(blank(5)),[loaded,setLoaded]=useState(false),[picker,setPicker]=useState(false),[saving,setSaving]=useState(false);
 const [photoChanged,setPhotoChanged]=useState(false);
 useFocusEffect(useCallback(()=>{let active=true;(async()=>{try{const p=await getPreferences(user.id);const record=id?await getMedicine(user.id,id,profile?.id):null;if(active){if(id&&!record){Alert.alert('Not found','This medicine does not exist.');navigation.goBack();return;}setPhotoChanged(false);setM(record?{...record,quantity:String(record.quantity),low_stock_threshold:String(record.low_stock_threshold),schedule_times:record.schedule_times||'',meal_relation:record.meal_relation||'Not specified',meal_offset_minutes:record.meal_offset_minutes==null?'':String(record.meal_offset_minutes),dose_quantity:record.dose_quantity==null?'':String(record.dose_quantity)}:blank(p.default_threshold));setLoaded(true);}}catch(e){Alert.alert('Error',e.message);}})();return()=>{active=false;};},[user.id,profile?.id,id]));
 const set=(field,value)=>setM(prev=>({...prev,[field]:value}));
 async function pickPhoto(){
   try {
     const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],allowsEditing:true,aspect:[1,1],quality:0.75});
     if(!result.canceled && result.assets?.[0]?.uri){set('image_uri',result.assets[0].uri);setPhotoChanged(true);}
   }catch(e){Alert.alert('Photo unavailable',e.message);}
 }
 async function save(){
 const times=m.schedule_times.split(',').map(t=>t.trim()).filter(Boolean);
 if(times.some(t=>!/^([01]\d|2[0-3]):[0-5]\d$/.test(t)))return Alert.alert('Invalid times','Enter times in 24-hour HH:MM format, separated by commas (e.g. 08:00, 20:30).');
 if(m.dose_quantity!==''&&(!/^[1-9]\d*$/.test(m.dose_quantity)||!Number.isSafeInteger(Number(m.dose_quantity))))return Alert.alert('Invalid quantity','Quantity per time must be a positive whole number.');
 if(m.meal_offset_minutes!==''&&(!/^\d+$/.test(m.meal_offset_minutes)||!Number.isSafeInteger(Number(m.meal_offset_minutes))))return Alert.alert('Invalid meal interval','Enter a non-negative number of minutes.');
 const error=validateMedicine(m);if(error)return Alert.alert('Check your inputs',error);setSaving(true);let copiedImage=null;try{const previous=id?await getMedicine(user.id,id,profile?.id):null;const oldImage=previous?.image_uri; if(photoChanged && m.image_uri){copiedImage=await persistMedicineImage(m.image_uri);} const payload={...m,image_uri:photoChanged?(copiedImage||null):m.image_uri,name:m.name.trim(),storage_location:m.storage_location.trim(),strength_label:m.strength_label.trim(),notes:m.notes.trim(),quantity:Number(m.quantity),low_stock_threshold:Number(m.low_stock_threshold),schedule_times:times.join(','),dose_quantity:m.dose_quantity===''?null:Number(m.dose_quantity),meal_offset_minutes:m.meal_relation==='Not specified'||m.meal_offset_minutes===''?null:Number(m.meal_offset_minutes)};if(id){const ok=await updateMedicine(user.id,id,payload,profile?.id);if(!ok)throw new Error('Medicine not found.');}else await addMedicine(user.id,payload,profile?.id);
  await refreshNotifications(user.id).catch(console.warn);
  if(payload.quantity<=payload.low_stock_threshold && (!id || (previous && previous.quantity>previous.low_stock_threshold))) await showLowStockNotification(payload,profile?.name||'Me').catch(console.warn);
  if(photoChanged && oldImage && oldImage!==payload.image_uri)removeMedicineImage(oldImage).catch(console.warn);Alert.alert('Saved',id?'Medicine updated successfully.':'Medicine added to your inventory.',[{text:'OK',onPress:()=>navigation.goBack()}]);}catch(e){if(copiedImage)await removeMedicineImage(copiedImage);Alert.alert('Save failed',e.message);}finally{setSaving(false);}}
 function asDate(value){if(!validDate(value))return new Date();const [y,mo,d]=value.split('-').map(Number);return new Date(y,mo-1,d);}
 if(!loaded)return <Screen><Text style={{color:C.muted}}>Loading medicine form...</Text></Screen>;
 return <Screen><Heading title={id?'Edit Medicine':'Add Medicine'} subtitle="Store the information exactly as listed on the packaging"/>
 <Text style={{color:C.primary,fontWeight:'800',marginBottom:12}}>Family member: {profile?.name||'Me'}</Text>
 <Field label="Medicine name *" value={m.name} onChangeText={v=>set('name',v)} placeholder="e.g. Paracetamol"/>
 <PickerRow label="Category *" options={CATEGORIES} value={m.category} onChange={v=>set('category',v)}/>
 <PickerRow label="Medicine form *" options={FORMS} value={m.form} onChange={v=>set('form',v)}/>
 <Field label="Strength (from label, optional)" value={m.strength_label} onChangeText={v=>set('strength_label',v)} placeholder="e.g. 500 mg"/>
 <Text style={{fontWeight:'800',fontSize:15,color:C.dark,marginBottom:10,marginTop:6}}>Medicine Image (Optional)</Text>
 <Pressable accessibilityRole="button" onPress={pickPhoto} style={{minHeight:142,borderRadius:17,borderColor:C.violet,borderWidth:1.5,borderStyle:'dashed',backgroundColor:C.lilac,alignItems:'center',justifyContent:'center',overflow:'hidden',marginBottom:10,padding:12}}>
 {m.image_uri?<Image source={{uri:m.image_uri}} style={{width:118,height:118,borderRadius:12}} resizeMode="cover"/>:<><Ionicons name="image-outline" size={32} color={C.primary}/><Text style={{color:C.dark,fontWeight:'800',marginTop:8}}>Choose photo from gallery</Text><Text style={{color:C.muted,marginTop:5,fontSize:12}}>Medicine box, bottle or label · Not required</Text></>}
 </Pressable>
 {m.image_uri&&<Pressable onPress={()=>{set('image_uri',null);setPhotoChanged(true);}} style={{marginBottom:14,alignSelf:'flex-end',padding:7}}><Text style={{color:C.red,fontWeight:'700'}}>Remove photo</Text></Pressable>}
 <Field label="Available quantity *" value={m.quantity} onChangeText={v=>set('quantity',v)} keyboardType="number-pad"/>
 <PickerRow label="Quantity unit *" options={UNITS} value={m.unit} onChange={v=>set('unit',v)}/>
 <Text style={{fontWeight:'700',color:C.text,marginBottom:8}}>Expiry date *</Text>
 <Pressable onPress={()=>setPicker(true)} style={{backgroundColor:C.white,borderWidth:1,borderColor:C.line,borderRadius:13,padding:15,marginBottom:6}}><Text style={{color:C.text}}>📅  {m.expiry_date}    Tap to choose date</Text></Pressable>
 {picker&&<DateTimePicker value={asDate(m.expiry_date)} mode="date" display={Platform.OS==='ios'?'spinner':'default'} onChange={(event,date)=>{if(Platform.OS==='android')setPicker(false);if(date&&event.type!=='dismissed')set('expiry_date',formatDate(date));}}/>}
 {picker&&Platform.OS==='ios'&&<Pressable onPress={()=>setPicker(false)} style={{alignSelf:'flex-end',padding:10,marginBottom:8}}><Text style={{color:C.primary,fontWeight:'700'}}>Done</Text></Pressable>}
 <Text style={{color:C.muted,fontSize:12,marginBottom:14}}>Past dates are allowed for medicines already expired.</Text>
 <Field label="Storage location *" value={m.storage_location} onChangeText={v=>set('storage_location',v)} placeholder="e.g. Cabinet A"/>
 <Field label="Low-stock threshold *" value={m.low_stock_threshold} onChangeText={v=>set('low_stock_threshold',v)} keyboardType="number-pad"/>
 <Text style={{fontSize:18,fontWeight:'800',color:C.text,marginTop:8,marginBottom:10}}>Optional medicine schedule</Text>
 <Text style={{color:C.muted,marginBottom:12}}>Record times from your own prescription or medicine label. These times are entered by you, not medical advice. When notifications are enabled, the phone will remind you locally.</Text>
 <Field label="Times to take (optional)" value={m.schedule_times} onChangeText={v=>set('schedule_times',v)} placeholder="08:00, 13:00, 20:00 (24-hour format)"/>
 <Field label="Quantity per time (optional)" value={m.dose_quantity} onChangeText={v=>set('dose_quantity',v)} keyboardType="number-pad" placeholder="e.g. 1"/>
 <PickerRow label="Meal timing (optional)" options={['Not specified','Before meal','After meal','With meal']} value={m.meal_relation} onChange={v=>set('meal_relation',v)}/>
 {['Before meal','After meal'].includes(m.meal_relation)&&<Field label="Minutes before/after meal (optional)" value={m.meal_offset_minutes} onChangeText={v=>set('meal_offset_minutes',v)} keyboardType="number-pad" placeholder="e.g. 30"/>}
 <Field label="Additional notes (optional)" value={m.notes} onChangeText={v=>set('notes',v)} placeholder="Optional inventory notes" multiline/>
 <Action title={saving?'Saving...':id?'Update Medicine':'Save Medicine'} disabled={saving} onPress={save} icon="save-outline" style={{marginTop:8}}/>
 <Action title="Cancel" secondary style={{marginTop:10}} onPress={()=>navigation.goBack()}/>
 </Screen>;
}
