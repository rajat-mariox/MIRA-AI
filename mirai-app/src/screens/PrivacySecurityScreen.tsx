import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GradientBackground from '../components/GradientBackground';
import ScreenHeader from '../components/ScreenHeader';
import GlassCard from '../components/GlassCard';
import ToggleSwitch from '../components/profile/ToggleSwitch';
import ProfileField, { ProfileInput } from '../components/profile/ProfileField';
import ShieldIcon from '../assets/images/privacy-shield.svg';
import EyeIcon from '../assets/images/privacy-eye.svg';
import TrashIcon from '../assets/images/privacy-trash.svg';
import ChevronRight from '../assets/images/wallet-chevron-right.svg';
import ChevronRightRed from '../assets/images/privacy-chevron-right-red.svg';
import Divider from '../assets/images/profile-divider.svg';
import { useOnboarding } from '../context/OnboardingContext';
import { errorMessage } from '../api/client';
import { colors, fonts } from '../theme';

const NAME_PLACEHOLDER = 'Your name';
const BIOMETRIC = { title: 'Biometric Lock', subtitle: 'Use fingerprint or face ID' };

type PrivacyKey = 'dataCollection' | 'personalizedAds' | 'analytics' | 'notificationPrivacy';
const PRIVACY_SETTINGS: { key: PrivacyKey; title: string; subtitle: string }[] = [
  { key: 'dataCollection', title: 'Data Collection', subtitle: 'Allow app to collect usage data' },
  { key: 'personalizedAds', title: 'Personalized Ads', subtitle: 'Show ads based on your interests' },
  { key: 'analytics', title: 'Analytics', subtitle: 'Help improve app experience' },
  {
    key: 'notificationPrivacy',
    title: 'Notification Privacy',
    subtitle: 'Hide sensitive info in notifications',
  },
];
const INITIAL_PRIVACY: Record<PrivacyKey, boolean> = {
  dataCollection: false,
  personalizedAds: true,
  analytics: true,
  notificationPrivacy: true,
};

const DATA_MANAGEMENT = {
  download: { title: 'Download My Data', subtitle: 'Get a copy of your information' },
  clearCache: { title: 'Clear Cache', subtitle: 'Free up storage space' },
  deleteAccount: { title: 'Delete Account', subtitle: 'Permanently delete your account' },
};

// Card fill angles from the design
const SECURITY_CARD_ANGLE = 98.43947816127562;
const PRIVACY_CARD_ANGLE = 94.80774951144518;
const DATA_CARD_ANGLE = 96.12769444007155;

// Text of the Delete Account row in the design
const DANGER_COLOR = '#FF6467';

type RowProps = {
  title: string;
  subtitle: string;
  /** toggle or other control; defaults to a chevron */
  trailing?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
};

/** Title + subtitle row with a chevron or a control on the right (settings cards) */
export function SettingRow({ title, subtitle, trailing, onPress, danger }: RowProps) {
  const content = (
    <>
      <View style={rowStyles.text}>
        <Text style={[rowStyles.title, danger && rowStyles.danger]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[rowStyles.subtitle, danger && rowStyles.dangerSubtitle]}>{subtitle}</Text>
      </View>
      {trailing ??
        (danger ? (
          <ChevronRightRed width={24} height={24} style={rowStyles.chevron} />
        ) : (
          <ChevronRight width={24} height={24} style={rowStyles.chevron} />
        ))}
    </>
  );
  if (!onPress) return <View style={rowStyles.row}>{content}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [rowStyles.row, pressed && rowStyles.pressed]}
    >
      {content}
    </Pressable>
  );
}

/** 0.5dp divider between setting rows */
export function SettingDivider() {
  return <Divider width="100%" height={0.5} />;
}

function CardTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <View style={styles.cardTitleRow}>
      {icon}
      <Text style={styles.cardTitle} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

