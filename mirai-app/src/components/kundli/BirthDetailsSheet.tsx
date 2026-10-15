import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SvgProps } from 'react-native-svg';
import GlassCard from '../GlassCard';
import Button from '../Button';
import TextField from '../TextField';
import PickerSheet from '../profile/PickerSheet';
import { MENU_CARD_ANGLE } from '../profile/MenuRow';
import useKeyboardHeight from '../../hooks/useKeyboardHeight';
import { BirthTime, DEFAULT_BIRTH_TIME, formatBirthTime, TimeWheels } from './BirthWheels';
import type { KundliGender } from '../../api/kundli';
import ClockIcon from '../../assets/images/icon-clock.svg';
import GenderMale from '../../assets/images/icon-gender-male.svg';
import GenderFemale from '../../assets/images/icon-gender-female.svg';
import TargetIcon from '../../assets/images/icon-target.svg';
import PlaceSuggestions from '../PlaceSuggestions';
import usePlaceAutocomplete, { type PickedPlace } from '../../hooks/usePlaceAutocomplete';
import { cardGradients, colors, fonts } from '../../theme';

export type BirthField = 'name' | 'gender' | 'time' | 'place';
export type Who = 'me' | 'other';

export type BirthDetails = {
  who: Who;
  name: string;
  gender?: KundliGender;
  time?: BirthTime;
  place: string;
  /** Coordinates of a picked place suggestion (typed places are geocoded by the backend) */
  coords?: { lat: number; lon: number; tzone: number | null };
};

type Props = {
  /**
   * 'self'  - the user's own kundli: asks only `selfMissing`
   * 'other' - someone else's: asks every field
   * 'ask'   - the user's own DOB is unknown, so they pick "Me" or "Someone else" first
   */
  mode: 'self' | 'other' | 'ask';
  /** fields missing from the user's profile (asked for 'self', and 'ask' + "Me") */
  selfMissing: BirthField[];
  /** the picked date, shown as context, e.g. "10 January 1990" */
  dateLabel: string;
  onClose: () => void;
  /** saves / creates; a thrown error is shown inline in the sheet */
  onSubmit: (details: BirthDetails) => Promise<void>;
  /** formats an API error for display */
  formatError: (e: unknown) => string;
};

const ALL_FIELDS: BirthField[] = ['name', 'gender', 'time', 'place'];

const GENDERS: { id: KundliGender; label: string; Icon: React.FC<SvgProps>; size: number }[] = [
  { id: 'male', label: 'Male', Icon: GenderMale, size: 20 },
  { id: 'female', label: 'Female', Icon: GenderFemale, size: 20 },
  { id: 'other', label: 'Other', Icon: TargetIcon, size: 16 },
];

/**
 * "Complete your details" bottom sheet of the Generate Kundli screen. Styled like
 * PickerSheet (glass card on a dimmed backdrop); mounted only while open, so its state
 * starts empty every time. The time field opens the shared time wheel PickerSheet.
 */
