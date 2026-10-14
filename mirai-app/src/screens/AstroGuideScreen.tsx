import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import GradientBackground from '../components/GradientBackground';
import ScreenHeader from '../components/ScreenHeader';
import MessageBubble, { ChatMessage } from '../components/chat/MessageBubble';
import SuggestionChips from '../components/chat/SuggestionChips';
import ChatInputBar from '../components/chat/ChatInputBar';
import QuotaChip from '../components/chat/QuotaChip';
import { TAB_BAR_HEIGHT } from '../components/BottomTabBar';
import useKeyboardHeight from '../hooks/useKeyboardHeight';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';
import { LoadingView } from '../components/StateViews';
import {
  createSession,
  getChatQuota,
  listMessages,
  listSessions,
  planRequired,
  sendMessage,
  type ChatMessageDto,
  type ChatQuota,
} from '../api/chat';
import { errorMessage } from '../api/client';
import { colors } from '../theme';

// Greeting from the design, always shown above the conversation (not stored on the server)
const WELCOME_TEXT =
  "🙏 Namaste! I'm your AI Astrology Guide. Ask me anything about your horoscope, birth chart, or cosmic energies.";
const SUGGESTIONS = [
  'What does my birth chart say?',
  'Career predictions for this month',
  'Tell me about my love life',
];
// Space under the input row in the design (home indicator area)
const BAR_BOTTOM = 37;
// Space under the input row while the keyboard is open
const BAR_BOTTOM_KEYBOARD = 12;

function formatTime(date: Date) {
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${String(h12).padStart(2, '0')}:${minutes} ${hours < 12 ? 'AM' : 'PM'}`;
}

let nextId = 0;
const newId = () => `local-${Date.now()}-${nextId++}`;

const toBubble = (m: ChatMessageDto): ChatMessage => ({
  id: m.id,
  role: m.role,
  text: m.content,
  time: formatTime(m.createdAt ? new Date(m.createdAt) : new Date()),
});

const TYPING_ID = 'typing';

export default function AstroGuideScreen() {
  const insets = useSafeAreaInsets();
  // Tab routes (Home) + root stack routes (Plans) reachable from both places this screen is shown
  const navigation = useNavigation<NavigationProp<MainTabParamList & RootStackParamList>>();
  // Shown as the Que & Report tab, with the tab bar under the input row
  const inTabs = useRoute().name === 'QueReport';
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const [welcome] = useState<ChatMessage>(() => ({
    id: 'welcome',
    role: 'assistant',
    text: WELCOME_TEXT,
    time: formatTime(new Date()),
  }));
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sending, setSending] = useState(false);
  // Free questions / plan left (GET /chat/quota); null until loaded or if it failed
  const [quota, setQuota] = useState<ChatQuota | null>(null);
  const mounted = useRef(true);

  // Refresh the quota on every focus, e.g. after buying a plan on the Plans screen
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getChatQuota()
        .then(q => active && setQuota(q))
        .catch(() => {
          // The chip is optional; the server still enforces the limit on send
        });
      return () => {
        active = false;
      };
    }, []),
  );

  const openPlans = useCallback(() => navigation.navigate('Plans'), [navigation]);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, []);
  const keyboardHeight = useKeyboardHeight(scrollToEnd);

  // Reuse the newest chat session (GET /chat/sessions) and load its messages
  useEffect(() => {
    mounted.current = true;
    (async () => {
      try {
        const { sessions } = await listSessions(1, 1);
        const session = sessions[0];
        if (session) {
          const res = await listMessages(session.id, { limit: 50 });
          if (!mounted.current) return;
          setSessionId(session.id);
          setHistory(res.messages.map(toBubble));
        }
      } catch {
        // History is optional: a new session is created on the first message
      } finally {
        if (mounted.current) setLoadingHistory(false);
      }
    })();
    return () => {
      mounted.current = false;
    };
  }, []);

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || sending) return;
    const localId = newId();
    setHistory(list => [
      ...list,
      { id: localId, role: 'user', text, time: formatTime(new Date()) },
      { id: TYPING_ID, role: 'assistant', text: 'Typing…', time: '' },
    ]);
    setDraft('');
    setSending(true);
    try {
      const id = sessionId ?? (await createSession()).id;
      if (!sessionId) setSessionId(id);
      const { userMessage, assistantMessage, quota: nextQuota } = await sendMessage(id, text);
      if (!mounted.current) return;
      setHistory(list => [
        ...list.filter(m => m.id !== TYPING_ID && m.id !== localId),
        toBubble(userMessage),
        toBubble(assistantMessage),
      ]);
      if (nextQuota) setQuota(nextQuota);
    } catch (e) {
      if (!mounted.current) return;
      const limit = planRequired(e);
      if (limit) {
        // Out of free questions and plans: the question was not sent. Put it back in the
        // input so it can be resent after buying a plan.
        setHistory(list => list.filter(m => m.id !== TYPING_ID && m.id !== localId));
        setDraft(current => current || text);
        setQuota(limit);
        openPlans();
        return;
      }
      // Keep the question, replace the typing bubble with the error
      setHistory(list => [
        ...list.filter(m => m.id !== TYPING_ID),
        { id: newId(), role: 'assistant', text: `⚠️ ${errorMessage(e)}`, time: formatTime(new Date()) },
      ]);
    } finally {
      if (mounted.current) setSending(false);
    }
  };

  const messages = [welcome, ...history];

  const keyboardOpen = keyboardHeight > 0;

  return (
    <View style={[styles.root, { paddingBottom: keyboardHeight }]}>
      <StatusBar barStyle="light-content" />
      <GradientBackground />
      <ScreenHeader
        title="Questions & Report ?"
        onBack={inTabs ? () => navigation.navigate('Home') : undefined}
      />
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <MessageBubble message={item} />}
        ListFooterComponent={loadingHistory ? <LoadingView /> : undefined}
        contentContainerStyle={styles.list}
        onContentSizeChange={scrollToEnd}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        style={styles.listView}
      />
      <View style={styles.chips}>
        {quota && (
          <View style={styles.quota}>
            <QuotaChip quota={quota} onPress={openPlans} />
          </View>
        )}
        <SuggestionChips suggestions={SUGGESTIONS} onSelect={send} />
      </View>
      <ChatInputBar
        value={draft}
        onChangeText={setDraft}
        onSend={() => send(draft)}
        bottomInset={
          keyboardOpen
            ? BAR_BOTTOM_KEYBOARD
            : inTabs
              ? TAB_BAR_HEIGHT + Math.max(12, insets.bottom) + 12
              : Math.max(BAR_BOTTOM, insets.bottom)
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.black,
  },
  listView: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 20,
    // Header divider ends at y = 115, the first bubble starts at y = 139
    paddingTop: 23,
    paddingBottom: 16,
    gap: 16,
  },
  chips: {
    paddingBottom: 16,
  },
  quota: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
});
