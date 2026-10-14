/**
 * MIRAI app
 *
 * @format
 */

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { OnboardingProvider } from './src/context/OnboardingContext';
import RootNavigator from './src/navigation/RootNavigator';
import { navigationRef } from './src/navigation/navigationRef';
import { flushPendingNotification, startNotifications } from './src/notifications';

function App() {
  useEffect(() => {
    startNotifications();
  }, []);

  return (
    <SafeAreaProvider>
      <OnboardingProvider>
        <NavigationContainer
          ref={navigationRef}
          // a tapped notification waits until the user is signed in and past the splash
          onReady={flushPendingNotification}
          onStateChange={flushPendingNotification}
        >
          <RootNavigator />
        </NavigationContainer>
      </OnboardingProvider>
    </SafeAreaProvider>
  );
}

export default App;
