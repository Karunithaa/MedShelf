import React, { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, Text, View } from 'react-native';
import { Action, Field, s } from './UI';
import { C } from '../theme/colors';
import { integerOrNull } from '../utils/medicine';
import { changeQuantity } from '../database/db';
import {refreshNotifications,showLowStockNotification} from '../utils/notifications';
import { useAuth } from '../context/AuthContext';
export default function QuantityDialog({visible,medicine,onClose,onSuccess,mode='used'}) {
 const [amount,setAmount]=useState('1'); const [busy,setBusy]=useState(false); const {user,profile}=useAuth();
 useEffect(()=>setAmount('1'),[visible]);
 async function submit(){
  const n=integerOrNull(amount);
  if(n===null||n<1) return Alert.alert('Invalid quantity','Enter a positive whole number.');
  if(mode!=='add'&&n>(medicine?.quantity??0)) return Alert.alert('Not enough stock','Quantity used cannot exceed available quantity.');
  setBusy(true);
  try { await changeQuantity(user.id,medicine.id,mode==='add'?n:-n,profile?.id);
  await refreshNotifications(user.id).catch(console.warn);
  const remaining=medicine.quantity+(mode==='add'?n:-n);
  if(mode!=='add' && medicine.quantity>medicine.low_stock_threshold && remaining<=medicine.low_stock_threshold) await showLowStockNotification({...medicine,quantity:remaining},profile?.name||'Me').catch(console.warn);
  onClose();onSuccess?.(); }
  catch(e){Alert.alert('Could not update stock',e.message);}finally{setBusy(false);}
 }
 return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
 <View style={[s.backdrop,{justifyContent:'center'}]}><View style={s.sheet}>
 <Text style={{fontSize:21,fontWeight:'800',color:C.text}}>{mode==='add'?'Add to Stock':'Mark as Used'}</Text>
 <Text style={{color:C.muted,marginVertical:12}}>{medicine?.name} · Available: {medicine?.quantity} {medicine?.unit}</Text>
 <Field label={mode==='add'?'Quantity to add':'Quantity used'} value={amount} onChangeText={setAmount} keyboardType="number-pad"/>
 <Action title={busy?'Saving...':'Confirm'} onPress={submit} disabled={busy}/>
 <Pressable style={{alignItems:'center',padding:13}} onPress={onClose}><Text style={{color:C.muted}}>Cancel</Text></Pressable>
 </View></View></Modal>;
}
