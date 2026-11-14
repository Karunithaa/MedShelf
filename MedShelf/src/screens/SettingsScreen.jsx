import React,{useCallback,useState} from 'react';
import {Alert,Text,View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {Screen,Heading,Panel,PickerRow,Field,Action} from '../components/UI';
import {C} from '../theme/colors';
import {requestNotificationPermission,refreshNotifications} from '../utils/notifications';
import {useAuth} from '../context/AuthContext';
import {getPreferences,savePreferences} from '../database/db';
import {integerOrNull} from '../utils/medicine';
export default function SettingsScreen(){
 const {user,logout}=useAuth(),[warning,setWarning]=useState('30'),[threshold,setThreshold]=useState('5'),[busy,setBusy]=useState(false);
 useFocusEffect(useCallback(()=>{getPreferences(user.id).then(p=>{setWarning(String(p.warning_days));setThreshold(String(p.default_threshold));}).catch(console.warn);},[user.id]));
 async function save(){const n=integerOrNull(warning),t=integerOrNull(threshold);if(![7,15,30,60,90].includes(n)||t===null)return Alert.alert('Invalid settings','Choose a warning period and enter a non-negative integer threshold.');setBusy(true);try{await savePreferences(user.id,n,t);await refreshNotifications(user.id).catch(console.warn);Alert.alert('Saved','Preferences saved locally.');}catch(e){Alert.alert('Error',e.message);}finally{setBusy(false);}}
 function signOut(){Alert.alert('Log out?','End your local session on this device?', [{text:'Cancel',style:'cancel'},{text:'Log Out',onPress:async()=>{try{await logout();}catch(e){Alert.alert('Error',e.message);}}}]);}
 return <Screen><Heading title="Settings" subtitle={`Signed in as ${user.username}`}/>
 <Panel><Text style={{fontWeight:'800',color:C.text,fontSize:18,marginBottom:16}}>Inventory preferences</Text><PickerRow label="Expiry warning period" options={['7','15','30','60','90']} value={warning} onChange={setWarning}/><Field label="Default low-stock threshold" value={threshold} onChangeText={setThreshold} keyboardType="number-pad"/><Text style={{fontSize:12,color:C.muted,marginBottom:14}}>The default applies only to medicines you add in the future. Existing thresholds stay unchanged.</Text><Action title="Save Preferences" onPress={save} disabled={busy}/></Panel>
 <Panel><Text style={{fontWeight:'800',fontSize:18,color:C.text,marginBottom:10}}>Offline notifications</Text><Text style={{color:C.muted,marginBottom:12}}>Allow local medicine schedules and expiry notifications. No internet or email needed.</Text><Action title="Enable / Refresh Notifications" icon="notifications-outline" onPress={async()=>{try{const ok=await requestNotificationPermission();if(ok){await refreshNotifications(user.id);Alert.alert('Notifications enabled','Your saved medicine reminders have been scheduled on this device.');}else Alert.alert('Permission denied','Enable MedShelf notifications in your phone settings.');}catch(e){Alert.alert('Notification error',e.message);}}}/></Panel>
 <Panel><Text style={{fontWeight:'800',color:C.text,fontSize:18}}>About MedShelf</Text><Text style={{color:C.muted,lineHeight:22,marginTop:9}}>Version 1.0.0 · React Native / Expo</Text><Text style={{color:C.muted,lineHeight:22}}>SQLite offline inventory · SecureStore local session</Text><Text style={{color:C.muted,lineHeight:22}}>This application does not give medical advice, diagnosis, or dosage recommendations.</Text></Panel>
 <Action title="Log Out" danger icon="log-out-outline" onPress={signOut}/>
 </Screen>;
}
