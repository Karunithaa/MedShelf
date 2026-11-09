import React, {useState} from 'react';
import {Alert, Pressable, Text, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {Screen, Panel, Action, Field} from '../components/UI';
import {C} from '../theme/colors';
import {useAuth} from '../context/AuthContext';
export default function LoginScreen({navigation}) {
 const {login}=useAuth(),[username,setUsername]=useState(''),[password,setPassword]=useState(''),[visible,setVisible]=useState(false),[busy,setBusy]=useState(false);
 async function submit(){if(!username.trim()||!password) return Alert.alert('Required fields','Enter username and password.');setBusy(true);try{await login(username,password);}catch(e){Alert.alert('Sign in failed',e.message);}finally{setBusy(false);}}
 return <Screen style={{justifyContent:'center',paddingTop:75}}><View style={{alignItems:'center',marginBottom:30}}><View style={{backgroundColor:C.mint,padding:20,borderRadius:25}}><Ionicons name="medkit" size={50} color={C.primary}/></View><Text style={{fontSize:35,color:C.dark,fontWeight:'900',marginTop:15}}>MedShelf</Text><Text style={{color:C.muted,marginTop:5}}>Your offline home medicine cabinet</Text></View>
 <Panel><Text style={{fontSize:22,fontWeight:'800',color:C.text,marginBottom:18}}>Welcome back</Text><Field label="Username" value={username} onChangeText={setUsername} placeholder="Enter username"/><Field label="Password" value={password} onChangeText={setPassword} placeholder="Enter password" secureTextEntry={!visible} right={<Pressable onPress={()=>setVisible(!visible)} style={{padding:12}}><Ionicons name={visible?'eye-off':'eye'} size={20} color={C.muted}/></Pressable>}/><Action title={busy?'Signing in...':'Sign In'} onPress={submit} disabled={busy}/><Pressable style={{padding:18,alignItems:'center'}} onPress={()=>navigation.navigate('Register')}><Text style={{color:C.primary}}>New here? <Text style={{fontWeight:'800'}}>Create an account</Text></Text></Pressable></Panel><Text style={{textAlign:'center',color:C.muted,marginTop:12}}>Works offline · Data stays on this device</Text></Screen>;
}
