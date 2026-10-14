import React, { useState } from 'react';
import {
  Alert,
  Keyboard,
  Linking,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GradientBackground from '../components/GradientBackground';
import ScreenHeader from '../components/ScreenHeader';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import KeyboardAwareScroll from '../components/KeyboardAwareScroll';
import PickerSheet from '../components/profile/PickerSheet';
import ChevronRight from '../assets/images/wallet-chevron-right.svg';
import useKeyboardHeight from '../hooks/useKeyboardHeight';
import { EmptyText, ErrorCard, LoadingView } from '../components/StateViews';
import useApi from '../hooks/useApi';
import { getFaqs } from '../api/faq';
import { raiseDispute } from '../api/support';
import { errorMessage } from '../api/client';
import { colors, fonts } from '../theme';

// Contact details are static (no endpoint); FAQs come from GET /faq
const SUPPORT_EMAIL = 'Support@marai.com';
const SUPPORT_PHONE = '+1 (800) 123-4567';
const CONTACTS = [
  { title: 'Email Support', value: SUPPORT_EMAIL, url: `mailto:${SUPPORT_EMAIL}` },
  {
    title: 'Phone Support',
    value: SUPPORT_PHONE,
    url: `tel:${SUPPORT_PHONE.replace(/[^0-9+]/g, '')}`,
  },
];
const ISSUE_TYPES = ['Payment', 'Consultation', 'Report', 'App issue', 'Other'];

// Card fill angles from the design
const CONTACT_CARD_ANGLE = 109.16239758309595;
const FAQ_CARD_ANGLE = 104.24868095405425;
const DISPUTE_CARD_ANGLE = 94.52109159520276;
const ISSUE_FIELD_ANGLE = 116.4573602029347;
const DESCRIPTION_FIELD_ANGLE = 101.25819719023846;

const FIELD_TEXT_COLOR = 'rgba(255, 255, 255, 0.6)';

async function openUrl(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Unable to open', 'No app is available to handle this action.');
  }
}

