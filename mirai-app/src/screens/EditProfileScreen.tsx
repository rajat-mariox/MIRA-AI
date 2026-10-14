import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
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
import Button from '../components/Button';
import WheelPicker, { WheelProfile } from '../components/WheelPicker';
import ProfileField, { fieldText, ProfileInput } from '../components/profile/ProfileField';
import PickerSheet from '../components/profile/PickerSheet';
import { PersonGlyph } from '../components/UserAvatar';
import useKeyboardHeight from '../hooks/useKeyboardHeight';
import EditIcon from '../assets/images/profile-edit-dark.svg';
import ChevronDown from '../assets/images/profile-chevron-down-small.svg';
import PhoneDivider from '../assets/images/profile-phone-divider.svg';
import CalendarIcon from '../assets/images/icon-calendar.svg';
import { birthDateToIso, useOnboarding } from '../context/OnboardingContext';
import { errorMessage } from '../api/client';
import type { RootStackParamList } from '../navigation/types';
import { colors, fonts, MONTHS } from '../theme';
import { resolveMediaUrl } from '../utils/media';

const PLACEHOLDERS = {
  name: 'Your name',
  email: 'abhi@gmail.com',
  phone: '7878798866',
  birthDate: 'DD : MM : YYYY',
};
const COUNTRY_CODES = [
  { code: '+91', country: 'India' },
  { code: '+1', country: 'United States' },
  { code: '+44', country: 'United Kingdom' },
  { code: '+61', country: 'Australia' },
  { code: '+971', country: 'United Arab Emirates' },
];

const FIRST_YEAR = 1900;
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - FIRST_YEAR + 1 }, (_, i) => String(FIRST_YEAR + i));
// Same wheel look as the onboarding date of birth picker
const SMALL = 22 / 24;
const DATE_PROFILE: WheelProfile = {
  offsets: [0, 31.7, 58, 78, 87],
  scaleX: [1, SMALL, SMALL, SMALL, SMALL],
  scaleY: [1, 0.9 * SMALL, 0.72 * SMALL, 0.5 * SMALL, 0.15 * SMALL],
  opacity: [1, 0.6, 0.5, 0.4, 0.3],
};
const WHEEL_HEIGHT = 178;
const ROW_HEIGHT = 32;

// Avatar frame (Figma 172×172 circle) and the placeholder image drawn inside it
const AVATAR_SIZE = 172;
const BADGE_OFFSET = 126;

type BirthDate = { day: number; month: number; year: number };
type FieldKey = 'name' | 'email' | 'phone';

function daysInMonth(month: number, year: number) {
  return new Date(year, month + 1, 0).getDate();
}

function formatBirthDate({ day, month, year }: BirthDate) {
  return `${day} : ${month + 1} : ${year}`;
}

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

