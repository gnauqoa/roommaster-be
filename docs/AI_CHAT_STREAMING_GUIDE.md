# AI Chat Streaming Integration Guide

## Overview

This document explains how to integrate the AI Chat streaming API with a **React Native (Expo)** mobile application. The API streams text responses from the AI assistant in real-time, allowing the frontend to display text as it's generated (similar to ChatGPT).

---

## API Endpoint

```
POST {{BASE_URL}}/v1/customer/ai/chat
```

### Request

| Header          | Value                         |
| --------------- | ----------------------------- |
| `Authorization` | `Bearer <customer_jwt_token>` |
| `Content-Type`  | `application/json`            |

```json
{
  "message": "What rooms are available for this weekend?"
}
```

### Response

| Header              | Value                       |
| ------------------- | --------------------------- |
| `Content-Type`      | `text/plain; charset=utf-8` |
| `Transfer-Encoding` | `chunked`                   |

The response is a **stream of text chunks** that arrive over time as the AI generates them.

---

## How Streaming Works

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         Streaming Flow                                    │
│                                                                          │
│  React Native App          Backend API              AI Model              │
│       │                        │                        │                │
│       │  POST /ai/chat         │                        │                │
│       │───────────────────────>│                        │                │
│       │                        │  streamText()          │                │
│       │                        │───────────────────────>│                │
│       │                        │                        │                │
│       │    chunk: "Hello"      │<─ ─ ─ "Hello" ─ ─ ─ ─ ─│                │
│       │<───────────────────────│                        │                │
│       │                        │                        │                │
│       │    chunk: ", I"        │<─ ─ ─ ", I" ─ ─ ─ ─ ─ ─│                │
│       │<───────────────────────│                        │                │
│       │                        │                        │                │
│       │    chunk: " can help"  │<─ ─ ─ " can help" ─ ─ ─│                │
│       │<───────────────────────│                        │                │
│       │                        │                        │                │
│       │    [stream ends]       │<─ ─ ─ [done] ─ ─ ─ ─ ─ │                │
│       │<───────────────────────│                        │                │
│                                                                          │
│  Result displayed: "Hello, I can help"                                   │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## React Native Implementation

### Option 1: Using `fetch` with ReadableStream (Recommended)

> **Note**: React Native's `fetch` has limited streaming support. You need to use a polyfill or the approach below.

#### Step 1: Install Dependencies

```bash
npx expo install expo-fetch
# or for manual polyfill approach:
npm install react-native-polyfill-globals text-encoding
```

#### Step 2: Create AI Chat Service