export default function HelpSupportScreen() {
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const [issueType, setIssueType] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [issueSheet, setIssueSheet] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const faqs = useApi(getFaqs, []);

  const onSubmit = async () => {
    if (submitting) return;
    if (!issueType) {
      Alert.alert('Select an issue type', 'Please choose what your dispute is about.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Add a description', 'Please describe your issue so we can help.');
      return;
    }
    Keyboard.dismiss();
    setSubmitting(true);
    try {
      // POST /support; the server message includes the ticket number
      const { message } = await raiseDispute(issueType, description.trim());
      Alert.alert('Dispute submitted', message);
      setIssueType(null);
      setDescription('');
    } catch (e) {
      Alert.alert('Could not submit', errorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <GradientBackground />
      <ScreenHeader title="Help & Support" />

      <KeyboardAwareScroll
        contentContainerStyle={[
          styles.content,
          { paddingBottom: (keyboardHeight > 0 ? 0 : insets.bottom) + 25 },
        ]}
      >
        {/* Contact Us */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Contact Us</Text>
          {CONTACTS.map(item => (
            <Pressable
              key={item.title}
              onPress={() => openUrl(item.url)}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}, ${item.value}`}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <GlassCard angle={CONTACT_CARD_ANGLE} style={styles.contactCard}>
                <Text style={styles.cardText} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.cardText, styles.muted]} numberOfLines={1}>
                  {item.value}
                </Text>
              </GlassCard>
            </Pressable>
          ))}
        </View>

        {/* FAQs: the design shows every answer, so they are not collapsible */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>FAQs</Text>
          {faqs.loading ? (
            <LoadingView />
          ) : faqs.error ? (
            <ErrorCard error={faqs.error} onRetry={faqs.reload} />
          ) : (faqs.data ?? []).length === 0 ? (
            <EmptyText>No FAQs yet</EmptyText>
          ) : (
            <View style={styles.faqList}>
              {(faqs.data ?? []).map(item => (
                <GlassCard key={item.id ?? item._id} angle={FAQ_CARD_ANGLE} style={styles.faqCard}>
                  <Text style={styles.cardText}>{item.question}</Text>
                  <Text style={[styles.faqAnswer, styles.muted]}>{item.answer}</Text>
                </GlassCard>
              ))}
            </View>
          )}
        </View>

        {/* Raise a Dispute */}
        <View style={styles.disputeSection}>
          <Text style={styles.sectionLabel}>Raise a Dispute</Text>
          <GlassCard angle={DISPUTE_CARD_ANGLE} style={styles.disputeCard}>
            <View style={styles.field}>
              <Text style={styles.sectionLabel}>Issue Type</Text>
              <Pressable
                onPress={() => {
                  Keyboard.dismiss();
                  setIssueSheet(true);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Issue Type${issueType ? `, ${issueType}` : ''}`}
              >
                <GlassCard angle={ISSUE_FIELD_ANGLE} style={styles.issueBox}>
                  <Text
                    style={[styles.fieldValue, issueType ? styles.fieldValueSet : null]}
                    numberOfLines={1}
                  >
                    {issueType ?? 'Issue Type'}
                  </Text>
                  <ChevronRight width={24} height={24} style={styles.chevronDown} />
                </GlassCard>
              </Pressable>
            </View>

            <View style={styles.field}>
              <Text style={styles.sectionLabel}>Description</Text>
              <GlassCard angle={DESCRIPTION_FIELD_ANGLE} style={styles.descriptionBox}>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe your issue in detail..."
                  placeholderTextColor={FIELD_TEXT_COLOR}
                  selectionColor={colors.primary}
                  multiline
                  textAlignVertical="top"
                  style={[styles.fieldValue, styles.fieldValueSet, styles.descriptionInput]}
                  accessibilityLabel="Description"
                />
              </GlassCard>
            </View>

            <Button
              title={submitting ? 'Submitting…' : 'Submit Dispute'}
              onPress={onSubmit}
              disabled={submitting}
              style={styles.button}
            />
          </GlassCard>
        </View>
      </KeyboardAwareScroll>

      <PickerSheet visible={issueSheet} title="Issue Type" onClose={() => setIssueSheet(false)}>
        <View>
          {ISSUE_TYPES.map(type => {
            const selected = type === issueType;
            return (
              <Pressable
                key={type}
                style={[styles.option, selected && styles.optionSelected]}
                onPress={() => {
                  setIssueType(type);
                  setIssueSheet(false);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <Text style={styles.optionText}>{type}</Text>
              </Pressable>
            );
          })}
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
  content: {
    paddingTop: 24,
    paddingHorizontal: 20,
    gap: 24,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
    color: colors.white,
    includeFontPadding: false,
  },
  contactCard: {
    gap: 4,
    // Figma: 12 / 16 padding with the 1dp stroke inside the box
    paddingVertical: 11,
    paddingHorizontal: 15,
  },
  cardText: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.white,
    includeFontPadding: false,
  },
  muted: {
    opacity: 0.6,
  },
  faqList: {
    gap: 12,
  },
  faqCard: {
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 15,
  },
  faqAnswer: {
    // The answer box is 48dp high in the design (two 22dp lines)
    minHeight: 48,
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 22,
    color: colors.white,
    includeFontPadding: false,
  },
  disputeSection: {
    // 40dp from the last FAQ card in the design
    marginTop: 16,
    gap: 12,
  },
  disputeCard: {
    gap: 16,
    padding: 15,
  },
  field: {
    gap: 8,
  },
  issueBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 15,
  },
  fieldValue: {
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: FIELD_TEXT_COLOR,
    includeFontPadding: false,
  },
  fieldValueSet: {
    color: colors.white,
  },
  chevronDown: {
    opacity: 0.8,
    transform: [{ rotate: '90deg' }],
  },
  descriptionBox: {
    height: 120,
    paddingVertical: 11,
    paddingHorizontal: 15,
  },
  descriptionInput: {
    flex: 1,
    padding: 0,
  },
  button: {
    // Figma's ring is 50dp with the stroke inside; RN adds the 1dp border outside
    padding: 5,
  },
  pressed: {
    opacity: 0.8,
  },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  optionSelected: {
    backgroundColor: 'rgba(167, 216, 242, 0.2)',
  },
  optionText: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.white,
    includeFontPadding: false,
  },
});
