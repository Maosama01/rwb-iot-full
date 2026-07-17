import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../api/client';

// ── Palette (mirrors the mobile app's greens) ────────────────────────────────
const GREEN = '#5C8D42';
const CREAM = '#FAF7F0';
const BORDER = '#E9ECEF';
const INK = '#1C1C1E';

const DEFAULT_GREETING =
  "Hi! I'm your Rawbin AI assistant. Ask me anything about your compost health or what you can put in the bin!";

interface Message {
  role: 'user' | 'ai';
  content: string;
}

export interface AskRawbinCardProps {
  /** CTA title shown on the in-screen card. */
  title?: string;
  /** CTA subtitle — use it to give the tab-specific hint. */
  subtitle?: string;
  /** First message the assistant shows when the chat opens. */
  greeting?: string;
  /** Extra style for the card container (e.g. margins for the host screen). */
  style?: StyleProp<ViewStyle>;
}

/**
 * Embeddable "Ask Rawbin" entry point. Renders an in-screen CTA card that opens
 * a full-screen chat modal backed by the existing POST /ai/ask endpoint (the same
 * bot used on the web dashboard). Device-scoped: it grounds answers on the first
 * accessible device's live telemetry, matching how the Dashboard picks a device.
 */
export function AskRawbinCard({
  title = 'Ask Rawbin AI',
  subtitle = 'Chat about your compost',
  greeting = DEFAULT_GREETING,
  style,
}: AskRawbinCardProps) {
  const insets = useSafeAreaInsets();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => [
    { role: 'ai', content: greeting },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [deviceLoading, setDeviceLoading] = useState(true);
  const [deviceError, setDeviceError] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);

  // Resolve the active device once (first accessible device — same rule as Dashboard).
  const loadDevice = useCallback(async () => {
    setDeviceLoading(true);
    setDeviceError(null);
    try {
      const res = await apiClient.get('/devices/');
      const devices = res.data;
      if (!devices || devices.length === 0) {
        setDeviceError('Pair a device to use the AI assistant.');
        setDeviceId(null);
      } else {
        setDeviceId(devices[0].id);
      }
    } catch (err: any) {
      setDeviceError('Could not load your devices. Try reopening the chat.');
      setDeviceId(null);
    } finally {
      setDeviceLoading(false);
    }
  }, []);

  const openChat = () => {
    setIsOpen(true);
    // Refetch the device on open if we don't have one yet (e.g. paired later).
    if (!deviceId) loadDevice();
  };

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, []);

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(scrollToBottom, 50);
      return () => clearTimeout(t);
    }
  }, [isOpen, messages, loading, scrollToBottom]);

  const handleSend = async () => {
    const question = input.trim();
    if (!question || loading || !deviceId) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setLoading(true);

    try {
      const res = await apiClient.post('/ai/ask', {
        device_id: deviceId,
        question,
      });
      const answer = res.data?.answer ?? "I'm not sure how to answer that.";
      setMessages((prev) => [...prev, { role: 'ai', content: answer }]);
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ||
        err?.message ||
        'Something went wrong. Please try again.';
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: `Sorry, I hit an error: ${detail}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || !deviceId;

  return (
    <>
      {/* In-screen CTA card */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={openChat}
        style={[styles.card, style]}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${subtitle}`}
      >
        <View style={styles.cardIcon}>
          <Ionicons name="sparkles" size={22} color="#FFFFFF" />
        </View>
        <View style={styles.cardTextWrap}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={GREEN} />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalRoot}>
          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <Ionicons name="sparkles" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.headerTitle}>Ask Rawbin</Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsOpen(false)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="Close assistant"
            >
              <Ionicons name="close" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={0}
          >
            {/* Messages */}
            <ScrollView
              ref={scrollRef}
              style={styles.messages}
              contentContainerStyle={styles.messagesContent}
              onContentSizeChange={scrollToBottom}
              keyboardShouldPersistTaps="handled"
            >
              {messages.map((msg, i) => (
                <View
                  key={i}
                  style={[
                    styles.bubbleRow,
                    msg.role === 'user' ? styles.rowRight : styles.rowLeft,
                  ]}
                >
                  <View
                    style={[
                      styles.bubble,
                      msg.role === 'user' ? styles.userBubble : styles.aiBubble,
                    ]}
                  >
                    <Text
                      style={msg.role === 'user' ? styles.userText : styles.aiText}
                    >
                      {msg.content}
                    </Text>
                  </View>
                </View>
              ))}

              {loading && (
                <View style={[styles.bubbleRow, styles.rowLeft]}>
                  <View style={[styles.bubble, styles.aiBubble, styles.thinking]}>
                    <ActivityIndicator size="small" color={GREEN} />
                    <Text style={[styles.aiText, styles.thinkingText]}>
                      Thinking...
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Input */}
            <View style={[styles.inputBar, { paddingBottom: insets.bottom + 12 }]}>
              {deviceError ? (
                <View style={styles.notice}>
                  <Text style={styles.noticeText}>{deviceError}</Text>
                </View>
              ) : null}
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={input}
                  onChangeText={setInput}
                  editable={!disabled}
                  placeholder={
                    deviceLoading
                      ? 'Loading your device...'
                      : deviceId
                      ? 'Ask about your compost...'
                      : 'No device available'
                  }
                  placeholderTextColor="#9AA0A6"
                  returnKeyType="send"
                  onSubmitEditing={handleSend}
                  multiline
                />
                <TouchableOpacity
                  onPress={handleSend}
                  disabled={disabled || !input.trim()}
                  style={[
                    styles.sendBtn,
                    (disabled || !input.trim()) && styles.sendBtnDisabled,
                  ]}
                  accessibilityLabel="Send message"
                >
                  <Ionicons name="send" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  // ── In-screen CTA card ──
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 20,
    padding: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextWrap: { flex: 1 },
  cardTitle: {
    fontSize: 16,
    color: INK,
    fontFamily: 'Nunito_700Bold',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6F6F6F',
    marginTop: 2,
    fontFamily: 'Nunito_400Regular',
  },

  // ── Chat modal ──
  modalRoot: { flex: 1, backgroundColor: CREAM },
  header: {
    backgroundColor: GREEN,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
  },
  messages: { flex: 1 },
  messagesContent: { padding: 16, gap: 12 },
  bubbleRow: { flexDirection: 'row' },
  rowLeft: { justifyContent: 'flex-start' },
  rowRight: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '85%',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: GREEN,
    borderTopRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER,
    borderTopLeftRadius: 4,
  },
  userText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 21,
    fontFamily: 'Nunito_400Regular',
  },
  aiText: {
    color: INK,
    fontSize: 15,
    lineHeight: 21,
    fontFamily: 'Nunito_400Regular',
  },
  thinking: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  thinkingText: { color: '#6F6F6F' },
  inputBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  notice: {
    backgroundColor: '#FDECEA',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  noticeText: { color: '#B3261E', fontSize: 13, fontFamily: 'Nunito_400Regular' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: CREAM,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 15,
    maxHeight: 120,
    color: INK,
    fontFamily: 'Nunito_400Regular',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
});

export default AskRawbinCard;
