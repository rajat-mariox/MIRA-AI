import type { NavigatorScreenParams } from '@react-navigation/native';
import type { KundliReportType } from '../components/kundli/report/reports';

export type KundliStackParamList = {
  GenerateKundli: undefined;
  /** profileId = a saved kundli profile (name shown in the header); none = the user's own kundli */
  YourKundli: { profileId?: string; name?: string } | undefined;
};

export type MainTabParamList = {
  Home: undefined;
  /** sign: open the tab on this sign (default = the user's sun sign) */
  Horoscope: { sign?: string } | undefined;
  Kundli: NavigatorScreenParams<KundliStackParamList> | undefined;
  Panchang: undefined;
  /** The AstroGuide chat, shown with the tab bar */
  QueReport: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  Otp: undefined;
  Name: undefined;
  BirthDate: undefined;
  BirthTime: undefined;
  BirthPlace: undefined;
  Gender: undefined;
  Relationship: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  HoroscopeDetail: { sign?: string } | undefined;
  /** topic: career (default), finance, marriage or health */
  CareerInsights: { sign?: string; topic?: 'career' | 'finance' | 'marriage' | 'health' } | undefined;
  AstroGuide: undefined;
  Profile: undefined;
  EditProfile: undefined;
  Notification: undefined;
  PrivacySecurity: undefined;
  HelpSupport: undefined;
  RateApp: undefined;
  Wallet: undefined;
  WalletHistory: undefined;
  /** "Choose Your Plan": AI chat question packs bought from the wallet */
  Plans: undefined;
  /** full-screen kundli report; profileId = a saved kundli profile (default: the user's own) */
  KundliReport: { type: KundliReportType; profileId?: string; name?: string };
  /** A festival from Panchang -> Festivals and what it means for the user's rashi; date = YYYY-MM-DD */
  FestivalDetail: { name: string; date: string };
  /** Terms & Conditions / Privacy Policy / About from the CMS, shown in the app */
  Legal: { type?: 'terms' | 'privacy' | 'about' } | undefined;
};
