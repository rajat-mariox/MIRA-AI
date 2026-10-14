import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import GradientBackground from '../components/GradientBackground';
import ScreenHeader from '../components/ScreenHeader';
import GlassCard from '../components/GlassCard';
import MenuRow from '../components/profile/MenuRow';
import ToggleSwitch from '../components/profile/ToggleSwitch';
import LogoutDialog from '../components/profile/LogoutDialog';
import UserOctagon from '../assets/images/profile-user-octagon.svg';
import EditIcon from '../assets/images/profile-edit.svg';
import BellIcon from '../assets/images/profile-bell.svg';
import Divider from '../assets/images/profile-divider.svg';
import GlobeIcon from '../assets/images/profile-globe.svg';
import ChevronDown from '../assets/images/profile-chevron-down.svg';
import ShieldIcon from '../assets/images/profile-shield.svg';
import HelpIcon from '../assets/images/profile-help.svg';
import TermsIcon from '../assets/images/profile-terms.svg';
import StarIcon from '../assets/images/profile-star.svg';
import LogoutIcon from '../assets/images/profile-logout.svg';
import TrashIcon from '../assets/images/profile-trash.svg';
import { useOnboarding } from '../context/OnboardingContext';
import { useFocusEffect } from '@react-navigation/native';
import { findSign } from '../components/horoscope/zodiac';
import { errorMessage } from '../api/client';
import type { NotificationPrefKey, NotificationPrefs } from '../api/user';
import type { RootStackParamList } from '../navigation/types';
import { colors, fonts } from '../theme';

// No membership / plan subscription exists in the backend yet: static label from the design
const LANGUAGE = 'English';

const NOTIFICATIONS: { key: NotificationPrefKey; title: string; subtitle: string }[] = [
  { key: 'daily', title: 'Daily Horoscope', subtitle: 'Get daily predictions' },
  { key: 'weekly', title: 'Weekly Insights', subtitle: 'Weekly astrology updates' },
  { key: 'festival', title: 'Festival Alerts', subtitle: 'Upcoming festivals & events' },
  { key: 'muhurat', title: 'Muhurat Reminders', subtitle: 'Auspicious timing alerts' },
];
// Backend defaults (user.notificationPrefs; older cached users may not have it yet)
const DEFAULT_PREFS: NotificationPrefs = {
  daily: true,
  weekly: true,
  festival: true,
  muhurat: true,
};

