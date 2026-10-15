import React from 'react';
import { StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/SplashScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import OtpScreen from '../screens/OtpScreen';
import NameScreen from '../screens/NameScreen';
import BirthDateScreen from '../screens/BirthDateScreen';
import BirthTimeScreen from '../screens/BirthTimeScreen';
import BirthPlaceScreen from '../screens/BirthPlaceScreen';
import GenderScreen from '../screens/GenderScreen';
import RelationshipScreen from '../screens/RelationshipScreen';
import HoroscopeDetailScreen from '../screens/HoroscopeDetailScreen';
import CareerInsightsScreen from '../screens/CareerInsightsScreen';
import AstroGuideScreen from '../screens/AstroGuideScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import NotificationScreen from '../screens/NotificationScreen';
import PrivacySecurityScreen from '../screens/PrivacySecurityScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import RateAppScreen from '../screens/RateAppScreen';
import WalletScreen from '../screens/WalletScreen';
import WalletHistoryScreen from '../screens/WalletHistoryScreen';
import PlansScreen from '../screens/PlansScreen';
import KundliReportScreen from '../screens/KundliReportScreen';
import LegalScreen from '../screens/LegalScreen';
import FestivalDetailScreen from '../screens/FestivalDetailScreen';
import MainTabs from './MainTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Splash → Welcome → OTP → 6 onboarding steps → Main (bottom tabs) + detail pages
export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#000' },
      }}
    >
      {/* Transparent so the native launch background (same nebula) shows until the splash image draws */}
      <Stack.Screen
        name="Splash"
        component={SplashScreen}
        options={{ contentStyle: styles.transparent }}
      />
      <Stack.Screen
        name="Welcome"
        component={WelcomeScreen}
        options={({ route }) => ({
          animation: route.params?.fromSplash ? 'none' : 'fade',
        })}
      />
      <Stack.Screen name="Otp" component={OtpScreen} />
      <Stack.Screen name="Name" component={NameScreen} />
      <Stack.Screen name="BirthDate" component={BirthDateScreen} />
      <Stack.Screen name="BirthTime" component={BirthTimeScreen} />
      <Stack.Screen name="BirthPlace" component={BirthPlaceScreen} />
      <Stack.Screen name="Gender" component={GenderScreen} />
      <Stack.Screen name="Relationship" component={RelationshipScreen} />
      <Stack.Screen
        name="Main"
        component={MainTabs}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen name="HoroscopeDetail" component={HoroscopeDetailScreen} />
      <Stack.Screen name="CareerInsights" component={CareerInsightsScreen} />
      <Stack.Screen name="AstroGuide" component={AstroGuideScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Notification" component={NotificationScreen} />
      <Stack.Screen name="PrivacySecurity" component={PrivacySecurityScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="RateApp" component={RateAppScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="WalletHistory" component={WalletHistoryScreen} />
      <Stack.Screen name="Plans" component={PlansScreen} />
      <Stack.Screen name="KundliReport" component={KundliReportScreen} />
      <Stack.Screen name="Legal" component={LegalScreen} />
      <Stack.Screen name="FestivalDetail" component={FestivalDetailScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  transparent: {
    backgroundColor: 'transparent',
  },
});
