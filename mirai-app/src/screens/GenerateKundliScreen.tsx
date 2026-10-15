import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import GradientBackground from '../components/GradientBackground';
import ScreenHeader from '../components/ScreenHeader';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import PickerSheet from '../components/profile/PickerSheet';
import { fieldText } from '../components/profile/ProfileField';
import { MENU_CARD_ANGLE } from '../components/profile/MenuRow';
import { ErrorCard, InfoCard, LoadingView } from '../components/StateViews';
import { TAB_BAR_HEIGHT } from '../components/BottomTabBar';
import { findSign } from '../components/horoscope/zodiac';
import {
  BirthDate,
  clampBirthDate,
  DateWheels,
  DEFAULT_BIRTH_DATE,
  formatBirthDate,
} from '../components/kundli/BirthWheels';
import BirthDetailsSheet, { type BirthDetails, type BirthField } from '../components/kundli/BirthDetailsSheet';
import useApi from '../hooks/useApi';
import {
  createKundliProfile,
  deleteKundliProfile,
  listKundliProfiles,
  type CreateKundliProfileInput,
  type KundliProfile,
} from '../api/kundli';
import type { UpdateMeInput } from '../api/user';
import { ApiError, errorMessage } from '../api/client';
import CalendarIcon from '../assets/images/icon-calendar.svg';
import TrashIcon from '../assets/images/privacy-trash.svg';
import ChevronRight from '../assets/images/icon-chevron-right.svg';
import { birthDateToIso, birthTimeTo24h, useOnboarding } from '../context/OnboardingContext';
import type { KundliStackParamList, MainTabParamList } from '../navigation/types';
import { colors, fonts, MONTHS } from '../theme';

type Navigation = CompositeNavigationProp<
  NativeStackNavigationProp<KundliStackParamList, 'GenerateKundli'>,
  BottomTabNavigationProp<MainTabParamList>
>;

/** Open "Complete your details" sheet (see BirthDetailsSheet). */
type DetailsRequest = { mode: 'self' | 'other' | 'ask'; selfMissing: BirthField[]; dob: BirthDate };

const pad = (n: number) => String(n).padStart(2, '0');
const sameText = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** "1990-01-10" -> "10 Jan 1990"; "08:15" -> "8:15 AM" */
function profileWhen(p: KundliProfile) {
  const [y, m, d] = p.dateOfBirth.split('-').map(Number);
  const [h, min] = p.birthTime.split(':').map(Number);
  const date = `${d} ${MONTHS[m - 1].slice(0, 3)} ${y}`;
  const time = `${h % 12 === 0 ? 12 : h % 12}:${pad(min)} ${h < 12 ? 'AM' : 'PM'}`;
  return `${date} · ${time} · ${p.birthPlace}`;
}

/** lat / lon / tzone of a picked place suggestion for POST /kundli/profiles */
function kundliCoords(d: BirthDetails): Pick<CreateKundliProfileInput, 'lat' | 'lon' | 'tzone'> {
  if (!d.coords) return {};
  return { lat: d.coords.lat, lon: d.coords.lon, ...(d.coords.tzone !== null ? { tzone: d.coords.tzone } : {}) };
}

/** API error + its first field message, e.g. "Validation failed. Invalid place" */
function formatApiError(e: unknown) {
  const field = e instanceof ApiError ? e.errors[0]?.message : undefined;
  return field ? `${errorMessage(e)} ${field}` : errorMessage(e);
}

function isFuture(d: BirthDate) {
  const today = new Date();
  return new Date(d.year, d.month, d.day).getTime() > new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
}

/**
 * Figma "Generate your Kundli": one D.O.B field + the generate button, then the saved kundlis.
 * The D.O.B is prefilled with the user's own. Same D.O.B -> the user's own kundli built from
 * their profile (missing profile fields are asked in a sheet and saved with PUT /users/me);
 * a different D.O.B -> someone else's kundli (name, gender, time and place asked in the sheet).
 */