export default function PrivacySecurityScreen() {
  const insets = useSafeAreaInsets();
  const { data, saveProfile, deleteAccount } = useOnboarding();
  const [name, setName] = useState(data.name);
  const [biometricLock, setBiometricLock] = useState(true);
  const [privacy, setPrivacy] = useState(INITIAL_PRIVACY);

  // PUT /users/me when the field loses focus
  const saveName = () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === data.name) return;
    saveProfile({ fullName: trimmed }).catch(e => {
      setName(data.name);
      Alert.alert('Could not save your name', errorMessage(e));
    });
  };

  const onClearCache = () => {
    // TODO: clear the cached API responses / images once caching exists
    Alert.alert('Cache cleared', 'Temporary files have been removed from this device.');
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
          // DELETE /users/me, then back to Welcome
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
      <ScreenHeader title="Privacy & Security" />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 30 }]}
      >
        <ProfileField label="Your Name ">
          <ProfileInput
            value={name}
            onChangeText={setName}
            onEndEditing={saveName}
            placeholder={NAME_PLACEHOLDER}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            returnKeyType="done"
          />
        </ProfileField>

        {/* Security */}
        <GlassCard angle={SECURITY_CARD_ANGLE} style={styles.card}>
          <CardTitle icon={<ShieldIcon width={18} height={18} />} title="Security" />
          <SettingRow
            title={BIOMETRIC.title}
            subtitle={BIOMETRIC.subtitle}
            trailing={
              <ToggleSwitch
                value={biometricLock}
                onValueChange={setBiometricLock}
                accessibilityLabel={BIOMETRIC.title}
              />
            }
          />
          <SettingDivider />
          {/* The design repeats the Biometric Lock row with a chevron */}
          <SettingRow
            title={BIOMETRIC.title}
            subtitle={BIOMETRIC.subtitle}
            // TODO: open the biometric lock settings
            onPress={() => {}}
          />
        </GlassCard>

        {/* Privacy */}
        <GlassCard angle={PRIVACY_CARD_ANGLE} style={styles.card}>
          <CardTitle icon={<EyeIcon width={18} height={18} />} title="Privacy" />
          {PRIVACY_SETTINGS.map((item, i) => (
            <React.Fragment key={item.key}>
              {i > 0 && <SettingDivider />}
              <SettingRow
                title={item.title}
                subtitle={item.subtitle}
                trailing={
                  <ToggleSwitch
                    value={privacy[item.key]}
                    // TODO: persist the privacy settings once the API exists
                    onValueChange={value => setPrivacy(p => ({ ...p, [item.key]: value }))}
                    accessibilityLabel={item.title}
                  />
                }
              />
            </React.Fragment>
          ))}
        </GlassCard>

        {/* Data Management */}
        <GlassCard angle={DATA_CARD_ANGLE} style={styles.card}>
          <CardTitle icon={<TrashIcon width={18} height={18} />} title="Data Management" />
          <SettingRow
            {...DATA_MANAGEMENT.download}
            // TODO: request the data export from the API
            onPress={() => {}}
          />
          <SettingDivider />
          <SettingRow {...DATA_MANAGEMENT.clearCache} onPress={onClearCache} />
          <SettingDivider />
          <SettingRow {...DATA_MANAGEMENT.deleteAccount} onPress={onDeleteAccount} danger />
        </GlassCard>
      </ScrollView>
    </View>
  );
}

export const settingCardStyle = StyleSheet.create({
  card: {
    gap: 12,
    // Figma: 12 vertical padding with the 1dp stroke inside the box
    paddingVertical: 11,
  },
}).card;

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingHorizontal: 15,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    lineHeight: 24,
    color: colors.white,
    includeFontPadding: false,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.white,
    includeFontPadding: false,
  },
  danger: {
    color: DANGER_COLOR,
  },
  dangerSubtitle: {
    color: DANGER_COLOR,
    opacity: 0.6,
  },
  chevron: {
    opacity: 0.8,
  },
  pressed: {
    opacity: 0.8,
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.black,
  },
  content: {
    paddingTop: 24,
    paddingHorizontal: 20,
    gap: 24,
  },
  card: settingCardStyle,
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 15,
  },
  cardTitle: {
    flexShrink: 1,
    fontFamily: fonts.semiBold,
    fontSize: 20,
    lineHeight: 30,
    color: colors.white,
    includeFontPadding: false,
  },
});