export default function EditProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { data, user, saveProfile } = useOnboarding();
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(data.name);
  // The email is the login id; the API does not allow changing it, so the field is read-only
  const email = user?.email ?? data.email;
  // TODO: no phone field in the backend yet, so the number only lives on this screen
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0].code);
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState<BirthDate | undefined>(data.birthDate);

  const [countrySheet, setCountrySheet] = useState(false);
  const [dateSheet, setDateSheet] = useState(false);
  const [draftDate, setDraftDate] = useState<BirthDate>(
    data.birthDate ?? { day: 24, month: 1, year: Math.min(2026, CURRENT_YEAR) },
  );

  // Keep the focused input above the keyboard
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const fieldY = useRef<Record<FieldKey, number>>({ name: 0, email: 0, phone: 0 });
  const focused = useRef<FieldKey | null>(null);
  const scrollToFocused = useCallback(() => {
    const key = focused.current;
    if (!key) return;
    requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({ y: Math.max(0, fieldY.current[key] - 24), animated: true }),
    );
  }, []);
  const keyboardHeight = useKeyboardHeight(scrollToFocused);
  const fieldProps = (key: FieldKey) => ({
    onLayout: (e: { nativeEvent: { layout: { y: number } } }) => {
      fieldY.current[key] = e.nativeEvent.layout.y;
    },
  });
  const onFocus = (key: FieldKey) => () => {
    focused.current = key;
    if (keyboardHeight > 0) scrollToFocused();
  };

  const draftDays = daysInMonth(draftDate.month, draftDate.year);
  const days = useMemo(() => Array.from({ length: draftDays }, (_, i) => String(i + 1)), [draftDays]);
  const draftDay = Math.min(draftDate.day, draftDays);

  const openDateSheet = () => {
    Keyboard.dismiss();
    if (birthDate) setDraftDate(birthDate);
    setDateSheet(true);
  };
  const confirmDate = () => {
    setBirthDate({ ...draftDate, day: draftDay });
    setDateSheet(false);
  };

  // PUT /users/me with the changed fields
  const onSave = async () => {
    if (saving) return;
    const trimmed = name.trim();
    if (trimmed.length > 0 && trimmed.length < 2) {
      Alert.alert('Invalid name', 'Please enter at least 2 characters.');
      return;
    }
    const patch: { fullName?: string; dateOfBirth?: string } = {};
    if (trimmed && trimmed !== data.name) patch.fullName = trimmed;
    if (birthDate) {
      const iso = birthDateToIso(birthDate);
      if (!data.birthDate || iso !== birthDateToIso(data.birthDate)) patch.dateOfBirth = iso;
    }
    if (Object.keys(patch).length === 0) {
      navigation.goBack();
      return;
    }
    setSaving(true);
    try {
      await saveProfile(patch);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Could not save', errorMessage(e));
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <GradientBackground />
      <ScreenHeader title="Edit Profile" />

      <View style={[styles.flex, { paddingBottom: keyboardHeight }]}>
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: (keyboardHeight > 0 ? 0 : insets.bottom) + 30 },
          ]}
        >
          {/* Avatar */}
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              {user?.avatarUrl ? (
                <Image source={{ uri: resolveMediaUrl(user.avatarUrl) }} style={styles.avatarImage} />
              ) : (
                <PersonGlyph size={96} />
              )}
            </View>
            <Pressable
              style={styles.badge}
              // TODO: pick a photo once an image picker is added
              accessibilityRole="button"
              accessibilityLabel="Change photo"
            >
              <EditIcon width={16} height={16} />
            </Pressable>
          </View>

          <ProfileField label="Your Name" {...fieldProps('name')}>
            <ProfileInput
              value={name}
              onChangeText={setName}
              placeholder={PLACEHOLDERS.name}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
              onFocus={onFocus('name')}
            />
          </ProfileField>

          <ProfileField label="Your Email id" {...fieldProps('email')}>
            <ProfileInput
              value={email}
              editable={false}
              placeholder={PLACEHOLDERS.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              onFocus={onFocus('email')}
            />
          </ProfileField>

          <ProfileField label="Your mobile number" {...fieldProps('phone')}>
            <View style={styles.phoneRow}>
              <Pressable
                style={styles.countryCode}
                onPress={() => {
                  Keyboard.dismiss();
                  setCountrySheet(true);
                }}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Country code ${countryCode}`}
              >
                <Text style={fieldText.value}>{countryCode}</Text>
                <ChevronDown width={14} height={14} />
              </Pressable>
              <View style={styles.phoneDivider}>
                <PhoneDivider width={21} height={1} style={styles.phoneDividerLine} />
              </View>
              <ProfileInput
                value={phone}
                onChangeText={text => setPhone(text.replace(/[^0-9]/g, ''))}
                placeholder={PLACEHOLDERS.phone}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                maxLength={15}
                onFocus={onFocus('phone')}
              />
            </View>
          </ProfileField>

          <ProfileField label="Your birth detail" onPress={openDateSheet}>
            <Text style={[fieldText.value, styles.flex]} numberOfLines={1}>
              {birthDate ? formatBirthDate(birthDate) : PLACEHOLDERS.birthDate}
            </Text>
            <CalendarIcon width={24} height={24} />
          </ProfileField>

          <Button title="Save" onPress={onSave} disabled={saving} style={styles.saveButton} />
        </ScrollView>
      </View>

      <PickerSheet visible={countrySheet} title="Country code" onClose={() => setCountrySheet(false)}>
        <View>
          {COUNTRY_CODES.map(item => {
            const selected = item.code === countryCode;
            return (
              <Pressable
                key={item.code}
                style={[styles.countryRow, selected && styles.countryRowSelected]}
                onPress={() => {
                  setCountryCode(item.code);
                  setCountrySheet(false);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Text style={styles.countryText}>{item.country}</Text>
                <Text style={styles.countryText}>{item.code}</Text>
              </Pressable>
            );
          })}
        </View>
      </PickerSheet>

      <PickerSheet
        visible={dateSheet}
        title="Your birth detail"
        onClose={() => setDateSheet(false)}
        onDone={confirmDate}
      >
        <View style={styles.wheels}>
          <View style={styles.selection} />
          <WheelPicker
            items={days}
            selectedIndex={draftDay - 1}
            onChange={i => setDraftDate(d => ({ ...d, day: i + 1 }))}
            profile={DATE_PROFILE}
            height={WHEEL_HEIGHT}
            rowHeight={ROW_HEIGHT}
            textStyle={styles.wheelText}
            align="left"
            style={styles.dayColumn}
            accessibilityLabel="Day"
          />
          <WheelPicker
            items={MONTHS}
            selectedIndex={draftDate.month}
            onChange={i => setDraftDate(d => ({ ...d, month: i }))}
            profile={DATE_PROFILE}
            height={WHEEL_HEIGHT}
            rowHeight={ROW_HEIGHT}
            textStyle={styles.wheelText}
            style={styles.monthColumn}
            accessibilityLabel="Month"
            loop
          />
          <WheelPicker
            items={YEARS}
            selectedIndex={draftDate.year - FIRST_YEAR}
            onChange={i => setDraftDate(d => ({ ...d, year: FIRST_YEAR + i }))}
            profile={DATE_PROFILE}
            height={WHEEL_HEIGHT}
            rowHeight={ROW_HEIGHT}
            textStyle={styles.wheelText}
            align="right"
            style={styles.yearColumn}
            accessibilityLabel="Year"
          />
        </View>
      </PickerSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.black,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingTop: 24,
    paddingHorizontal: 20,
    gap: 24,
  },
  avatarWrap: {
    alignSelf: 'center',
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  badge: {
    position: 'absolute',
    left: BADGE_OFFSET,
    top: BADGE_OFFSET,
    padding: 10,
    borderRadius: 70,
    backgroundColor: colors.primary,
  },
  phoneRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  // The design draws the divider as a 21dp line rotated 90°, in a zero-width slot
  phoneDivider: {
    width: 0,
    height: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneDividerLine: {
    transform: [{ rotate: '90deg' }],
  },
  saveButton: {
    // Figma's ring is 50dp with the stroke inside; RN adds the 1dp border outside
    padding: 5,
  },
  countryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  countryRowSelected: {
    backgroundColor: 'rgba(167, 216, 242, 0.2)',
  },
  countryText: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.white,
    includeFontPadding: false,
  },
  wheels: {
    alignSelf: 'center',
    width: 297,
    height: WHEEL_HEIGHT,
  },
  selection: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: WHEEL_HEIGHT / 2 - 18,
    height: 36,
    borderRadius: 7,
    backgroundColor: colors.primary,
    opacity: 0.2,
  },
  wheelText: {
    // Poppins sits 2dp lower in its line box than in Figma (see BirthDateScreen)
    top: -2,
    fontFamily: fonts.regular,
    fontSize: 24,
    lineHeight: 36,
    color: colors.white,
    includeFontPadding: false,
  },
  dayColumn: {
    position: 'absolute',
    left: 16,
    width: 50,
  },
  monthColumn: {
    position: 'absolute',
    left: 69.5,
    width: 140,
  },
  yearColumn: {
    position: 'absolute',
    left: 211,
    width: 70,
  },
});
