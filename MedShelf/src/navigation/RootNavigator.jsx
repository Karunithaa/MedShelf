import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Ionicons} from '@expo/vector-icons';
import {C} from '../theme/colors';
import {useAuth} from '../context/AuthContext';
import {Spinner} from '../components/UI';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import InventoryScreen from '../screens/InventoryScreen';
import MedicineDetailsScreen from '../screens/MedicineDetailsScreen';
import AddEditMedicineScreen from '../screens/AddEditMedicineScreen';
import AlertsScreen from '../screens/AlertsScreen';
import SettingsScreen from '../screens/SettingsScreen';
const Stack=createNativeStackNavigator(),Tabs=createBottomTabNavigator();
function MainTabs(){return <Tabs.Navigator screenOptions={({route})=>({headerShown:false,tabBarActiveTintColor:C.primary,tabBarInactiveTintColor:C.muted,tabBarStyle:{height:66,paddingBottom:9,paddingTop:6,backgroundColor:C.white},tabBarLabelStyle:{fontWeight:'700',fontSize:11},tabBarIcon:({color,size})=><Ionicons name={({Dashboard:'home-outline',Inventory:'albums-outline',Alerts:'notifications-outline'})[route.name]} color={color} size={size}/>})}>
 <Tabs.Screen name="Dashboard" component={DashboardScreen}/><Tabs.Screen name="Inventory" component={InventoryScreen}/><Tabs.Screen name="Alerts" component={AlertsScreen}/>
 </Tabs.Navigator>;}
export default function RootNavigator(){const {user,ready}=useAuth();if(!ready)return <Spinner/>;return <NavigationContainer><Stack.Navigator key={user?`user-${user.id}`:'guest'} screenOptions={{headerStyle:{backgroundColor:C.background},headerTintColor:C.dark,headerShadowVisible:false,contentStyle:{backgroundColor:C.background}}}>
 {user? <><Stack.Screen name="Home" component={MainTabs} options={{headerShown:false}}/><Stack.Screen name="MedicineDetails" component={MedicineDetailsScreen} options={{title:'Medicine Details'}}/><Stack.Screen name="AddEditMedicine" component={AddEditMedicineScreen} options={{title:'Medicine Form'}}/><Stack.Screen name="Settings" component={SettingsScreen} options={{title:'Settings'}}/></> : <><Stack.Screen name="Login" component={LoginScreen} options={{headerShown:false}}/><Stack.Screen name="Register" component={RegisterScreen} options={{title:'Register'}}/></>}
 </Stack.Navigator></NavigationContainer>;}
