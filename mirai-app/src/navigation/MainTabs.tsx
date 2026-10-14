import React from 'react';
import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabBar, { TabKey } from '../components/BottomTabBar';
import HomeScreen from '../screens/HomeScreen';
import HoroscopeScreen from '../screens/HoroscopeScreen';
import GenerateKundliScreen from '../screens/GenerateKundliScreen';
import YourKundliScreen from '../screens/YourKundliScreen';
import PanchangScreen from '../screens/PanchangScreen';
import AstroGuideScreen from '../screens/AstroGuideScreen';
import type { KundliStackParamList, MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const KundliStack = createNativeStackNavigator<KundliStackParamList>();

const ROUTE_FOR_TAB: Record<TabKey, keyof MainTabParamList> = {
  home: 'Home',
  horoscope: 'Horoscope',
  kundli: 'Kundli',
  panchang: 'Panchang',
  'que-report': 'QueReport',
};
const TAB_FOR_ROUTE = Object.fromEntries(
  Object.entries(ROUTE_FOR_TAB).map(([tab, route]) => [route, tab]),
) as Record<keyof MainTabParamList, TabKey>;

function KundliNavigator() {
  return (
    <KundliStack.Navigator
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000' } }}
    >
      <KundliStack.Screen name="GenerateKundli" component={GenerateKundliScreen} />
      <KundliStack.Screen name="YourKundli" component={YourKundliScreen} />
    </KundliStack.Navigator>
  );
}

function renderTabBar({ state, navigation }: BottomTabBarProps) {
  const route = state.routes[state.index].name as keyof MainTabParamList;
  return (
    <BottomTabBar
      active={TAB_FOR_ROUTE[route]}
      onPress={key => navigation.navigate(ROUTE_FOR_TAB[key])}
    />
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: '#000' } }}
      tabBar={renderTabBar}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Horoscope" component={HoroscopeScreen} />
      <Tab.Screen name="Kundli" component={KundliNavigator} />
      <Tab.Screen name="Panchang" component={PanchangScreen} />
      <Tab.Screen name="QueReport" component={AstroGuideScreen} />
    </Tab.Navigator>
  );
}
