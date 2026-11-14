import React,{useCallback,useState} from 'react';
import {Alert,Pressable,Text,View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {Screen,Heading,Panel,Field,PickerRow,Action,Empty} from '../components/UI';
import {C} from '../theme/colors';
import {useAuth} from '../context/AuthContext';
import {listProfiles,addProfile,deleteProfile} from '../database/db';
import {refreshNotifications} from '../utils/notifications';

export default function FamilyProfilesScreen({navigation}) {
  const {user,profile,setProfile}=useAuth();
  const [rows,setRows]=useState([]),[name,setName]=useState(''),[relationship,setRelationship]=useState('Family'),[busy,setBusy]=useState(false);
  const load=useCallback(async()=>setRows(await listProfiles(user.id)),[user.id]);
  useFocusEffect(useCallback(()=>{load().catch(e=>Alert.alert('Error',e.message));},[load]));
  async function add(){
    setBusy(true);
    try{
      await addProfile(user.id,name,relationship);
      setName('');setRelationship('Family');await load();
      Alert.alert('Added','Family member created. Select their profile to add their medicines.');
    }catch(e){Alert.alert('Could not add member',e.message);}finally{setBusy(false);}
  }
  function remove(row){
    Alert.alert('Delete family member?',`This permanently deletes ${row.name}'s medicines and schedules.`,[
      {text:'Cancel',style:'cancel'},
      {text:'Delete',style:'destructive',onPress:async()=>{
        try{
          await deleteProfile(user.id,row.id);
          if(profile?.id===row.id){const other=(await listProfiles(user.id))[0];setProfile(other||null);}
          await refreshNotifications(user.id).catch(console.warn);
          await load();
        }catch(e){Alert.alert('Error',e.message);}
      }}
    ]);
  }
  return <Screen><Heading title="Family Profiles" subtitle="Each person has their own local medicine inventory and reminders."/>
    {rows.length===0&&<Empty title="No profiles" subtitle="Create a profile below."/>}
    {rows.map(row=><Panel key={row.id} style={{borderColor:profile?.id===row.id?C.primary:C.line}}>
      <Pressable onPress={()=>{setProfile(row);navigation.navigate('Home',{screen:'Dashboard'});}} accessibilityRole="button" style={{flexDirection:'row',alignItems:'center',gap:12}}>
        <View style={{backgroundColor:C.lavender,borderRadius:30,width:46,height:46,alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:23}}>👤</Text></View>
        <View style={{flex:1}}><Text style={{color:C.dark,fontSize:17,fontWeight:'800'}}>{row.name} {row.is_default?'(Me)':''}</Text>
          <Text style={{color:C.muted,fontSize:12,marginTop:4}}>{row.relationship} · {row.medicine_count} medicines</Text></View>
        <Text style={{color:C.primary,fontWeight:'800'}}>{profile?.id===row.id?'Selected':'Select'}</Text>
      </Pressable>
      {!row.is_default&&<Pressable onPress={()=>remove(row)} style={{alignSelf:'flex-end',marginTop:12}}><Text style={{color:C.red,fontSize:12,fontWeight:'700'}}>Delete member</Text></Pressable>}
    </Panel>)}
    <Panel><Text style={{fontWeight:'800',color:C.dark,fontSize:18,marginBottom:12}}>Add Family Member</Text>
      <Field label="Name *" value={name} onChangeText={setName} placeholder="e.g. Mom"/>
      <PickerRow label="Relationship" value={relationship} options={['Family','Mother','Father','Sister','Brother','Grandparent','Child','Spouse','Other']} onChange={setRelationship}/>
      <Action title={busy?'Adding...':'+ Add Family Member'} disabled={busy} onPress={add}/>
    </Panel>
    <Text style={{color:C.muted,fontSize:12,lineHeight:18}}>Profiles are stored on this device under your account. Medicine schedules are informational and must come from a clinician or medicine label.</Text>
  </Screen>;
}
