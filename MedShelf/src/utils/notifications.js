import { Platform } from 'react-native';

export async function requestNotificationPermission() {
  if (Platform.OS === 'web') {
    return false;
  }

  return false;
}

export async function refreshNotifications() {
  if (Platform.OS === 'web') {
    return;
  }
}

export async function cancelUserNotifications() {
  if (Platform.OS === 'web') {
    return;
  }
}