export default function GenerateKundliScreen() {
  const navigation = useNavigation<Navigation>();
  const insets = useSafeAreaInsets();
  const { data, saveProfile } = useOnboarding();

  // D.O.B, prefilled with the user's own until they pick another date
  const [dob, setDob] = useState<BirthDate | undefined>(data.birthDate);
  const dobPicked = useRef(false);
  useEffect(() => {
    if (!dobPicked.current) setDob(data.birthDate);
  }, [data.birthDate]);

  const [dateSheet, setDateSheet] = useState(false);
  const [draftDate, setDraftDate] = useState<BirthDate>(DEFAULT_BIRTH_DATE);

  const [details, setDetails] = useState<DetailsRequest | null>(null);
  const [working, setWorking] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const saved = useApi(listKundliProfiles, []);
  // Refresh the list whenever the screen comes back into focus (skip the first focus = mount)
  const focusedOnce = useRef(false);
  const reloadSaved = saved.reload;
  useFocusEffect(
    useCallback(() => {
      if (focusedOnce.current) reloadSaved();
      focusedOnce.current = true;
    }, [reloadSaved]),
  );

  const openProfile = (p: KundliProfile) => navigation.navigate('YourKundli', { profileId: p.id, name: p.name });

  /** Creates the kundli (or reopens an identical saved self kundli) and opens it. Throws API errors. */
  const createAndOpen = async (input: CreateKundliProfileInput) => {
    if (input.isSelf) {
      let profiles = saved.data;
      if (!profiles) profiles = await listKundliProfiles();
      const existing = profiles.find(
        p =>
          p.isSelf &&
          p.dateOfBirth === input.dateOfBirth &&
          p.birthTime === input.birthTime &&
          p.gender === input.gender &&
          sameText(p.name, input.name) &&
          sameText(p.birthPlace, input.birthPlace),
      );
      if (existing) {
        openProfile(existing);
        return;
      }
    }
    const profile = await createKundliProfile(input);
    saved.reload();
    openProfile(profile);
  };

  /** Profile fields the user's own kundli still needs. */
  const selfMissing = (): BirthField[] =>
    [
      data.name.trim().length < 2 && ('name' as const),
      !data.gender && ('gender' as const),
      !data.birthTime && ('time' as const),
      (data.birthPlace ?? '').trim().length < 2 && ('place' as const),
    ].filter((f): f is BirthField => !!f);

  const onGenerate = async () => {
    if (!dob) {
      setFormError('Please select the date of birth.');
      setDraftDate(DEFAULT_BIRTH_DATE);
      setDateSheet(true);
      return;
    }
    if (isFuture(dob)) {
      setFormError("The date of birth can't be in the future.");
      return;
    }
    setFormError(null);

    const ownIso = data.birthDate ? birthDateToIso(data.birthDate) : null;
    const missing = selfMissing();
    if (!ownIso) {
      // Unknown own D.O.B: let the user say whether this is them
      setDetails({ mode: 'ask', selfMissing: missing, dob });
      return;
    }
    if (birthDateToIso(dob) !== ownIso) {
      setDetails({ mode: 'other', selfMissing: missing, dob });
      return;
    }
    if (missing.length) {
      setDetails({ mode: 'self', selfMissing: missing, dob });
      return;
    }

    setWorking(true);
    try {
      await createAndOpen({
        name: data.name.trim(),
        gender: data.gender!,
        dateOfBirth: ownIso,
        birthTime: birthTimeTo24h(data.birthTime!),
        birthPlace: data.birthPlace!.trim(),
        isSelf: true,
      });
    } catch (e) {
      setFormError(formatApiError(e));
    } finally {
      setWorking(false);
    }
  };

  /** Sheet submit: saves missing profile fields (own kundli), then creates and opens it. */
  const onDetails = async (req: DetailsRequest, d: BirthDetails) => {
    const dateOfBirth = birthDateToIso(req.dob);
    if (d.who === 'other') {
      await createAndOpen({
        name: d.name,
        gender: d.gender!,
        dateOfBirth,
        birthTime: birthTimeTo24h(d.time!),
        birthPlace: d.place,
        ...kundliCoords(d),
        isSelf: false,
      });
      setDetails(null);
      return;
    }

    const patch: UpdateMeInput = {};
    if (!data.birthDate) patch.dateOfBirth = dateOfBirth;
    if (req.selfMissing.includes('name')) patch.fullName = d.name;
    if (req.selfMissing.includes('gender')) patch.gender = d.gender;
    if (req.selfMissing.includes('time')) patch.birthTime = birthTimeTo24h(d.time!);
    if (req.selfMissing.includes('place')) {
      patch.birthPlace = d.place;
      if (d.coords) {
        patch.lat = d.coords.lat;
        patch.long = d.coords.lon;
        if (d.coords.tzone !== null) patch.tzone = d.coords.tzone;
      }
    }
    const user = Object.keys(patch).length ? await saveProfile(patch) : null;

    await createAndOpen({
      name: patch.fullName ?? user?.fullName ?? data.name.trim(),
      gender: (patch.gender ?? data.gender)!,
      dateOfBirth,
      birthTime: patch.birthTime ?? birthTimeTo24h(data.birthTime!),
      birthPlace: patch.birthPlace ?? (data.birthPlace ?? '').trim(),
      ...(patch.birthPlace ? kundliCoords(d) : {}),
      isSelf: true,
    });
    setDetails(null);
  };

  const confirmDelete = (p: KundliProfile) => {
    Alert.alert('Delete kundli?', `${p.name}'s saved kundli will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteKundliProfile(p.id);
            saved.reload();
          } catch (e) {
            Alert.alert('Could not delete', errorMessage(e));
          }
        },
      },
    ]);
  };

  const profiles = saved.data ?? [];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <GradientBackground />

      {/* Kundli is a tab, so back returns to the Home tab */}
      <ScreenHeader title="Generate your Kundli" onBack={() => navigation.navigate('Home')} />

      <ScrollView
        style={styles.flex}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_HEIGHT + Math.max(12, insets.bottom) + 24 }]}
      >
        <Pressable
          onPress={() => {
            setDraftDate(dob ?? DEFAULT_BIRTH_DATE);
            setDateSheet(true);
          }}
          accessibilityRole="button"
          accessibilityLabel="Enter your date of birth"
        >
          <GlassCard angle={MENU_CARD_ANGLE} style={styles.dobBox}>
            <Text style={[fieldText.value, styles.flex, !!dob && styles.dobValue]} numberOfLines={1}>
              {dob ? formatBirthDate(dob) : 'Enter your D.O.B'}
            </Text>
            <CalendarIcon width={20} height={20} />
          </GlassCard>
        </Pressable>

        {!!formError && <Text style={styles.formError}>{formError}</Text>}

        <Button
          title={working ? 'Generating…' : 'Generate your Kundli'}
          onPress={onGenerate}
          disabled={working}
          style={styles.button}
        />

        {/* Saved kundlis */}
        <View style={styles.savedSection}>
          <Text style={styles.sectionTitle}>Saved Kundlis</Text>
          {saved.loading && !saved.data ? (
            <LoadingView />
          ) : saved.error && !saved.data ? (
            <ErrorCard error={saved.error} onRetry={saved.reload} />
          ) : profiles.length === 0 ? (
            <InfoCard
              title="No saved kundlis yet"
              message="Kundlis you generate for yourself, family and friends will be saved here."
            />
          ) : (
            profiles.map(p => (
              <SavedRow key={p.id} profile={p} onPress={() => openProfile(p)} onDelete={() => confirmDelete(p)} />
            ))
          )}
        </View>
      </ScrollView>

      <PickerSheet
        visible={dateSheet}
        title="Date of birth"
        onClose={() => setDateSheet(false)}
        onDone={() => {
          dobPicked.current = true;
          setDob(clampBirthDate(draftDate));
          setFormError(null);
          setDateSheet(false);
        }}
      >
        <DateWheels value={draftDate} onChange={setDraftDate} />
      </PickerSheet>

      {details && (
        <BirthDetailsSheet
          mode={details.mode}
          selfMissing={details.selfMissing}
          dateLabel={formatBirthDate(details.dob)}
          onClose={() => setDetails(null)}
          onSubmit={d => onDetails(details, d)}
          formatError={formatApiError}
        />
      )}
    </View>
  );
}

function SummaryChip({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  const sign = findSign(value);
  return (
    <View style={styles.chip}>
      <Text style={styles.chipLabel}>{label}</Text>
      <Text style={styles.chipValue}>{sign?.name ?? value}</Text>
    </View>
  );
}

function SavedRow({ profile, onPress, onDelete }: { profile: KundliProfile; onPress: () => void; onDelete: () => void }) {
  const s = profile.summary;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Open ${profile.name}'s kundli`}>
      <GlassCard angle={MENU_CARD_ANGLE} style={styles.savedCard}>
        <View style={styles.savedTop}>
          <View style={styles.savedText}>
            <View style={styles.savedNameRow}>
              <Text style={styles.savedName} numberOfLines={1}>
                {profile.name}
              </Text>
              {profile.isSelf && (
                <View style={styles.selfBadge}>
                  <Text style={styles.selfBadgeText}>You</Text>
                </View>
              )}
            </View>
            <Text style={styles.savedMeta} numberOfLines={2}>
              {profileWhen(profile)}
            </Text>
          </View>
          <Pressable
            onPress={onDelete}
            hitSlop={10}
            style={styles.deleteButton}
            accessibilityRole="button"
            accessibilityLabel={`Delete ${profile.name}'s kundli`}
          >
            <TrashIcon width={16} height={16} />
          </Pressable>
          <ChevronRight width={20} height={20} style={styles.chevron} />
        </View>
        {(s.sunSign || s.moonSign || s.ascendant) && (
          <View style={styles.chips}>
            <SummaryChip label="Sun" value={s.sunSign} />
            <SummaryChip label="Moon" value={s.moonSign} />
            <SummaryChip label="Asc" value={s.ascendant} />
          </View>
        )}
      </GlassCard>
    </Pressable>
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
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 18,
  },
  // Figma: 48dp glass input, 12 / 16 padding with the 1dp stroke inside
  dobBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 15,
  },
  dobValue: {
    color: colors.white,
  },
  formError: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: '#FF9C9C',
    includeFontPadding: false,
  },
  button: {
    marginTop: 4,
  },
  savedSection: {
    marginTop: 14,
    gap: 12,
  },
  sectionTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    lineHeight: 24,
    color: colors.white,
    includeFontPadding: false,
  },
  savedCard: {
    padding: 15,
    gap: 12,
  },
  savedTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  savedText: {
    flex: 1,
    gap: 2,
  },
  savedNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  savedName: {
    flexShrink: 1,
    fontFamily: fonts.semiBold,
    fontSize: 16,
    lineHeight: 24,
    color: colors.white,
    includeFontPadding: false,
  },
  selfBadge: {
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: 50,
    backgroundColor: colors.badgeBackground,
  },
  selfBadgeText: {
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 15,
    color: colors.badgeText,
    includeFontPadding: false,
  },
  savedMeta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
    includeFontPadding: false,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 40,
    backgroundColor: colors.iconButton,
  },
  chevron: {
    opacity: 0.8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: 'rgba(167, 216, 242, 0.1)',
  },
  chipLabel: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 16,
    color: colors.textMuted,
    includeFontPadding: false,
  },
  chipValue: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    lineHeight: 16,
    color: colors.white,
    includeFontPadding: false,
  },
});
