import * as Notifications from 'expo-notifications';
import {Platform} from 'react-native';
import {getNotificationIds,replaceNotificationIds,listMedicines,listProfiles,getPreferences} from '../database/db';
import {daysUntil} from './medicine';

Notifications.setNotificationHandler({handleNotification:async()=>({shouldShowBanner:true,shouldShowList:true,shouldPlaySound:true,shouldSetBadge:false})});
let running=Promise.resolve();
export async function requestNotificationPermission(){
  if(Platform.OS==='android') await Notifications.setNotificationChannelAsync('medshelf',{name:'MedShelf reminders',importance:Notifications.AndroidImportance.HIGH});
  const current=await Notifications.getPermissionsAsync();
  if(current.granted) return true;
  const result=await Notifications.requestPermissionsAsync();
  return result.granted;
}
async function clearJobs(userId){
  const previous=await getNotificationIds(userId);
  for(const job of previous){try{await Notifications.cancelScheduledNotificationAsync(job.notification_id);}catch(e){console.warn('Cancel notification',e);}}
  await replaceNotificationIds(userId,[]);
}
export async function cancelUserNotifications(userId){
  running=running.catch(()=>{}).then(()=>clearJobs(userId));return running;
}
export async function refreshNotifications(userId){
  // Serializes refreshes to avoid overlap when multiple screens save at once.
  running=running.catch(()=>{}).then(async()=>{
    await clearJobs(userId);
    const permissions=await Notifications.getPermissionsAsync();
    if(!permissions.granted)return false;
    const [medicines,profiles,prefs]=await Promise.all([listMedicines(userId),listProfiles(userId),getPreferences(userId)]);
    const names=new Map(profiles.map(p=>[p.id,p.name]));
    const ids=[];
    // iOS keeps a limited number of pending local notifications; leave headroom.
    const MAX_PENDING=48;
    const schedule=async(content,trigger)=>{
      if(ids.length>=MAX_PENDING)return;
      const notificationId=await Notifications.scheduleNotificationAsync({content:{...content,sound:'default',data:{userId}},trigger});
      ids.push(notificationId);
    };
    try{
      for(const m of medicines){
        const who=names.get(m.profile_id)||'Family member';
        const expiry=daysUntil(m.expiry_date);
        if(expiry>=0 && m.quantity>0){
          // Schedule one expiry warning, at 09:00 on the first upcoming day within warning window.
          const target=new Date();target.setHours(9,0,0,0);
          target.setDate(target.getDate()+Math.max(0,expiry-prefs.warning_days));
          if(target<=new Date())target.setDate(target.getDate()+1);
          const expiryDate=new Date();expiryDate.setHours(23,59,0,0);expiryDate.setDate(expiryDate.getDate()+expiry);
          if(target<=expiryDate){
            await schedule({title:'MedShelf · Expiry reminder',body:`${m.name} for ${who} expires on ${m.expiry_date}.`},{type:Notifications.SchedulableTriggerInputTypes.DATE,date:target,channelId:'medshelf'});
          }
          // Queue the next 14 days only, never repeating after the expiration date.
          // Refresh when the app opens or inventory changes.
          for(const time of (m.schedule_times||'').split(',').filter(Boolean)){
            const match=/^([01]\d|2[0-3]):([0-5]\d)$/.exec(time.trim());
            if(!match)continue;
            for(let day=0;day<=Math.min(13,expiry);day++){
              const at=new Date();at.setHours(Number(match[1]),Number(match[2]),0,0);at.setDate(at.getDate()+day);
              if(at<=new Date())continue;
              await schedule({title:`💊 Medicine reminder · ${who}`,body:`${m.name}${m.dose_quantity?` · ${m.dose_quantity} ${m.unit}`:''}. Check the recorded instructions.`},{type:Notifications.SchedulableTriggerInputTypes.DATE,date:at,channelId:'medshelf'});
            }
          }
        }
      }
      await replaceNotificationIds(userId,ids);
      return true;
    }catch(e){
      for(const id of ids){try{await Notifications.cancelScheduledNotificationAsync(id);}catch{}}
      throw e;
    }
  });return running;
}
export async function showLowStockNotification(m,profileName){
  const permission=await Notifications.getPermissionsAsync();
  if(!permission.granted)return;
  await Notifications.scheduleNotificationAsync({content:{title:'📦 MedShelf · Low stock',body:`${m.name} for ${profileName} has ${m.quantity} ${m.unit} remaining.`,sound:'default'},trigger:null});
}
