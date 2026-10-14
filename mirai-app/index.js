/**
 * @format
 */

import { AppRegistry } from 'react-native';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';
import { handleNotifeeEvent } from './src/notifications';

// Push messages while the app is in the background / killed. FCM shows `notification` payloads
// itself (channel "default"); nothing else to do here. Must be registered outside React.
try {
  setBackgroundMessageHandler(getMessaging(), async () => {});
} catch {
  // Firebase not configured on this platform
}
// Tap on a notifee notification (shown in the foreground) while the app is in the background
notifee.onBackgroundEvent(async event => handleNotifeeEvent(event));

AppRegistry.registerComponent(appName, () => App);
