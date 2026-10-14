import React, { useMemo } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import GradientBackground from '../components/GradientBackground';
import GlassCard from '../components/GlassCard';
import ScreenHeader from '../components/ScreenHeader';
import StatusBarShield, { useScrolledFromTop } from '../components/StatusBarShield';
import { ErrorCard, LoadingView } from '../components/StateViews';
import TermsIcon from '../assets/images/profile-terms.svg';
import useApi from '../hooks/useApi';
import { getCmsPage, type CmsType } from '../api/cms';
import type { RootStackParamList } from '../navigation/types';
import { colors, fonts, MONTHS } from '../theme';

const PAGES: Record<CmsType, { title: string; intro: string; footer: string }> = {
  terms: {
    title: 'Terms & Conditions',
    intro: 'Please read these terms carefully before using MIRAI.',
    footer: 'By using MIRAI you agree to these Terms & Conditions.',
  },
  privacy: {
    title: 'Privacy Policy',
    intro: 'How MIRAI collects, uses and protects your information.',
    footer: 'By using MIRAI you agree to this Privacy Policy.',
  },
  about: {
    title: 'About MIRAI',
    intro: 'Your companion for Vedic astrology, kundli and daily guidance.',
    footer: 'Thank you for being part of MIRAI.',
  },
};

type Section = { number?: string; title?: string; paragraphs: string[]; bullets: string[] };

const ENTITIES: Record<string, string> = {
  amp: '&',
  quot: '"',
  apos: "'",
  '#39': "'",
  lt: '<',
  gt: '>',
  nbsp: ' ',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
  ndash: '–',
  mdash: '—',
  hellip: '…',
};

function plain(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&([a-z]+|#\d+);/gi, (m, e: string) => ENTITIES[e.toLowerCase()] ?? m)
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/**
 * The CMS page is admin-edited HTML. Split it into sections at each heading (h1–h4); within a
 * section keep paragraphs and list items. A heading like "3. Payments" becomes a numbered card.
 */
function toSections(html: string): Section[] {
  const sections: Section[] = [];
  let current: Section = { paragraphs: [], bullets: [] };
  const push = () => {
    if (current.title || current.paragraphs.length || current.bullets.length) sections.push(current);
  };
  const blocks = html.match(/<(h[1-4]|p|li)[^>]*>[\s\S]*?<\/\1>/gi) ?? [html];
  for (const block of blocks) {
    const tag = block.match(/^<(\w+)/)?.[1]?.toLowerCase();
    const text = plain(block);
    if (!text) continue;
    if (tag && /^h[1-4]$/.test(tag)) {
      push();
      const m = text.match(/^(\d+)[.)]\s*(.+)$/);
      current = { number: m?.[1], title: m ? m[2] : text, paragraphs: [], bullets: [] };
    } else if (tag === 'li') {
      current.bullets.push(text);
    } else {
      current.paragraphs.push(text);
    }
  }
  push();
  return sections;
}

function formatDate(iso: unknown) {
  if (typeof iso !== 'string') return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Terms & Conditions / Privacy Policy / About, from the admin-managed CMS, shown in the app */
export default function LegalScreen() {
  const { scrolled, onScroll } = useScrolledFromTop();
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProp<RootStackParamList, 'Legal'>>();
  const type: CmsType = route.params?.type ?? 'terms';
  const page = PAGES[type];
  const cms = useApi(() => getCmsPage(type), [type]);
  const sections = useMemo(() => (cms.data ? toSections(cms.data.content ?? '') : []), [cms.data]);
  // A leading heading that only repeats the page title is dropped (the hero card shows it)
  const body =
    sections[0] && !sections[0].number && sections[0].title?.toLowerCase() === page.title.toLowerCase()
      ? [{ ...sections[0], title: undefined }, ...sections.slice(1)].filter(
          s => s.title || s.paragraphs.length || s.bullets.length,
        )
      : sections;
  const updated = formatDate(cms.data?.updatedAt);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <GradientBackground />
      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 21) + 24 }}
      >
        <ScreenHeader title={page.title} />

        <View style={styles.content}>
          {/* Hero */}
          <GlassCard angle={98.28} style={styles.hero}>
            <View style={styles.heroIcon}>
              <TermsIcon width={24} height={26} />
            </View>
            <Text style={styles.heroTitle}>{page.title}</Text>
            {!!updated && <Text style={styles.heroMeta}>Last updated: {updated}</Text>}
            <Text style={styles.heroIntro}>{page.intro}</Text>
          </GlassCard>

          {cms.loading ? (
            <LoadingView />
          ) : cms.error ? (
            <ErrorCard error={cms.error} onRetry={cms.reload} />
          ) : (
            <>
              {body.map((s, i) => (
                <GlassCard key={`${s.title ?? 'section'}-${i}`} angle={105.08} style={styles.section}>
                  {!!s.title && (
                    <View style={styles.sectionHeader}>
                      {!!s.number && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{s.number}</Text>
                        </View>
                      )}
                      <Text style={styles.sectionTitle}>{s.title}</Text>
                    </View>
                  )}
                  {s.paragraphs.map((p, j) => (
                    <Text key={j} style={styles.paragraph} selectable>
                      {p}
                    </Text>
                  ))}
                  {s.bullets.map((b, j) => (
                    <View key={`b${j}`} style={styles.bulletRow}>
                      <View style={styles.bulletDot} />
                      <Text style={[styles.paragraph, styles.bulletText]} selectable>
                        {b}
                      </Text>
                    </View>
                  ))}
                </GlassCard>
              ))}
              <Text style={styles.footer}>{page.footer}</Text>
            </>
          )}
        </View>
      </ScrollView>
      <StatusBarShield visible={scrolled} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.black,
  },
  content: {
    marginTop: 24,
    paddingHorizontal: 20,
    gap: 12,
  },
  // Paddings are the design value minus the 1px border
  hero: {
    alignItems: 'center',
    paddingVertical: 23,
    paddingHorizontal: 19,
    gap: 6,
    marginBottom: 8,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    backgroundColor: 'rgba(167, 216, 242, 0.16)',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  heroTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 20,
    lineHeight: 30,
    color: colors.white,
    textAlign: 'center',
    includeFontPadding: false,
  },
  heroMeta: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
    color: colors.primary,
    includeFontPadding: false,
  },
  heroIntro: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
    includeFontPadding: false,
  },
  section: {
    padding: 15,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(167, 216, 242, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(167, 216, 242, 0.4)',
  },
  badgeText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    lineHeight: 18,
    color: colors.primary,
    includeFontPadding: false,
  },
  sectionTitle: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 15,
    lineHeight: 22,
    color: colors.white,
    includeFontPadding: false,
  },
  paragraph: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 21,
    color: 'rgba(255, 255, 255, 0.8)',
    includeFontPadding: false,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 8,
    backgroundColor: colors.primary,
  },
  bulletText: {
    flex: 1,
  },
  footer: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
    textAlign: 'center',
    includeFontPadding: false,
  },
});
