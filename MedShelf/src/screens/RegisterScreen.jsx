import React,{useState} from 'react';
import {Alert, Pressable, Text} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {Screen,Heading,Panel,Field,Action} from '../components/UI';
import {C} from '../theme/colors';
import {useAuth} from '../context/AuthContext';
export default function RegisterScreen({navigation}){
 const {register}=useAuth(),[name,setName]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[show,setShow]=useState(false),[busy,setBusy]=useState(false);
 async function submit(){if(password!==confirm)return Alert.alert('Passwords do not match','Please re-enter both passwords.');setBusy(true);try{await register(name,password);Alert.alert('Account created','Your offline account is ready. Sign in to add your medicines.',[{text:'Go to Login',onPress:()=>navigation.navigate('Login')}]);}catch(e){Alert.alert('Registration failed',e.message);}finally{setBusy(false);}}
 return <Screen><Heading title="Create account" subtitle="Separate inventory for each local user"/><Panel><Field label="Username" value={name} onChangeText={setName} placeholder="3–30 characters"/><Field label="Password" value={password} onChangeText={setPassword} secureTextEntry={!show} placeholder="At least 8 characters" right={<Pressable onPress={()=>setShow(!show)} style={{padding:12}}><Ionicons name={show?'eye-off':'eye'} size={20} color={C.muted}/></Pressable>}/><Field label="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry={!show} placeholder="Repeat password"/><Action title={busy?'Creating account...':'Create Account'} onPress={submit} disabled={busy}/><Pressable onPress={()=>navigation.navigate('Login')} style={{padding:17,alignItems:'center'}}><Text style={{color:C.primary}}>Already registered? Sign in</Text></Pressable></Panel><Text style={{textAlign:'center',color:C.muted}}>Accounts and passwords are stored locally. Passwords are hashed, not saved in plain text.</Text></Screen>;
}
