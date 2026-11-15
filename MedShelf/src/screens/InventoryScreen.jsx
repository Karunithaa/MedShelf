import React,{useCallback,useMemo,useState} from 'react';
import {Pressable,Text,TextInput,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useFocusEffect} from '@react-navigation/native';
import {Screen,Heading,MedicineCard,PickerRow,Action,Empty} from '../components/UI';
import QuantityDialog from '../components/QuantityDialog';
import {C} from '../theme/colors';
import {CATEGORIES,expiryStatus} from '../utils/medicine';
import {listMedicines,getPreferences} from '../database/db';
import {useAuth} from '../context/AuthContext';
export default function InventoryScreen({navigation}){
 const {user,profile}=useAuth(),[items,setItems]=useState([]),[warning,setWarning]=useState(30),[query,setQuery]=useState(''),[category,setCategory]=useState('All'),[expiry,setExpiry]=useState('All'),[sort,setSort]=useState('Name: A–Z'),[selected,setSelected]=useState(null);
 const reload=useCallback(async()=>{const [m,p]=await Promise.all([listMedicines(user.id,profile?.id),getPreferences(user.id)]);setItems(m);setWarning(p.warning_days);},[user.id,profile?.id]);
 useFocusEffect(useCallback(()=>{reload().catch(console.warn);},[reload]));
 const filtered=useMemo(()=>items.filter(m=>{
 const status=expiryStatus(m.expiry_date,warning);
 return m.name.toLowerCase().includes(query.trim().toLowerCase()) && (category==='All'||m.category===category) && (expiry==='All'||status===expiry);
 }).sort((a,b)=>sort==='Name: A–Z'?a.name.localeCompare(b.name):sort==='Name: Z–A'?b.name.localeCompare(a.name):sort==='Expiry: Earliest'?a.expiry_date.localeCompare(b.expiry_date):b.expiry_date.localeCompare(a.expiry_date)),[items,query,category,expiry,sort,warning]);
 return <Screen><Heading title="Medicine Inventory" subtitle={`${filtered.length} of ${items.length} medicines`}/><View style={{backgroundColor:C.white,borderRadius:13,borderWidth:1,borderColor:C.line,flexDirection:'row',alignItems:'center',paddingHorizontal:12,marginBottom:13}}><Ionicons name="search" size={20} color={C.muted}/><TextInput value={query} onChangeText={setQuery} placeholder="Search by medicine name..." placeholderTextColor={C.muted} style={{flex:1,padding:13,color:C.text}}/></View>
 <PickerRow label="Category" value={category} options={['All',...CATEGORIES]} onChange={setCategory}/><PickerRow label="Expiry status" value={expiry} options={['All','Expired','Expiring Today','Expiring Soon','Not Expired']} onChange={setExpiry}/><PickerRow label="Sort by" value={sort} options={['Name: A–Z','Name: Z–A','Expiry: Earliest','Expiry: Latest']} onChange={setSort}/>
 <Action title="+ Add Medicine" icon="add-circle-outline" style={{marginBottom:20}} onPress={()=>navigation.navigate('AddEditMedicine')}/>
 {filtered.length?filtered.map(m=><MedicineCard key={m.id} medicine={m} warningDays={warning} onPress={()=>navigation.navigate('MedicineDetails',{id:m.id})} onUsed={()=>setSelected(m)}/>):<Empty/>}
 <QuantityDialog visible={!!selected} medicine={selected} onClose={()=>setSelected(null)} onSuccess={reload}/>
 </Screen>;
}
