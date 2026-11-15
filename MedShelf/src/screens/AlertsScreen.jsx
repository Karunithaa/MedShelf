import React,{useCallback,useState} from 'react';
import {Pressable,Text,View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {Screen,Heading,Panel,Empty,PickerRow,StatusPill} from '../components/UI';
import {C} from '../theme/colors';
import {useAuth} from '../context/AuthContext';
import {listMedicines,getPreferences} from '../database/db';
import {daysUntil,expiryStatus,stockIsLow} from '../utils/medicine';
export default function AlertsScreen({navigation}){
 const {user,profile}=useAuth(),[items,setItems]=useState([]),[warning,setWarning]=useState(30),[filter,setFilter]=useState('All Alerts');
 useFocusEffect(useCallback(()=>{let active=true;(async()=>{try{const [m,p]=await Promise.all([listMedicines(user.id,profile?.id),getPreferences(user.id)]);if(active){setItems(m);setWarning(p.warning_days);}}catch(e){console.warn(e);}})();return()=>{active=false;};},[user.id,profile?.id]));
 const expired=items.filter(m=>expiryStatus(m.expiry_date,warning)==='Expired');
 const soon=items.filter(m=>['Expiring Today','Expiring Soon'].includes(expiryStatus(m.expiry_date,warning)));
 const low=items.filter(stockIsLow);
 const groups=[['Expired Medicines',expired,'Expired'],['Expiring Soon',soon,'Expiring Soon'],['Low-Stock Medicines',low,'Low Stock']].filter(g=>filter==='All Alerts'||filter===g[0]);
 function message(m,type){const days=daysUntil(m.expiry_date);return type==='Expired'?`${Math.abs(days)} day(s) since expiry · ${m.expiry_date}`:type==='Low Stock'?`${m.quantity} ${m.unit} remaining · threshold ${m.low_stock_threshold}`:`${days} day(s) remaining · ${m.expiry_date}`;}
 return <Screen><Heading title="Expiry & Stock Alerts" subtitle={`Warning window: ${warning} days · Your inventory only`}/><PickerRow label="Alert type" options={['All Alerts','Expired Medicines','Expiring Soon','Low-Stock Medicines']} value={filter} onChange={setFilter}/>
 {groups.map(([heading,rows,type])=><View key={heading} style={{marginBottom:17}}><Text style={{fontWeight:'900',fontSize:19,color:C.text,marginBottom:11}}>{heading}  ({rows.length})</Text>{rows.length?rows.map(m=><Pressable key={m.id} onPress={()=>navigation.navigate('MedicineDetails',{id:m.id})}><Panel style={{marginBottom:9}}><View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><View style={{flex:1}}><Text style={{fontWeight:'800',fontSize:16,color:C.text}}>{m.name}</Text><Text style={{fontSize:12,color:C.muted,marginTop:5}}>{message(m,type)}</Text></View>{type==='Low Stock'?<Text style={{color:C.amber,fontSize:12,fontWeight:'800'}}>LOW STOCK</Text>:<StatusPill status={type==='Expired'?'Expired':'Expiring Soon'}/>}</View></Panel></Pressable>):<Empty title="Nothing to flag" subtitle={`No ${heading.toLowerCase()} in your current inventory.`}/>}</View>)}
 </Screen>;
}
