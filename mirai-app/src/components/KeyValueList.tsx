import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import DividerLine from '../assets/images/panchang-muhurat-line.svg';
import { formatClock } from '../utils/astro';
import { colors, fonts } from '../theme';

type Row = { label: string; value: string };

const HIDDEN_KEYS = new Set(['isProfileComplete', 'svg', 'base64_image', 'image', 'images']);

/** snake_case / camelCase -> "Title Case" */
export function humanize(key: string): string {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase());
}

function isRange(v: unknown): v is { start_time: string; end_time: string } {
  return !!v && typeof v === 'object' && 'start_time' in (v as object);
}

function scalar(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'number') return String(Math.round(v * 100) / 100);
  if (typeof v === 'string') {
    // "2026-10-14 05:25:56" -> "05:25 AM"
    if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(v)) return formatClock(v);
    return v.trim() || null;
  }
  if (isRange(v)) return `${formatClock(v.start_time)} - ${formatClock(v.end_time)}`;
  return null;
}

/** Flattens a vendor payload (nested objects / arrays) into label / value rows. */
export function toRows(obj: unknown, prefix = '', depth = 0): Row[] {
  if (!obj || typeof obj !== 'object' || depth > 3) return [];
  const rows: Row[] = [];
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (HIDDEN_KEYS.has(k)) continue;
    const label = prefix ? `${prefix} ${humanize(k)}` : humanize(k);
    const s = scalar(v);
    if (s !== null) {
      rows.push({ label, value: s });
    } else if (Array.isArray(v)) {
      const parts = v.map(scalar).filter((x): x is string => !!x);
      if (parts.length === v.length && parts.length > 0) {
        rows.push({ label, value: parts.join(', ') });
      } else {
        v.forEach((item, i) => rows.push(...toRows(item, v.length > 1 ? `${label} ${i + 1}` : label, depth + 1)));
      }
    } else if (v && typeof v === 'object') {
      rows.push(...toRows(v, label, depth + 1));
    }
  }
  return rows;
}

/** Label / value list in the muhurat card's "Recommended for" typography. */
export default function KeyValueList({ data, emptyText = 'No details available.' }: { data: unknown; emptyText?: string }) {
  const rows = toRows(data);
  if (rows.length === 0) return <Text style={styles.label}>{emptyText}</Text>;
  return (
    <View style={styles.list}>
      {rows.map((r, i) => (
        <React.Fragment key={`${r.label}-${i}`}>
          {i > 0 && (
            <View style={styles.divider}>
              <DividerLine width="100%" height={1} style={styles.dividerLine} />
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>{r.label}</Text>
            <Text style={styles.value}>{r.value}</Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  row: {
    gap: 4,
  },
  label: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
    includeFontPadding: false,
  },
  value: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.15,
    color: colors.white,
    includeFontPadding: false,
  },
  divider: {
    height: 0,
  },
  dividerLine: {
    position: 'absolute',
    top: -1,
  },
});