// Card fill angles from the design
const USER_CARD_ANGLE = 105.08237252216126;
const NOTIFICATIONS_CARD_ANGLE = 94.80774951144518;

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export default function ProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { data, user, refreshUser, saveProfile, logout, deleteAccount } = useOnboarding();
  // user.notificationPrefs, saved with PUT /users/me (optimistic, reverted on error)
  const serverPrefs = user?.notificationPrefs;
  const [notifications, setNotifications] = useState<NotificationPrefs>({ ...DEFAULT_PREFS, ...serverPrefs });
  const pendingSaves = useRef(0);
  useEffect(() => {
    // Follow the saved prefs (load / refresh), but not while a toggle is still being saved
    if (serverPrefs && pendingSaves.current === 0) setNotifications({ ...DEFAULT_PREFS, ...serverPrefs });
  }, [serverPrefs]);

  const onToggleNotification = useCallback(
    (key: NotificationPrefKey, value: boolean) => {
      setNotifications(n => ({ ...n, [key]: value }));
      pendingSaves.current++;
      saveProfile({ notificationPrefs: { [key]: value } })
        .catch(e => {
          setNotifications(n => ({ ...n, [key]: !value }));
          Alert.alert('Could not update notifications', errorMessage(e));
        })
        .finally(() => {
          pendingSaves.current--;
        });
    },
    [saveProfile],
  );
  const [logoutVisible, setLogoutVisible] = useState(false);
  const sign = findSign(user?.zodiacSign ?? undefined)?.name;

  // GET /users/me each time the screen is shown (e.g. after Edit Profile)
  useFocusEffect(
    React.useCallback(() => {
      refreshUser();
    }, [refreshUser]),
  );

  const onLogOut = () => setLogoutVisible(true);
  // POST /auth/logout, then clear the session and go to Welcome (even if the call fails)
  const onConfirmLogOut = () => {
    setLogoutVisible(false);
    logout();
  };

  const onDeleteAccount = () =>
    Alert.alert(
      'Delete Account',
      'This permanently deletes your account and all your data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteAccount().catch(e => Alert.alert('Could not delete account', errorMessage(e)));
          },
        },
      ],
    );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <GradientBackground />
      <ScreenHeader title="Profile" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}
      >
        {/* User card */}
        <GlassCard angle={USER_CARD_ANGLE} style={styles.userCard}>
          <View style={styles.avatar}>
            <UserOctagon width={40} height={40} />
          </View>
          <View style={styles.userText}>
            <Pressable
              style={styles.nameRow}
              onPress={() => navigation.navigate('EditProfile')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
            >
              <Text style={styles.name} numberOfLines={1}>
                {user?.fullName || data.name || 'Your name'}
              </Text>
              <EditIcon width={16} height={16} />
            </Pressable>
            <View>
              <Text style={styles.email} numberOfLines={1}>
                {user?.email || data.email}
              </Text>
              {/* The user's sign; no membership tier here, nothing in the backend decides one */}
              {!!sign && (
                <Text style={styles.membership} numberOfLines={1}>
                  {sign}
                </Text>
              )}
            </View>
          </View>
        </GlassCard>

        {/* Notifications */}
        <GlassCard angle={NOTIFICATIONS_CARD_ANGLE} style={styles.notificationsCard}>
          <View style={styles.notificationsHeader}>
            <BellIcon width={18} height={18} />
            <Text style={styles.notificationsTitle} numberOfLines={1}>
              Notifications
            </Text>
          </View>
          {NOTIFICATIONS.map((item, i) => (
            <React.Fragment key={item.key}>
              {i > 0 && <Divider width="100%" height={0.5} />}
              <View style={styles.notificationRow}>
                <View style={styles.notificationText}>
                  <Text style={styles.notificationTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.notificationSubtitle}>{item.subtitle}</Text>
                </View>
                <ToggleSwitch
                  value={notifications[item.key]}
                  onValueChange={value => onToggleNotification(item.key, value)}
                  accessibilityLabel={item.title}
                />
              </View>
            </React.Fragment>
          ))}
        </GlassCard>

        {/* Menu */}
        <MenuRow
          label={LANGUAGE}
          icon={<GlobeIcon width={18} height={18} />}
          iconGap={10}
          // The design rotates chevron-down by -90° here instead of using chevron-right
          trailing={<ChevronDown width={24} height={24} style={styles.chevronRight} />}
          // TODO: open the language picker
        />
        <View style={styles.menu}>
          <MenuRow
            label="Privacy & Security"
            icon={<ShieldIcon width={19.9995} height={19.9995} />}
            onPress={() => navigation.navigate('PrivacySecurity')}
          />
          <MenuRow
            label="Help & Support"
            icon={<HelpIcon width={19.9995} height={19.9995} />}
            onPress={() => navigation.navigate('HelpSupport')}
          />
          <MenuRow
            label="Terms and Conditions"
            icon={
              <View style={styles.icon20}>
                <TermsIcon width={16.55} height={17.9408} style={styles.termsIcon} />
              </View>
            }
            onPress={() => navigation.navigate('Legal', { type: 'terms' })}
          />
          <MenuRow
            label="Rate mirai app"
            icon={<StarIcon width={20} height={20} />}
            onPress={() => navigation.navigate('RateApp')}
          />
          <MenuRow label="Log Out" icon={<LogoutIcon width={20} height={20} />} onPress={onLogOut} />
          <MenuRow
            label="Delete Account"
            icon={
              <View style={styles.icon20}>
                <TrashIcon width={16.875} height={18.125} style={styles.trashIcon} />
              </View>
            }
            onPress={onDeleteAccount}
          />
        </View>
      </ScrollView>

      <LogoutDialog
        visible={logoutVisible}
        onConfirm={onConfirmLogOut}
        onCancel={() => setLogoutVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.black,
  },
  content: {
    paddingTop: 24,
    paddingHorizontal: 20,
    gap: 10,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    // Figma: 16 padding with the 1dp stroke inside the box
    padding: 15,
  },
  avatar: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: 'rgba(168, 217, 242, 0.2)',
  },
  userText: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 10,
  },
  name: {
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: 0.2,
    color: colors.white,
    includeFontPadding: false,
  },
  email: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.white,
    includeFontPadding: false,
  },
  membership: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
    color: '#A8D8F2',
    includeFontPadding: false,
  },
  notificationsCard: {
    gap: 12,
    // Figma: 12 vertical padding with the 1dp stroke inside the box
    paddingVertical: 11,
  },
  notificationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 15,
  },
  notificationsTitle: {
    flexShrink: 1,
    fontFamily: fonts.semiBold,
    fontSize: 20,
    lineHeight: 30,
    color: colors.white,
    includeFontPadding: false,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  notificationText: {
    flex: 1,
    gap: 2,
  },
  notificationTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    lineHeight: 24,
    color: colors.white,
    includeFontPadding: false,
  },
  notificationSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.white,
    includeFontPadding: false,
  },
  menu: {
    gap: 10,
  },
  chevronRight: {
    transform: [{ rotate: '-90deg' }],
  },
  icon20: {
    width: 20,
    height: 20,
  },
  // Positions of the vectors inside their 20×20 icon frames
  termsIcon: {
    position: 'absolute',
    left: 1.724,
    top: 1.048,
  },
  trashIcon: {
    position: 'absolute',
    left: 1.5625,
    top: 0.9375,
  },
});
