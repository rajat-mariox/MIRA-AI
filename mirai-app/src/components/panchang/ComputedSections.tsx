import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { BalamBlock, ChandrabalamTarabalam, PanchakaRahita } from '../../api/panchang';
import { formatClock } from '../../utils/astro';
import { colors, fonts, MONTHS } from '../../theme';

/**
 * Bodies of the "Chandrabalam & Tarabalam" and "Panchaka Rahita Muhurta & Udaya Lagna"
 * sections (the backend computes them from the day's Panchang).
 */

/** "2026-10-15 01:56:09" -> "01:56 AM", plus ", Oct 15" when it falls after the panchang date. */
function clock(value: string | null | undefined, day: string): string {
  if (!value) return '';
  const t = formatClock(value);
  const date = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date === day) return t;
  return `${t}, ${MONTHS[Number(date.slice(5, 7)) - 1].slice(0, 3)} ${Number(date.slice(8, 10))}`;
}

/** "10:46 PM – 12:28 AM, Oct 15": the date suffix only once, on the end (start <= end). */
const range = (start: string, end: string, day: string) => `${formatClock(start)} – ${clock(end, day)}`;

function Label({ children }: { children: string }) {
  return <Text style={styles.label}>{children.toUpperCase()}</Text>;
}

function Chips({ items, dim }: { items: string[]; dim?: boolean }) {
  return (
    <View style={styles.chips}>
      {items.map(name => (
        <View key={name} style={[styles.chip, dim && styles.chipDim]}>
          <Text style={[styles.chipText, dim && styles.chipTextDim]}>{name}</Text>
        </View>
      ))}
    </View>
  );
}

function Balam({ title, block, day }: { title: string; block: BalamBlock; day: string }) {
  return (
    <View style={styles.block}>
      <Label>{title}</Label>
      <Chips items={block.current} />
      <Text style={styles.muted}>
        {block.upto_time ? `Upto ${clock(block.upto_time, day)}` : 'Throughout the day'}
      </Text>
      {block.next.length > 0 && (
        <View style={styles.next}>
          <Label>Next</Label>
          <Chips items={block.next} dim />
        </View>
      )}
    </View>
  );
}

export function BalamView({ data }: { data: ChandrabalamTarabalam | undefined }) {
  if (!data || (!data.chandrabalams && !data.tarabalams)) return <Text style={styles.muted}>No details available.</Text>;
  return (
    <View style={styles.list}>
      {data.chandrabalams && <Balam title="Good Chandrabalam" block={data.chandrabalams} day={data.date} />}
      {data.chandrabalams && data.tarabalams && <View style={styles.rule} />}
      {data.tarabalams && <Balam title="Good Tarabalam" block={data.tarabalams} day={data.date} />}
      <Text style={styles.note}>Based on the Moon's sign and nakshatra at sunrise</Text>
    </View>
  );
}

const PANCHAK_TONE: Record<string, { color: string; background: string }> = {
  good: { color: '#05DF72', background: 'rgba(5, 223, 114, 0.16)' },
  raja: { color: '#FF932A', background: 'rgba(255, 147, 42, 0.18)' },
  bad: { color: '#FF6467', background: 'rgba(255, 100, 103, 0.18)' },
};

const toneOf = (panchak: string) => {
  const p = panchak.toLowerCase();
  return p.startsWith('good') ? PANCHAK_TONE.good : p.startsWith('raja') ? PANCHAK_TONE.raja : PANCHAK_TONE.bad;
};

function TimedRow({ left, time }: { left: React.ReactNode; time: string }) {
  return (
    <View style={styles.row}>
      {left}
      <Text style={styles.time}>{time}</Text>
    </View>
  );
}

export function PanchakView({ data }: { data: PanchakaRahita | undefined }) {
  if (!data || (data.panchak_rahita.length === 0 && data.uday_lagna.length === 0))
    return <Text style={styles.muted}>No details available.</Text>;
  const day = data.date;
  return (
    <View style={styles.list}>
      {data.panchak_rahita.length > 0 && (
        <View style={styles.block}>
          <Label>Panchaka Rahita Muhurta</Label>
          {data.panchak_rahita.map(p => {
            const tone = toneOf(p.panchak);
            return (
              <TimedRow
                key={`${p.panchak}-${p.start_time}`}
                time={range(p.start_time, p.end_time, day)}
                left={
                  <View style={[styles.status, { backgroundColor: tone.background }]}>
                    <Text style={[styles.statusText, { color: tone.color }]}>{p.panchak}</Text>
                  </View>
                }
              />
            );
          })}
        </View>
      )}
      {data.panchak_rahita.length > 0 && data.uday_lagna.length > 0 && <View style={styles.rule} />}
      {data.uday_lagna.length > 0 && (
        <View style={styles.block}>
          <Label>Udaya Lagna</Label>
          {data.uday_lagna.map(l => (
            <TimedRow
              key={`${l.sign}-${l.start_time}`}
              time={range(l.start_time, l.end_time, day)}
              left={<Text style={styles.sign}>{l.sign}</Text>}
            />
          ))}
        </View>
      )}
      <Text style={styles.note}>Sunrise to next sunrise, calculated from the day's Panchang</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 16,
  },
  block: {
    gap: 10,
  },
  next: {
    gap: 8,
    marginTop: 2,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1.5,
    color: colors.textMuted,
    includeFontPadding: false,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: 'rgba(167, 216, 242, 0.1)',
  },
  chipDim: {
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  chipText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.white,
    includeFontPadding: false,
  },
  chipTextDim: {
    color: colors.textMuted,
  },
  muted: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
    includeFontPadding: false,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  status: {
    flexShrink: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    lineHeight: 16,
    includeFontPadding: false,
  },
  sign: {
    flexShrink: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.white,
    includeFontPadding: false,
  },
  time: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSoft,
    textAlign: 'right',
    flexShrink: 1,
    includeFontPadding: false,
  },
  note: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 16,
    color: 'rgba(255, 255, 255, 0.4)',
    includeFontPadding: false,
  },
});