```typescript
// services/ai-chat.service.ts

import { getAuthToken } from './auth.service';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';

export interface StreamOptions {
  onChunk: (chunk: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: Error) => void;
}

/**
 * Send a message to the AI chat and stream the response
 */
export async function streamAIChat(message: string, options: StreamOptions): Promise<void> {
  const token = await getAuthToken();

  if (!token) {
    options.onError(new Error('Not authenticated'));
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/v1/customer/ai/chat`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    // Handle streaming response
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder('utf-8');
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        options.onComplete(fullText);
        break;
      }

      // Decode the chunk and append to full text
      const chunk = decoder.decode(value, { stream: true });
      fullText += chunk;
      options.onChunk(chunk);
    }
  } catch (error) {
    options.onError(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Alternative: Non-streaming fallback (if streaming doesn't work)
 * This waits for the complete response before returning
 */
export async function sendAIChatMessage(message: string): Promise<string> {
  const token = await getAuthToken();

  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE_URL}/v1/customer/ai/chat`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  return response.text();
}
```

#### Step 3: Create AI Chat Hook

```typescript
// hooks/useAIChat.ts

import { useState, useCallback, useRef } from 'react';
import { streamAIChat, sendAIChatMessage } from '../services/ai-chat.service';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export function useAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!userMessage.trim() || isLoading) return;

      setError(null);
      setIsLoading(true);

      // Add user message
      const userMsgId = Date.now().toString();
      const assistantMsgId = (Date.now() + 1).toString();

      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: 'user', content: userMessage },
        { id: assistantMsgId, role: 'assistant', content: '', isStreaming: true }
      ]);

      try {
        await streamAIChat(userMessage, {
          onChunk: (chunk) => {
            // Update the assistant message with each chunk
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMsgId ? { ...msg, content: msg.content + chunk } : msg
              )
            );
          },
          onComplete: (fullText) => {
            // Mark streaming as complete
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMsgId ? { ...msg, content: fullText, isStreaming: false } : msg
              )
            );
            setIsLoading(false);
          },
          onError: (err) => {
            setError(err.message);
            // Remove the empty assistant message on error
            setMessages((prev) => prev.filter((msg) => msg.id !== assistantMsgId));
            setIsLoading(false);
          }
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setIsLoading(false);
      }
    },
    [isLoading]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages
  };
}
```

#### Step 4: Create AI Chat Screen Component

```typescript
// app/ai-chat.tsx (or screens/AIChatScreen.tsx)

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAIChat, ChatMessage } from '../hooks/useAIChat';
import { Ionicons } from '@expo/vector-icons';

export default function AIChatScreen() {
  const { messages, isLoading, error, sendMessage, clearMessages } = useAIChat();
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = () => {
    if (inputText.trim() && !isLoading) {
      sendMessage(inputText.trim());
      setInputText('');
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View
      style={[
        styles.messageBubble,
        item.role === 'user' ? styles.userBubble : styles.assistantBubble
      ]}
    >
      <Text
        style={[styles.messageText, item.role === 'user' ? styles.userText : styles.assistantText]}
      >
        {item.content}
        {item.isStreaming && <Text style={styles.cursor}>▊</Text>}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>RoomMaster AI</Text>
        <TouchableOpacity onPress={clearMessages} style={styles.clearButton}>
          <Ionicons name="trash-outline" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              Ask me anything about rooms, bookings, or hotel services!
            </Text>
          </View>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your message..."
            placeholderTextColor="#999"
            multiline
            maxLength={2000}
            editable={!isLoading}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={isLoading || !inputText.trim()}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  clearButton: {
    padding: 8
  },
  errorBanner: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ffcdd2'
  },
  errorText: {
    color: '#c62828',
    textAlign: 'center'
  },
  messageList: {
    padding: 16,
    flexGrow: 1
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22
  },
  userText: {
    color: '#fff'
  },
  assistantText: {
    color: '#333'
  },
  cursor: {
    color: '#007AFF',
    opacity: 0.7
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 32
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: '#f5f5f5',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 8
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center'
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc'
  }
});
```

---

### Option 2: Using EventSource (Server-Sent Events)

If native `fetch` streaming doesn't work well in your Expo setup, you can modify the backend to use SSE format and use an EventSource polyfill:

```bash
npm install react-native-sse
```

```typescript
// Alternative using SSE
import EventSource from 'react-native-sse';

export function streamAIChatSSE(message: string, token: string, callbacks: StreamCallbacks) {
  const es = new EventSource(`${API_URL}/v1/customer/ai/chat/sse`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    method: 'POST',
    body: JSON.stringify({ message })
  });

  let fullText = '';

  es.addEventListener('message', (event) => {
    const chunk = event.data;
    fullText += chunk;
    callbacks.onChunk(chunk);
  });

  es.addEventListener('done', () => {
    callbacks.onComplete(fullText);
    es.close();
  });

  es.addEventListener('error', (error) => {
    callbacks.onError(new Error(error.message));
    es.close();
  });

  return () => es.close(); // Return cleanup function
}
```

---

### Option 3: Fallback to Non-Streaming

If streaming is problematic, you can always fall back to waiting for the complete response:

```typescript
// Simple non-streaming approach
export async function sendMessage(message: string): Promise<string> {
  const response = await fetch(`${API_URL}/v1/customer/ai/chat`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message })
  });

  // This waits for the entire response to complete
  const text = await response.text();
  return text;
}
```

---

## Troubleshooting

### Common Issues

| Issue                        | Solution                                                                                  |
| ---------------------------- | ----------------------------------------------------------------------------------------- |
| `response.body is null`      | React Native's fetch may not support streaming. Use `expo-fetch` or the SSE approach.     |
| `TextDecoder is not defined` | Install `text-encoding` polyfill: `npm install text-encoding` and import it.              |
| Stream chunks not arriving   | Check if your backend is properly flushing chunks. The AI SDK handles this automatically. |
| CORS errors                  | Ensure your backend has proper CORS configuration for the mobile app's origin.            |

### Testing the Stream

You can test the streaming endpoint with `curl`:

```bash
curl -X POST http://localhost:8080/v1/customer/ai/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, what rooms are available?"}' \
  --no-buffer
```

---

## Best Practices

1. **Show a typing indicator** while `isStreaming` is true
2. **Display text progressively** - update UI with each chunk for a smooth experience
3. **Handle errors gracefully** - show user-friendly error messages
4. **Implement retry logic** for network failures
5. **Add a cancel button** for long responses (use AbortController)
6. **Persist chat history** if needed (AsyncStorage or a database)
7. **Rate limit requests** to prevent abuse

---

## Example Usage

```typescript
// In your component
import { useAIChat } from '../hooks/useAIChat';

function ChatScreen() {
  const { messages, isLoading, sendMessage } = useAIChat();

  return (
    <View>
      {messages.map((msg) => (
        <ChatBubble key={msg.id} message={msg} isStreaming={msg.isStreaming} />
      ))}
      <ChatInput onSend={sendMessage} disabled={isLoading} />
    </View>
  );
}
```

---

## Related Files

- **Backend API**: `src/routes/v1/customer/ai-chat.route.ts`
- **Controller**: `src/controllers/customer/customer.ai-chat.controller.ts`
- **AI Agent**: `src/ai/agent.ts`

---

_Last updated: January 2026_