export default function BirthDetailsSheet({ mode, selfMissing, dateLabel, onClose, onSubmit, formatError }: Props) {
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();

  const [who, setWho] = useState<Who>(mode === 'other' ? 'other' : 'me');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<KundliGender | undefined>();
  const [time, setTime] = useState<BirthTime | undefined>();
  const [place, setPlace] = useState('');
  const [picked, setPicked] = useState<PickedPlace | null>(null);
  const places = usePlaceAutocomplete();
  const [timeSheet, setTimeSheet] = useState(false);
  const [draftTime, setDraftTime] = useState<BirthTime>(DEFAULT_BIRTH_TIME);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fields = who === 'me' ? selfMissing : ALL_FIELDS;
  const asks = (f: BirthField) => fields.includes(f);
  const forMe = who === 'me';

  const title = forMe ? 'Complete your details' : 'Birth details';
  const hint = forMe
    ? `We need a few more details for your kundli (${dateLabel}). They'll be saved to your profile.`
    : `Enter the details of the person born on ${dateLabel}.`;

  const submit = async () => {
    const missing = [
      asks('name') && name.trim().length < 2 && 'name',
      asks('gender') && !gender && 'gender',
      asks('time') && !time && 'time of birth',
      asks('place') && place.trim().length < 2 && 'place of birth',
    ].filter(Boolean);
    if (missing.length) {
      setError(`Please add the ${missing.join(', ')}.`);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const trimmed = place.trim();
      const coords =
        picked && picked.name === trimmed ? { lat: picked.lat, lon: picked.lon, tzone: picked.tzone } : undefined;
      await onSubmit({ who, name: name.trim(), gender, time, place: trimmed, coords });
    } catch (e) {
      setError(formatError(e));
      setBusy(false);
    }
  };

  const clearError = () => error && setError(null);

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={busy ? undefined : onClose} accessibilityLabel="Close" />
        <View
          style={[
            styles.sheetWrap,
            { paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom, 12) + 8 + keyboardHeight },
          ]}
        >
          <GlassCard angle={MENU_CARD_ANGLE} style={styles.sheet}>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.hint}>{hint}</Text>
              </View>

              {mode === 'ask' && (
                <View style={styles.group}>
                  <Text style={styles.label}>This kundli is for</Text>
                  <View style={styles.chips}>
                    {(
                      [
                        ['me', 'Me'],
                        ['other', 'Someone else'],
                      ] as const
                    ).map(([id, label]) => (
                      <Chip
                        key={id}
                        label={label}
                        selected={who === id}
                        onPress={() => {
                          setWho(id);
                          clearError();
                        }}
                      />
                    ))}
                  </View>
                </View>
              )}

              {asks('name') && (
                <TextField
                  label="Name"
                  value={name}
                  onChangeText={v => {
                    setName(v);
                    clearError();
                  }}
                  placeholder="Full name"
                  autoCapitalize="words"
                  maxLength={100}
                />
              )}

              {asks('gender') && (
                <View style={styles.group}>
                  <Text style={styles.label}>Gender</Text>
                  <View style={styles.chips}>
                    {GENDERS.map(g => (
                      <Chip
                        key={g.id}
                        label={g.label}
                        selected={g.id === gender}
                        Icon={g.Icon}
                        iconSize={g.size}
                        onPress={() => {
                          setGender(g.id);
                          clearError();
                        }}
                      />
                    ))}
                  </View>
                </View>
              )}

              {asks('time') && (
                <View style={styles.group}>
                  <Text style={styles.label}>Time of birth</Text>
                  <Pressable
                    onPress={() => {
                      setDraftTime(time ?? DEFAULT_BIRTH_TIME);
                      setTimeSheet(true);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Time of birth"
                    style={styles.box}
                  >
                    <Text style={[styles.boxText, !time && styles.placeholder]} numberOfLines={1}>
                      {time ? formatBirthTime(time) : 'HH : MM'}
                    </Text>
                    <ClockIcon width={20} height={20} />
                  </Pressable>
                </View>
              )}

              {asks('place') && (
                <TextField
                  label="Place of birth"
                  value={place}
                  onChangeText={v => {
                    setPlace(v);
                    setPicked(null);
                    places.onType(v);
                    clearError();
                  }}
                  placeholder="City of birth"
                  autoCapitalize="words"
                  maxLength={200}
                />
              )}
              {asks('place') && (
                <PlaceSuggestions
                  suggestions={places.suggestions}
                  loading={places.loading}
                  onPick={async s => {
                    setPlace(s.description || s.name);
                    clearError();
                    const p = await places.pick(s);
                    if (p) {
                      setPlace(p.name);
                      setPicked(p);
                    }
                  }}
                />
              )}

              {!!error && <Text style={styles.error}>{error}</Text>}

              <Button
                title={busy ? 'Generating…' : 'Generate your Kundli'}
                onPress={submit}
                disabled={busy}
                style={styles.button}
              />
            </ScrollView>
          </GlassCard>
        </View>
      </View>

      <PickerSheet
        visible={timeSheet}
        title="Time of birth"
        onClose={() => setTimeSheet(false)}
        onDone={() => {
          setTime(draftTime);
          clearError();
          setTimeSheet(false);
        }}
      >
        <TimeWheels value={draftTime} onChange={setDraftTime} />
      </PickerSheet>
    </Modal>
  );
}

/** Option chip (same look as the gender options on the onboarding / profile screens). */
function Chip({
  label,
  selected,
  onPress,
  Icon,
  iconSize = 20,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  Icon?: React.FC<SvgProps>;
  iconSize?: number;
}) {
  return (
    <Pressable style={styles.flex} onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected }}>
      <GlassCard
        angle={115.25}
        stops={selected ? cardGradients.selected : cardGradients.idle}
        borderColor={selected ? colors.primary : colors.cardBorder}
        style={styles.chip}
      >
        {Icon && (
          <View style={!selected && styles.dim}>
            <Icon width={iconSize} height={iconSize} />
          </View>
        )}
        <Text style={[styles.chipText, !selected && styles.dim]} numberOfLines={1}>
          {label}
        </Text>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sheetWrap: {
    maxHeight: '100%',
    paddingHorizontal: 20,
  },
  sheet: {
    flexShrink: 1,
    borderRadius: 20,
    backgroundColor: colors.onPrimary,
  },
  scroll: {
    flexGrow: 0,
  },
  content: {
    padding: 15,
    gap: 16,
  },
  header: {
    gap: 4,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 20,
    lineHeight: 30,
    color: colors.white,
    includeFontPadding: false,
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
    includeFontPadding: false,
  },
  group: {
    gap: 8,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
    color: colors.white,
    includeFontPadding: false,
  },
  chips: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
    borderRadius: 50,
  },
  chipText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.white,
    includeFontPadding: false,
  },
  dim: {
    opacity: 0.6,
  },
  // Same box as TextField
  box: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 0.636,
    borderColor: colors.inputBorder,
    backgroundColor: colors.inputBackground,
  },
  boxText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.white,
    includeFontPadding: false,
  },
  placeholder: {
    color: colors.placeholder,
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: '#FF9C9C',
    includeFontPadding: false,
  },
  button: {
    marginTop: 4,
    // Figma's ring is 50dp with the stroke inside; RN adds the 1dp border outside
    padding: 5,
  },
});
